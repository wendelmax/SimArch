namespace SimArch.Decision;

public sealed record ArchitecturalQualityProfile(
    string ResilienceDegree,
    double? AvailabilityTargetPercent,
    string ScalabilityDegree,
    int SinglePointsOfFailureCount,
    IReadOnlyList<string> SinglePointOfFailureServiceIds,
    IReadOnlyList<string> FactorsAffectingSimulation,
    IReadOnlyList<ServiceQualityIndicators> ServiceIndicators,
    string? SimulationEffectiveAvailabilityPercent = null,
    double? SimulationAvgLatencyMs = null,
    double? SimulationFailureRate = null);

public sealed record ServiceQualityIndicators(
    string ServiceId,
    string ServiceName,
    bool HasSla,
    bool HasTimeout,
    bool HasCircuitBreaker,
    bool HasFallback,
    bool HasRetry,
    bool HasBulkhead,
    bool HasQueue,
    bool HasScaling);
