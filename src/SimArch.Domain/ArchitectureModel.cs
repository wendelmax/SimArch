using SimArch.Domain.Entities;

namespace SimArch.Domain;

public sealed class ArchitectureModel
{
    public string Id { get; init; } = Guid.NewGuid().ToString();
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Version { get; init; }
    public IReadOnlyList<string> Participants { get; init; } = Array.Empty<string>();
    public IReadOnlyList<ServiceDefinition> Services { get; init; } = Array.Empty<ServiceDefinition>();
    public IReadOnlyList<FlowDefinition> Flows { get; init; } = Array.Empty<FlowDefinition>();
    public IReadOnlyList<Requirement> Requirements { get; init; } = Array.Empty<Requirement>();
    public IReadOnlyList<TraceabilityLink> TraceabilityLinks { get; init; } = Array.Empty<TraceabilityLink>();
    public IReadOnlyList<ParametricConstraint> Constraints { get; init; } = Array.Empty<ParametricConstraint>();
    public IReadOnlyList<ArchitecturalDecisionRecord> Adrs { get; init; } = Array.Empty<ArchitecturalDecisionRecord>();
}
