namespace SimArch.Domain.ValueObjects;

public sealed record ScalingPolicy(bool AutoScale, int MinInstances = 1, int MaxInstances = 10);
