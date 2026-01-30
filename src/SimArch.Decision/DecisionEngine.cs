using SimArch.Domain;
using SimArch.Simulation;

namespace SimArch.Decision;

public sealed class DecisionEngine : IDecisionEngine
{
    public ImpactReport Evaluate(ArchitectureModel model, SimulationResult? simulationResult = null, string? scenario = null)
    {
        var scenarioName = scenario ?? "baseline";
        var latency = new List<ImpactItem>();
        var cost = new List<ImpactItem>();
        var risk = new List<ImpactItem>();

        foreach (var svc in model.Services)
        {
            if (svc.Sla != null)
                latency.Add(new ImpactItem(svc.Id, $"SLA {svc.Sla.MaxLatencyMs.TotalMilliseconds}ms", "info"));
            if (svc.Timeout != null)
                latency.Add(new ImpactItem(svc.Id, $"Timeout {svc.Timeout.Duration.TotalMilliseconds}ms", "info"));
            if (svc.CircuitBreaker != null)
                risk.Add(new ImpactItem(svc.Id, $"CircuitBreaker threshold={svc.CircuitBreaker.FailureThreshold} open={svc.CircuitBreaker.OpenDuration.TotalSeconds}s", "low"));
            if (svc.Scaling?.AutoScale == true)
                cost.Add(new ImpactItem(svc.Id, $"Auto-scale {svc.Scaling.MinInstances}-{svc.Scaling.MaxInstances}", "info"));
            if (svc.Bulkhead != null)
                cost.Add(new ImpactItem(svc.Id, $"Bulkhead maxConcurrency={svc.Bulkhead.MaxConcurrency}", "info"));
            if (svc.Queue != null)
                cost.Add(new ImpactItem(svc.Id, $"Queue capacity={svc.Queue.Capacity}", "info"));
            if (!string.IsNullOrEmpty(svc.FallbackServiceId))
                risk.Add(new ImpactItem(svc.Id, $"Fallback to {svc.FallbackServiceId}", "low"));
        }

        var constraintResults = simulationResult != null && model.Constraints.Count > 0
            ? EvaluateConstraints(model.Constraints, simulationResult)
            : Array.Empty<ConstraintEvaluation>();

        return new ImpactReport(scenarioName, latency, cost, risk, constraintResults);
    }

    private static IReadOnlyList<ConstraintEvaluation> EvaluateConstraints(
        IReadOnlyList<Domain.Entities.ParametricConstraint> constraints,
        SimulationResult result)
    {
        var list = new List<ConstraintEvaluation>();
        foreach (var c in constraints)
        {
            var (actual, scope) = ResolveMetric(c.Metric, result);
            var passed = actual.HasValue && Compare(actual.Value, c.Operator, c.Value);
            list.Add(new ConstraintEvaluation(
                c.Id, c.Metric, c.Operator, c.Value, actual, passed, scope));
        }
        return list;
    }

    private static (double? value, string? scope) ResolveMetric(string metric, SimulationResult result)
    {
        var parts = metric.Split(':', 2, StringSplitOptions.TrimEntries);
        var metricName = parts.Length == 2 ? parts[1] : parts[0];
        var serviceId = parts.Length == 2 ? parts[0] : null;

        if (serviceId != null && result.ServiceMetrics.TryGetValue(serviceId, out var sm))
            return (GetMetricValue(sm, metricName), serviceId);

        if (serviceId == null)
        {
            if (result.ServiceMetrics.Count == 0) return (null, null);
            if (string.Equals(metricName, "avgLatencyMs", StringComparison.OrdinalIgnoreCase))
                return (result.ServiceMetrics.Values.Max(x => x.AvgLatencyMs), "global");
            if (string.Equals(metricName, "p95LatencyMs", StringComparison.OrdinalIgnoreCase))
                return (result.ServiceMetrics.Values.Max(x => x.P95LatencyMs), "global");
            if (string.Equals(metricName, "failureCount", StringComparison.OrdinalIgnoreCase))
                return (result.ServiceMetrics.Values.Sum(x => x.FailureCount), "global");
            if (string.Equals(metricName, "requestCount", StringComparison.OrdinalIgnoreCase))
                return (result.ServiceMetrics.Values.Sum(x => x.RequestCount), "global");
        }

        return (null, serviceId);
    }

    private static double GetMetricValue(ServiceMetrics sm, string metricName)
    {
        if (string.Equals(metricName, "avgLatencyMs", StringComparison.OrdinalIgnoreCase)) return sm.AvgLatencyMs;
        if (string.Equals(metricName, "p95LatencyMs", StringComparison.OrdinalIgnoreCase)) return sm.P95LatencyMs;
        if (string.Equals(metricName, "failureCount", StringComparison.OrdinalIgnoreCase)) return sm.FailureCount;
        if (string.Equals(metricName, "requestCount", StringComparison.OrdinalIgnoreCase)) return sm.RequestCount;
        return 0;
    }

    private static bool Compare(double actual, string op, double expected)
    {
        return op?.ToLowerInvariant() switch
        {
            "lt" => actual < expected,
            "le" => actual <= expected,
            "eq" => Math.Abs(actual - expected) < 1e-9,
            "ge" => actual >= expected,
            "gt" => actual > expected,
            "ne" => Math.Abs(actual - expected) >= 1e-9,
            _ => actual < expected
        };
    }
}
