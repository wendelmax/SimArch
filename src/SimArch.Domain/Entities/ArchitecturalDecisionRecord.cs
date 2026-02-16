namespace SimArch.Domain.Entities;

public sealed class ArchitecturalDecisionRecord
{
    public string Id { get; init; } = string.Empty;
    public int Number { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Template { get; init; } = "simarch";
    public string Status { get; init; } = "Draft";
    public string? Date { get; init; }
    public string? Owner { get; init; }
    public IReadOnlyList<string> Stakeholders { get; init; } = Array.Empty<string>();
    public string? ProposedBy { get; init; }
    public string? ReviewedBy { get; init; }
    public string? ApprovedBy { get; init; }
    public string? TargetDate { get; init; }
    public string? ReviewDate { get; init; }
    public string Context { get; init; } = string.Empty;
    public string Decision { get; init; } = string.Empty;
    public string Consequences { get; init; } = string.Empty;
    public string? AlternativesConsidered { get; init; }
    public IReadOnlyList<AdrOption> Options { get; init; } = Array.Empty<AdrOption>();
    public string? References { get; init; }
    public string? SupersededBy { get; init; }
    public IReadOnlyList<AdrAmendment> Amendments { get; init; } = Array.Empty<AdrAmendment>();
    public IReadOnlyList<string> LinkedConstraintIds { get; init; } = Array.Empty<string>();
    public IReadOnlyList<AdrAppliesTo> AppliesTo { get; init; } = Array.Empty<AdrAppliesTo>();
}
