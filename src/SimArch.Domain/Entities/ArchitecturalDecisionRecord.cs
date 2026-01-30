namespace SimArch.Domain.Entities;

public sealed class ArchitecturalDecisionRecord
{
    public string Id { get; init; } = string.Empty;
    public int Number { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = "Proposed";
    public string? Date { get; init; }
    public string? Owner { get; init; }
    public IReadOnlyList<string> Stakeholders { get; init; } = Array.Empty<string>();
    public string Context { get; init; } = string.Empty;
    public string Decision { get; init; } = string.Empty;
    public string Consequences { get; init; } = string.Empty;
    public string? AlternativesConsidered { get; init; }
    public string? References { get; init; }
    public string? SupersededBy { get; init; }
}
