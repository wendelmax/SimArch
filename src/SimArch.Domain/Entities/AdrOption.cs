namespace SimArch.Domain.Entities;

public sealed class AdrOption
{
    public string Option { get; init; } = string.Empty;
    public IReadOnlyList<string> Pros { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Cons { get; init; } = Array.Empty<string>();
}
