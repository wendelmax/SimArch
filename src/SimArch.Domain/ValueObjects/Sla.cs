namespace SimArch.Domain.ValueObjects;

public sealed record Sla(TimeSpan MaxLatencyMs, double AvailabilityPercent);
