using SimArch.Decision;
using SimArch.DSL;
using SimArch.Export;
using SimArch.Simulation;

var argsList = args.ToList();
string? modelPath = GetArg("--model", "-m");
string? yaml = modelPath != null && File.Exists(modelPath)
    ? File.ReadAllText(modelPath)
    : GetEmbeddedSampleYaml();

if (string.IsNullOrEmpty(yaml))
{
    Console.Error.WriteLine("Usage: SimArch.App [--model <path>] [--duration <sec>] [--rate <rps>] [--failure-rate <0-1>] [--seed <n>] [--export-adr <path>] [--export-md <path>] [--export-json <path>]");
    Console.Error.WriteLine("  If --model is omitted, uses embedded sample.");
    return 1;
}

var loader = new YamlModelLoader();
if (!loader.TryLoad(yaml, out var model, out var loadError))
{
    Console.Error.WriteLine("Load error: " + loadError);
    return 1;
}

var durationSec = ParseInt(GetArg("--duration", "-d"), 5);
var rate = ParseInt(GetArg("--rate", "-r"), 50);
var failureRate = ParseDouble(GetArg("--failure-rate", "-f"), 0);
var seed = ParseInt(GetArg("--seed", "-s"), 42);

Console.WriteLine("Model: " + model!.Name);
Console.WriteLine("Services: " + model.Services.Count);
Console.WriteLine("Flows: " + model.Flows.Count);
Console.WriteLine("Simulation: duration=" + durationSec + "s rate=" + rate + " failureRate=" + failureRate.ToString("F2") + " seed=" + seed);

var simulation = new DiscreteEventSimulationEngine();
var simResult = simulation.Run(model, new SimulationOptions(
    TimeSpan.FromSeconds(durationSec),
    rate,
    failureRate,
    seed));

Console.WriteLine("\nSimulation: " + (simResult.Success ? "OK" : "Failed") + " (simulated " + simResult.Elapsed + ")");
foreach (var m in simResult.ServiceMetrics.Values)
    Console.WriteLine("  " + m.ServiceId + ": requests=" + m.RequestCount + " failures=" + m.FailureCount + " avgLatency=" + m.AvgLatencyMs.ToString("F1") + "ms p95=" + m.P95LatencyMs.ToString("F1") + "ms");

var decision = new DecisionEngine();
var impact = decision.Evaluate(model, simResult, "baseline");
Console.WriteLine("\nDecision: " + impact.Scenario + " | latency=" + impact.LatencyImpacts.Count + " cost=" + impact.CostImpacts.Count + " risk=" + impact.RiskImpacts.Count);
if (impact.ConstraintResults.Count > 0)
{
    foreach (var c in impact.ConstraintResults)
        Console.WriteLine("  Constraint " + c.ConstraintId + ": " + (c.Passed ? "PASS" : "FAIL") + " (" + c.Metric + " " + c.Operator + " " + c.ExpectedValue + (c.ActualValue.HasValue ? ", actual=" + c.ActualValue.Value.ToString("F1") : "") + ")");
}

var export = new ExportService();
var exportAdr = GetArg("--export-adr");
var exportMd = GetArg("--export-md");
var exportJson = GetArg("--export-json");

if (!string.IsNullOrEmpty(exportAdr))
{
    File.WriteAllText(exportAdr, export.ExportToAdr(model));
    Console.WriteLine("Exported ADR to " + exportAdr);
}
if (!string.IsNullOrEmpty(exportMd))
{
    File.WriteAllText(exportMd, export.ExportToMarkdown(model));
    Console.WriteLine("Exported Markdown to " + exportMd);
}
if (!string.IsNullOrEmpty(exportJson))
{
    File.WriteAllText(exportJson, export.ExportToJson(model));
    Console.WriteLine("Exported JSON to " + exportJson);
}

if (string.IsNullOrEmpty(exportAdr) && string.IsNullOrEmpty(exportMd) && string.IsNullOrEmpty(exportJson))
{
    var adrExcerpt = string.Join("\n", export.ExportToAdr(model).Split('\n').Take(12));
    Console.WriteLine("\nADR (excerpt):\n" + adrExcerpt);
}

return 0;

string? GetArg(string name, string? shortName = null)
{
    var i = argsList.IndexOf(name);
    if (i < 0 && !string.IsNullOrEmpty(shortName)) i = argsList.IndexOf(shortName);
    if (i < 0 || i + 1 >= argsList.Count) return null;
    return argsList[i + 1];
}

int ParseInt(string? value, int defaultValue)
{
    if (value == null || !int.TryParse(value, out var n)) return defaultValue;
    return n;
}

double ParseDouble(string? value, double defaultValue)
{
    if (value == null || !double.TryParse(value, System.Globalization.CultureInfo.InvariantCulture, out var d)) return defaultValue;
    return d;
}

string? GetEmbeddedSampleYaml()
{
    return """
name: Checkout Flow
services:
  - id: gateway
    name: API Gateway
    slaMs: 100
    availability: 99.9
    scaling:
      auto: true
      min: 2
      max: 20
    retry:
      max: 3
      backoffMs: 100
      exponential: true
    timeoutMs: 150
    circuitBreaker:
      failureThreshold: 5
      openDurationMs: 5000
      successThresholdInHalfOpen: 1
    bulkhead:
      maxConcurrency: 10
    queue:
      capacity: 100
    fallback: null
  - id: payment
    name: Payment Service
    slaMs: 200
    timeoutMs: 300
    circuitBreaker:
      failureThreshold: 3
      openDurationMs: 3000
    fallback: wallet
  - id: wallet
    name: Wallet Fallback
    slaMs: 500
flows:
  - id: checkout
    name: Checkout
    steps:
      - from: User
        to: gateway
      - from: gateway
        to: payment
        onFailure: wallet
""";
}
