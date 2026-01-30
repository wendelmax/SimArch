namespace SimArch.Domain.ValueObjects;

public sealed record CircuitBreakerPolicy(
    int FailureThreshold,
    TimeSpan OpenDuration,
    int SuccessThresholdInHalfOpen = 1);
