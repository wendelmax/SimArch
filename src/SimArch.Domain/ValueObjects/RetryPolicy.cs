namespace SimArch.Domain.ValueObjects;

public sealed record RetryPolicy(int MaxRetries, TimeSpan BackoffBase, bool ExponentialBackoff = true);
