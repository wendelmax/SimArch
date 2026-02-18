using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using SimArch.Decision;
using SimArch.DSL;
using SimArch.Export;
using SimArch.Simulation;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((ctx, lc) =>
{
    lc.ReadFrom.Configuration(ctx.Configuration);
    if (ctx.HostingEnvironment.IsProduction())
        lc.WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter());
    else
        lc.WriteTo.Console();
});

var corsOrigins = builder.Configuration["CORS_ORIGINS"] ?? "";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyMethod().AllowAnyHeader();
        if (string.IsNullOrWhiteSpace(corsOrigins))
            policy.AllowAnyOrigin();
        else
            policy.WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    });
});

var rateLimit = int.TryParse(builder.Configuration["RATE_LIMIT_PER_MINUTE"], out var r) ? r : 60;
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<Microsoft.AspNetCore.Http.HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimit,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
            }));
    options.AddPolicy("api", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimit,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
            }));
});

var app = builder.Build();
var isProduction = app.Environment.IsProduction();
app.UseExceptionHandler(err =>
{
    err.Run(async ctx =>
    {
        ctx.Response.StatusCode = 500;
        ctx.Response.ContentType = "application/json";
        var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
        if (ex != null)
            Serilog.Log.Error(ex, "Unhandled exception");
        var msg = isProduction ? "An error occurred." : (ex?.Message ?? "An error occurred.");
        await ctx.Response.WriteAsJsonAsync(new { success = false, error = msg });
    });
});
app.UseSerilogRequestLogging();
app.UseCors();
app.UseRateLimiter();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" })).AllowAnonymous();

var loader = new YamlModelLoader();
var simulation = new DiscreteEventSimulationEngine();
var decision = new DecisionEngine();
var export = new ExportService();

app.MapPost("/api/model/load", (LoadRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new
    {
        success = true,
        model = new
        {
            model!.Id,
            model.Name,
            model.Description,
            model.Version,
            Participants = model.Participants,
            ServicesCount = model.Services.Count,
            FlowsCount = model.Flows.Count,
            Services = model.Services.Select(s => new { s.Id, s.Name, s.FallbackServiceId, s.Provider, s.Component, s.CostPerHour, s.CostPerMonth, s.Currency }),
            Flows = model.Flows.Select(f => new { f.Id, f.Name, StepsCount = f.Steps.Count, Steps = f.Steps.Select(s => new { From = s.FromNodeId, To = s.ToNodeId, OnFailure = s.OnFailureTargetId }) }),
            Requirements = model.Requirements.Select(r => new { r.Id, r.Text, r.Priority, r.Type, r.StandardRef }),
            TraceabilityLinks = model.TraceabilityLinks.Select(t => new { t.RequirementId, t.LinkType, t.ElementType, t.ElementId }),
            Constraints = model.Constraints.Select(c => new { c.Id, c.Metric, c.Operator, c.Value, c.AdrId }),
            Adrs = model.Adrs.Select(a => new { a.Id, a.Number, a.Title, a.Slug, a.Template, a.Status, a.Date, a.Owner, Stakeholders = a.Stakeholders, a.ProposedBy, a.ReviewedBy, a.ApprovedBy, a.TargetDate, a.ReviewDate, a.Context, a.Decision, a.Consequences, a.AlternativesConsidered, Options = a.Options.Select(o => new { o.Option, o.Pros, o.Cons }), a.References, a.SupersededBy, Amendments = a.Amendments.Select(m => new { m.Date, m.Text }), a.LinkedConstraintIds, AppliesTo = a.AppliesTo.Select(t => new { t.ElementType, t.ElementId }) })
        }
    });
});

