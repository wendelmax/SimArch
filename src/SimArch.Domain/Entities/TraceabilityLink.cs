namespace SimArch.Domain.Entities;

public sealed class TraceabilityLink
{
    public string RequirementId { get; init; } = string.Empty;
    public string LinkType { get; init; } = "satisfy";
    public string ElementType { get; init; } = "service";
    public string ElementId { get; init; } = string.Empty;
}
