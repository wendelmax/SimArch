using SimArch.Domain;
using SimArch.Simulation;

namespace SimArch.Decision;

public static class ArchitecturalQualityService
{
    public static ArchitecturalQualityProfile Compute(ArchitectureModel model, SimulationResult? simulationResult = null)
    {
        var factors = new List<string>();
        if (model.Services.Any(s => s.CircuitBreaker != null)) factors.Add("CircuitBreaker");
        if (model.Services.Any(s => !string.IsNullOrEmpty(s.FallbackServiceId))) factors.Add("Fallback");
        if (model.Services.Any(s => s.Queue != null)) factors.Add("Queue");
        if (model.Services.Any(s => s.Bulkhead != null)) factors.Add("Bulkhead");
        if (model.Services.Any(s => s.Timeout != null)) factors.Add("Timeout");
        factors.Add("FailureInjectionRate");

        var singlePoints = model.Services
            .Where(s => string.IsNullOrEmpty(s.FallbackServiceId))
            .Select(s => s.Id)
            .ToList();

        var withResilience = model.Services.Count(s =>
            s.CircuitBreaker != null || !string.IsNullOrEmpty(s.FallbackServiceId) || s.Timeout != null);
        var total = model.Services.Count;
        var resilienceRatio = total > 0 ? (double)withResilience / total : 0;
        var resilienceDegree = resilienceRatio >= 0.75 ? "Alto" : resilienceRatio >= 0.4 ? "Medio" : "Baixo";

        double? availabilityTarget = null;
        var withSla = model.Services.Where(s => s.Sla != null).ToList();
        if (withSla.Count > 0)
            availabilityTarget = withSla.Average(s => s.Sla!.AvailabilityPercent);

        var withScalability = model.Services.Count(s =>
            (s.Scaling?.AutoScale == true) || s.Bulkhead != null || s.Queue != null);
        var scalabilityRatio = total > 0 ? (double)withScalability / total : 0;
        var scalabilityDegree = scalabilityRatio >= 0.5 ? "Alto" : scalabilityRatio >= 0.2 ? "Medio" : "Baixo";

        var serviceIndicators = model.Services.Select(s => new ServiceQualityIndicators(
            s.Id,
            s.Name,
            s.Sla != null,
            s.Timeout != null,
            s.CircuitBreaker != null,
            !string.IsNullOrEmpty(s.FallbackServiceId),
            s.Retry != null,
            s.Bulkhead != null,
            s.Queue != null,
            s.Scaling?.AutoScale == true)).ToList();

        string? effectiveAvailability = null;
        double? avgLatency = null;
        double? failureRate = null;

        if (simulationResult != null && simulationResult.ServiceMetrics.Count > 0)
        {
            var totalReq = simulationResult.ServiceMetrics.Values.Sum(m => m.RequestCount);
            var totalFail = simulationResult.ServiceMetrics.Values.Sum(m => m.FailureCount);
            if (totalReq > 0)
            {
                effectiveAvailability = ((totalReq - totalFail) * 100.0 / totalReq).ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
                failureRate = (double)totalFail / totalReq;
            }
            avgLatency = simulationResult.ServiceMetrics.Values.Average(m => m.AvgLatencyMs);
        }

        return new ArchitecturalQualityProfile(
            ResilienceDegree: resilienceDegree,
            AvailabilityTargetPercent: availabilityTarget,
            ScalabilityDegree: scalabilityDegree,
            SinglePointsOfFailureCount: singlePoints.Count,
            SinglePointOfFailureServiceIds: singlePoints,
            FactorsAffectingSimulation: factors,
            ServiceIndicators: serviceIndicators,
            SimulationEffectiveAvailabilityPercent: effectiveAvailability,
            SimulationAvgLatencyMs: avgLatency,
            SimulationFailureRate: failureRate);
    }
}
