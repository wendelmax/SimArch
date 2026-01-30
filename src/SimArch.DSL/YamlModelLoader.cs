using SimArch.Domain;
using SimArch.Domain.Entities;
using SimArch.Domain.ValueObjects;

namespace SimArch.DSL;

public sealed class YamlModelLoader : IArchitectureModelLoader
{
    public ArchitectureModel Load(string source)
    {
        if (!TryLoad(source, out var model, out var error))
            throw new InvalidOperationException(error);
        return model!;
    }

    public bool TryLoad(string source, out ArchitectureModel? model, out string? error)
    {
        model = null;
        error = null;
        try
        {
            var deserializer = new YamlDotNet.Serialization.DeserializerBuilder()
    .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.CamelCaseNamingConvention.Instance)
    .Build();
var doc = deserializer.Deserialize<YamlDocument>(source);
            if (doc?.Services == null)
            {
                error = "Missing or invalid 'services' in document.";
                return false;
            }

            var services = doc.Services.Select(s => new ServiceDefinition
            {
                Id = s.Id ?? s.Name ?? Guid.NewGuid().ToString(),
                Name = s.Name ?? s.Id ?? "",
                Sla = s.SlaMs.HasValue || s.Availability.HasValue
                    ? new Sla(
                        TimeSpan.FromMilliseconds(s.SlaMs ?? 0),
                        s.Availability ?? 99.9)
                    : null,
                Scaling = s.Scaling != null
                    ? new ScalingPolicy(s.Scaling.Auto ?? false, s.Scaling.Min ?? 1, s.Scaling.Max ?? 10)
                    : null,
                Retry = s.Retry != null
                    ? new RetryPolicy(
                        s.Retry.Max ?? 3,
                        TimeSpan.FromMilliseconds(s.Retry.BackoffMs ?? 100),
                        s.Retry.Exponential ?? true)
                    : null,
                CircuitBreaker = s.CircuitBreaker != null
                    ? new CircuitBreakerPolicy(
                        s.CircuitBreaker.FailureThreshold ?? 5,
                        TimeSpan.FromMilliseconds(s.CircuitBreaker.OpenDurationMs ?? 5000),
                        s.CircuitBreaker.SuccessThresholdInHalfOpen ?? 1)
                    : null,
                Timeout = s.TimeoutMs.HasValue ? new TimeoutPolicy(TimeSpan.FromMilliseconds(s.TimeoutMs.Value)) : null,
                Bulkhead = s.Bulkhead != null ? new BulkheadPolicy(s.Bulkhead.MaxConcurrency ?? 10) : null,
                Queue = s.Queue != null ? new QueuePolicy(s.Queue.Capacity ?? 100) : null,
                FallbackServiceId = s.Fallback,
                Provider = s.Provider,
                Component = s.Component,
                CostPerHour = s.CostPerHour,
                CostPerMonth = s.CostPerMonth,
                Currency = s.Currency
            }).ToList();

            var flows = (doc.Flows ?? new List<YamlFlow>()).Select(f => new FlowDefinition
            {
                Id = f.Id ?? f.Name ?? Guid.NewGuid().ToString(),
                Name = f.Name ?? f.Id ?? "",
                Steps = (f.Steps ?? new List<YamlFlowStep>()).Select(st => new FlowStep
                {
                    FromNodeId = st.From ?? "",
                    ToNodeId = st.To ?? "",
                    OnFailureTargetId = st.OnFailure
                }).ToList()
            }).ToList();

            var serviceIds = new HashSet<string>(services.Select(x => x.Id), StringComparer.OrdinalIgnoreCase);
            foreach (var s in services)
            {
                if (!string.IsNullOrEmpty(s.FallbackServiceId) && !serviceIds.Contains(s.FallbackServiceId))
                {
                    error = "Fallback service '" + s.FallbackServiceId + "' not found (service '" + s.Id + "').";
                    return false;
                }
            }
            foreach (var f in flows)
            {
                foreach (var step in f.Steps)
                {
                    if (!string.IsNullOrEmpty(step.FromNodeId) && step.FromNodeId != "User" && !serviceIds.Contains(step.FromNodeId))
                    {
                        error = "Flow '" + f.Name + "': step from '" + step.FromNodeId + "' references unknown service.";
                        return false;
                    }
                    if (!string.IsNullOrEmpty(step.ToNodeId) && !serviceIds.Contains(step.ToNodeId))
                    {
                        error = "Flow '" + f.Name + "': step to '" + step.ToNodeId + "' references unknown service.";
                        return false;
                    }
                    if (!string.IsNullOrEmpty(step.OnFailureTargetId) && !serviceIds.Contains(step.OnFailureTargetId))
                    {
                        error = "Flow '" + f.Name + "': onFailure '" + step.OnFailureTargetId + "' references unknown service.";
                        return false;
                    }
                }
            }

            var requirements = (doc.Requirements ?? new List<YamlRequirement>()).Select(r => new Requirement
            {
                Id = r.Id ?? Guid.NewGuid().ToString(),
                Text = r.Text ?? "",
                Priority = r.Priority ?? "medium",
                Type = r.Type ?? "functional",
                StandardRef = r.StandardRef
            }).ToList();

            var traceLinks = (doc.TraceabilityLinks ?? new List<YamlTraceabilityLink>()).Select(t => new TraceabilityLink
            {
                RequirementId = t.RequirementId ?? "",
                LinkType = t.LinkType ?? "satisfy",
                ElementType = t.ElementType ?? "service",
                ElementId = t.ElementId ?? ""
            }).ToList();

            var constraints = (doc.Constraints ?? new List<YamlConstraint>()).Select(c => new ParametricConstraint
            {
                Id = c.Id ?? Guid.NewGuid().ToString(),
                Metric = c.Metric ?? "",
                Operator = c.Operator ?? "lt",
                Value = c.Value ?? 0
            }).ToList();

            var adrs = (doc.Adrs ?? new List<YamlAdr>()).Select((a, i) => new ArchitecturalDecisionRecord
            {
                Id = a.Id ?? ("adr-" + (i + 1)),
                Number = a.Number ?? (i + 1),
                Title = a.Title ?? "",
                Status = a.Status ?? "Proposed",
                Date = a.Date,
                Owner = a.Owner,
                Stakeholders = (a.Stakeholders ?? new List<string>()).ToList(),
                Context = a.Context ?? "",
                Decision = a.Decision ?? "",
                Consequences = a.Consequences ?? "",
                AlternativesConsidered = a.AlternativesConsidered,
                References = a.References,
                SupersededBy = a.SupersededBy
            }).ToList();

            model = new ArchitectureModel
            {
                Name = doc.Name ?? "Unnamed",
                Services = services,
                Flows = flows,
                Requirements = requirements,
                TraceabilityLinks = traceLinks,
                Constraints = constraints,
                Adrs = adrs
            };
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    private sealed class YamlDocument
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Version { get; set; }
        public List<string>? Participants { get; set; }
        public string? ProjectType { get; set; }
        public string? PrimaryCloud { get; set; }
        public List<YamlService>? Services { get; set; }
        public List<YamlFlow>? Flows { get; set; }
        public List<YamlRequirement>? Requirements { get; set; }
        public List<YamlTraceabilityLink>? TraceabilityLinks { get; set; }
        public List<YamlConstraint>? Constraints { get; set; }
        public List<YamlAdr>? Adrs { get; set; }
    }

