namespace SimArch.Domain.Entities;

public sealed class ParametricConstraint
{
    public string Id { get; init; } = string.Empty;
    public string Metric { get; init; } = string.Empty;
    public string Operator { get; init; } = "lt";
    public double Value { get; init; }
}
