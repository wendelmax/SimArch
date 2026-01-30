namespace SimArch.Domain.Entities;

public sealed class FlowDefinition
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public IReadOnlyList<FlowStep> Steps { get; init; } = Array.Empty<FlowStep>();
}