    private sealed class YamlAdr
    {
        public string? Id { get; set; }
        public int? Number { get; set; }
        public string? Title { get; set; }
        public string? Status { get; set; }
        public string? Date { get; set; }
        public string? Owner { get; set; }
        public List<string>? Stakeholders { get; set; }
        public string? Context { get; set; }
        public string? Decision { get; set; }
        public string? Consequences { get; set; }
        public string? AlternativesConsidered { get; set; }
        public string? References { get; set; }
        public string? SupersededBy { get; set; }
    }

    private sealed class YamlConstraint
    {
        public string? Id { get; set; }
        public string? Metric { get; set; }
        public string? Operator { get; set; }
        public double? Value { get; set; }
    }

    private sealed class YamlRequirement
    {
        public string? Id { get; set; }
        public string? Text { get; set; }
        public string? Priority { get; set; }
        public string? Type { get; set; }
        public string? StandardRef { get; set; }
    }

    private sealed class YamlTraceabilityLink
    {
        public string? RequirementId { get; set; }
        public string? LinkType { get; set; }
        public string? ElementType { get; set; }
        public string? ElementId { get; set; }
    }

    private sealed class YamlService
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Component { get; set; }
        public int? SlaMs { get; set; }
        public double? Availability { get; set; }
        public YamlScaling? Scaling { get; set; }
        public YamlRetry? Retry { get; set; }
        public YamlCircuitBreaker? CircuitBreaker { get; set; }
        public int? TimeoutMs { get; set; }
        public YamlBulkhead? Bulkhead { get; set; }
        public YamlQueue? Queue { get; set; }
        public string? Fallback { get; set; }
        public string? Provider { get; set; }
        public double? CostPerHour { get; set; }
        public double? CostPerMonth { get; set; }
        public string? Currency { get; set; }
    }

    private sealed class YamlCircuitBreaker
    {
        public int? FailureThreshold { get; set; }
        public int? OpenDurationMs { get; set; }
        public int? SuccessThresholdInHalfOpen { get; set; }
    }

    private sealed class YamlBulkhead
    {
        public int? MaxConcurrency { get; set; }
    }

    private sealed class YamlQueue
    {
        public int? Capacity { get; set; }
    }

    private sealed class YamlScaling
    {
        public bool? Auto { get; set; }
        public int? Min { get; set; }
        public int? Max { get; set; }
    }

    private sealed class YamlRetry
    {
        public int? Max { get; set; }
        public int? BackoffMs { get; set; }
        public bool? Exponential { get; set; }
    }

    private sealed class YamlFlow
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public List<YamlFlowStep>? Steps { get; set; }
    }

    private sealed class YamlFlowStep
    {
        public string? From { get; set; }
        public string? To { get; set; }
        public string? OnFailure { get; set; }
    }
}
