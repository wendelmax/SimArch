namespace SimArch.Domain.Entities;

public sealed class Requirement
{
    public string Id { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public string Priority { get; init; } = "medium";
    public string Type { get; init; } = "functional";
    public string? StandardRef { get; init; }
}