app.MapPost("/api/simulation/run", (SimulationRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    var durationSec = Math.Clamp(req.DurationSec ?? 5, 1, 300);
    var rate = Math.Clamp(req.Rate ?? 50, 1, 10000);
    var failureRate = Math.Clamp(req.FailureRate ?? 0, 0, 1);
    var seed = req.Seed ?? 42;
    var rampUpSeconds = Math.Max(0, req.RampUpSec ?? 0);
    var result = simulation.Run(model!, new SimulationOptions(
        TimeSpan.FromSeconds(durationSec), rate, failureRate, seed, rampUpSeconds));
    return Results.Json(new
    {
        success = result.Success,
        elapsed = result.Elapsed.TotalSeconds,
        serviceMetrics = result.ServiceMetrics.Values.Select(m => new
        {
            m.ServiceId,
            m.RequestCount,
            m.FailureCount,
            m.AvgLatencyMs,
            m.P95LatencyMs
        }),
        eventsCount = result.Events.Count
    });
}).RequireRateLimiting("api");

app.MapPost("/api/decision/evaluate", (DecisionRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    SimArch.Simulation.SimulationResult? simResult = null;
    if (req.SimulationResult != null && req.SimulationResult.ServiceMetrics != null && req.SimulationResult.ServiceMetrics.Count > 0)
    {
        var metrics = req.SimulationResult.ServiceMetrics
            .Select(m => new SimArch.Simulation.ServiceMetrics(
                m.ServiceId ?? "",
                m.RequestCount,
                m.FailureCount,
                m.AvgLatencyMs,
                m.P95LatencyMs))
            .ToDictionary(m => m.ServiceId, StringComparer.OrdinalIgnoreCase);
        simResult = new SimArch.Simulation.SimulationResult(
            true,
            TimeSpan.FromSeconds(req.SimulationResult.ElapsedSec),
            metrics,
            Array.Empty<SimArch.Simulation.SimulationEvent>());
    }
    var report = decision.Evaluate(model!, simResult, req.Scenario);
    return Results.Json(new
    {
        success = true,
        scenario = report.Scenario,
        latencyImpacts = report.LatencyImpacts,
        costImpacts = report.CostImpacts,
        riskImpacts = report.RiskImpacts,
        constraintResults = report.ConstraintResults
    });
});

app.MapPost("/api/quality/profile", (QualityProfileRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    SimulationResult? simResult = null;
    if (req.RunSimulation == true)
    {
        var durationSec = Math.Clamp(req.DurationSec ?? 5, 1, 300);
        var rate = Math.Clamp(req.Rate ?? 50, 1, 10000);
        var failureRate = Math.Clamp(req.FailureRate ?? 0, 0, 1);
        var seed = req.Seed ?? 42;
        simResult = simulation.Run(model!, new SimulationOptions(
            TimeSpan.FromSeconds(durationSec), rate, failureRate, seed));
    }
    var profile = ArchitecturalQualityService.Compute(model!, simResult);
    return Results.Json(new
    {
        success = true,
        profile = new
        {
            profile.ResilienceDegree,
            profile.AvailabilityTargetPercent,
            profile.ScalabilityDegree,
            profile.SinglePointsOfFailureCount,
            profile.SinglePointOfFailureServiceIds,
            profile.FactorsAffectingSimulation,
            profile.ServiceIndicators,
            profile.SimulationEffectiveAvailabilityPercent,
            profile.SimulationAvgLatencyMs,
            profile.SimulationFailureRate
        }
    });
});

app.MapPost("/api/export/adr", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportToAdr(model!) });
});

app.MapPost("/api/export/decision-log", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportDecisionLog(model!) });
});

app.MapPost("/api/export/costs-csv", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportCostsCsv(model!) });
});

app.MapPost("/api/export/markdown", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportToMarkdown(model!) });
});

app.MapPost("/api/export/json", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportToJson(model!) });
});

app.MapPost("/api/export/traceability", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportTraceabilityMatrix(model!) });
});

app.MapPost("/api/export/traceability-csv", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportTraceabilityMatrixCsv(model!) });
});

app.MapPost("/api/export/mermaid", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportMermaidSequenceDiagram(model!) });
});

app.MapPost("/api/export/traceability-graph", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    return Results.Json(new { success = true, content = export.ExportTraceabilityGraph(model!) });
});

