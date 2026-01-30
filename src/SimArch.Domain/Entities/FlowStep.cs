namespace SimArch.Domain.Entities;

public sealed class FlowStep
{
    public string FromNodeId { get; init; } = string.Empty;
    public string ToNodeId { get; init; } = string.Empty;
    public string? OnFailureTargetId { get; init; }
}
