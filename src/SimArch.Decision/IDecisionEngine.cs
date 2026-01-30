using SimArch.Domain;
using SimArch.Simulation;

namespace SimArch.Decision;

public interface IDecisionEngine
{
    ImpactReport Evaluate(ArchitectureModel model, SimulationResult? simulationResult = null, string? scenario = null);
}

public sealed record ImpactReport(
    string Scenario,
    IReadOnlyList<ImpactItem> LatencyImpacts,
    IReadOnlyList<ImpactItem> CostImpacts,
    IReadOnlyList<ImpactItem> RiskImpacts,
    IReadOnlyList<ConstraintEvaluation> ConstraintResults);

public sealed record ImpactItem(string ComponentId, string Description, string Severity);

public sealed record ConstraintEvaluation(
    string ConstraintId,
    string Metric,
    string Operator,
    double ExpectedValue,
    double? ActualValue,
    bool Passed,
    string? Scope = null);
