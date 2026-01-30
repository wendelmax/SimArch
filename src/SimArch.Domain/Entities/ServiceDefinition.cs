using SimArch.Domain.ValueObjects;

namespace SimArch.Domain.Entities;

public sealed class ServiceDefinition
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public Sla? Sla { get; init; }
    public ScalingPolicy? Scaling { get; init; }
    public RetryPolicy? Retry { get; init; }
    public CircuitBreakerPolicy? CircuitBreaker { get; init; }
    public TimeoutPolicy? Timeout { get; init; }
    public BulkheadPolicy? Bulkhead { get; init; }
    public QueuePolicy? Queue { get; init; }
    public string? FallbackServiceId { get; init; }
    public string? Provider { get; init; }
    public string? Component { get; init; }
    public double? CostPerHour { get; init; }
    public double? CostPerMonth { get; init; }
    public string? Currency { get; init; }
}
