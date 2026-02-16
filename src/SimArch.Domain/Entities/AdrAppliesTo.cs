namespace SimArch.Domain.Entities;

public sealed class AdrAppliesTo
{
    public string ElementType { get; init; } = "service";
    public string ElementId { get; init; } = string.Empty;
}