app.MapPost("/api/validation/conflicts", (ExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    var conflicts = ConstraintConflictDetector.Detect(model!.Constraints);
    return Results.Json(new { success = true, conflicts });
});

app.MapPost("/api/simulation/compare", (SimulationCompareRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    var optsA = new SimulationOptions(
        TimeSpan.FromSeconds(Math.Clamp(req.ScenarioA?.DurationSec ?? 5, 1, 300)),
        Math.Clamp(req.ScenarioA?.Rate ?? 50, 1, 10000),
        Math.Clamp(req.ScenarioA?.FailureRate ?? 0, 0, 1),
        req.ScenarioA?.Seed ?? 42);
    var optsB = new SimulationOptions(
        TimeSpan.FromSeconds(Math.Clamp(req.ScenarioB?.DurationSec ?? 5, 1, 300)),
        Math.Clamp(req.ScenarioB?.Rate ?? 50, 1, 10000),
        Math.Clamp(req.ScenarioB?.FailureRate ?? 0, 0, 1),
        req.ScenarioB?.Seed ?? 43);
    var resultA = simulation.Run(model!, optsA);
    var resultB = simulation.Run(model!, optsB);
    var comparison = new List<object>();
    foreach (var sid in resultA.ServiceMetrics.Keys.Union(resultB.ServiceMetrics.Keys))
    {
        var ma = resultA.ServiceMetrics.TryGetValue(sid, out var a) ? a : null;
        var mb = resultB.ServiceMetrics.TryGetValue(sid, out var b) ? b : null;
        comparison.Add(new
        {
            serviceId = sid,
            avgLatencyA = ma?.AvgLatencyMs,
            avgLatencyB = mb?.AvgLatencyMs,
            p95A = ma?.P95LatencyMs,
            p95B = mb?.P95LatencyMs,
            failureCountA = ma?.FailureCount,
            failureCountB = mb?.FailureCount
        });
    }
    return Results.Json(new
    {
        success = true,
        scenarioA = new { elapsed = resultA.Elapsed.TotalSeconds, serviceMetrics = resultA.ServiceMetrics.Values.Select(m => new { m.ServiceId, m.RequestCount, m.FailureCount, m.AvgLatencyMs, m.P95LatencyMs }) },
        scenarioB = new { elapsed = resultB.Elapsed.TotalSeconds, serviceMetrics = resultB.ServiceMetrics.Values.Select(m => new { m.ServiceId, m.RequestCount, m.FailureCount, m.AvgLatencyMs, m.P95LatencyMs }) },
        comparison
    });
}).RequireRateLimiting("api");

app.MapPost("/api/export/consolidated", (ConsolidatedExportRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req?.Yaml))
        return Results.BadRequest(new { success = false, error = "YAML is required." });
    if (!loader.TryLoad(req.Yaml!, out var model, out var error))
        return Results.Json(new { success = false, error });
    var content = export.ExportConsolidatedReport(model!);
    if (req.IncludeSimulationAndDecision == true)
    {
        var durationSec = Math.Clamp(req.DurationSec ?? 5, 1, 300);
        var rate = Math.Clamp(req.Rate ?? 50, 1, 10000);
        var failureRate = Math.Clamp(req.FailureRate ?? 0, 0, 1);
        var simResult = simulation.Run(model!, new SimulationOptions(TimeSpan.FromSeconds(durationSec), rate, failureRate, req.Seed ?? 42));
        var report = decision.Evaluate(model!, simResult, req.Scenario ?? "baseline");
        content += "\n\n---\n\n## Simulation Metrics\n\n";
        content += "| ServiceId | Requests | Failures | Avg Latency (ms) | P95 Latency (ms) |\n";
        content += "|-----------|----------|----------|------------------|------------------|\n";
        foreach (var m in simResult.ServiceMetrics.Values)
            content += "| " + m.ServiceId + " | " + m.RequestCount + " | " + m.FailureCount + " | " + m.AvgLatencyMs.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + " | " + m.P95LatencyMs.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + " |\n";
        content += "\n## Constraint Results\n\n";
        content += "| ConstraintId | Metric | Operator | Expected | Actual | Passed |\n";
        content += "|--------------|--------|----------|----------|--------|--------|\n";
        foreach (var c in report.ConstraintResults)
            content += "| " + c.ConstraintId + " | " + c.Metric + " | " + c.Operator + " | " + c.ExpectedValue.ToString(System.Globalization.CultureInfo.InvariantCulture) + " | " + (c.ActualValue.HasValue ? c.ActualValue.Value.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) : "-") + " | " + (c.Passed ? "PASS" : "FAIL") + " |\n";
    }
    return Results.Json(new { success = true, content });
}).RequireRateLimiting("api");

