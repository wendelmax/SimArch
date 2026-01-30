using SimArch.Domain;

namespace SimArch.Simulation;

public interface ISimulationEngine
{
    SimulationResult Run(ArchitectureModel model, SimulationOptions options);
}

public sealed record SimulationOptions(
    TimeSpan Duration,
    int RequestRatePerSecond = 100,
    double FailureInjectionRate = 0,
    int Seed = 42,
    double RampUpSeconds = 0);

public sealed record SimulationResult(
    bool Success,
    TimeSpan Elapsed,
    IReadOnlyDictionary<string, ServiceMetrics> ServiceMetrics,
    IReadOnlyList<SimulationEvent> Events);

public sealed record ServiceMetrics(
    string ServiceId,
    long RequestCount,
    long FailureCount,
    double AvgLatencyMs,
    double P95LatencyMs);

public sealed record SimulationEvent(
    DateTimeOffset Timestamp,
    string ServiceId,
    string EventType,
    string? Message = null);

public enum CircuitBreakerState { Closed, Open, HalfOpen }