app.Run();

static class ConstraintConflictDetector
{
    public static List<object> Detect(IReadOnlyList<SimArch.Domain.Entities.ParametricConstraint> constraints)
    {
        var list = new List<object>();
        var byMetric = constraints
            .Where(c => !string.IsNullOrEmpty(c.Metric))
            .GroupBy(c => c.Metric.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() >= 2)
            .ToList();
        foreach (var group in byMetric)
        {
            var arr = group.ToList();
            for (var i = 0; i < arr.Count; i++)
                for (var j = i + 1; j < arr.Count; j++)
                {
                    if (Conflicts(arr[i], arr[j]))
                        list.Add(new { constraintId1 = arr[i].Id, constraintId2 = arr[j].Id, metric = arr[i].Metric, description = $"{arr[i].Id} ({arr[i].Operator} {arr[i].Value}) vs {arr[j].Id} ({arr[j].Operator} {arr[j].Value})" });
                }
        }
        return list;
    }

    private static bool Conflicts(SimArch.Domain.Entities.ParametricConstraint a, SimArch.Domain.Entities.ParametricConstraint b)
    {
        var opA = (a.Operator ?? "lt").ToLowerInvariant();
        var opB = (b.Operator ?? "lt").ToLowerInvariant();
        var vA = a.Value;
        var vB = b.Value;
        var upperA = IsUpperBound(opA);
        var upperB = IsUpperBound(opB);
        var lowerA = IsLowerBound(opA);
        var lowerB = IsLowerBound(opB);
        if (upperA && lowerB && vA < vB) return true;
        if (lowerA && upperB && vB < vA) return true;
        if (opA == "eq" && (opB == "lt" && vB <= vA || opB == "gt" && vB >= vA || opB == "ne")) return true;
        if (opB == "eq" && (opA == "lt" && vA <= vB || opA == "gt" && vA >= vB || opA == "ne")) return true;
        return false;
    }

    private static bool IsUpperBound(string op) => op == "lt" || op == "le";
    private static bool IsLowerBound(string op) => op == "gt" || op == "ge";
}

record LoadRequest(string? Yaml);
record SimulationRequest(string? Yaml, int? DurationSec, int? Rate, double? FailureRate, int? Seed, double? RampUpSec);
record ServiceMetricsDto(string? ServiceId, long RequestCount, long FailureCount, double AvgLatencyMs, double P95LatencyMs);
record SimulationResultDto(double ElapsedSec, List<ServiceMetricsDto>? ServiceMetrics);
record DecisionRequest(string? Yaml, string? Scenario, SimulationResultDto? SimulationResult);
record ExportRequest(string? Yaml);
record ConsolidatedExportRequest(string? Yaml, bool? IncludeSimulationAndDecision, int? DurationSec, int? Rate, double? FailureRate, int? Seed, string? Scenario);
record SimulationScenarioOptions(int? DurationSec, int? Rate, double? FailureRate, int? Seed);
record SimulationCompareRequest(string? Yaml, SimulationScenarioOptions? ScenarioA, SimulationScenarioOptions? ScenarioB);
record QualityProfileRequest(string? Yaml, bool? RunSimulation, int? DurationSec, int? Rate, double? FailureRate, int? Seed);