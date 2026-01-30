using SimArch.Domain;

namespace SimArch.Export;

public interface IExportService
{
    string ExportToAdr(ArchitectureModel model);
    string ExportToMarkdown(ArchitectureModel model);
    string ExportToJson(ArchitectureModel model);
    string ExportTraceabilityMatrix(ArchitectureModel model);
    string ExportTraceabilityMatrixCsv(ArchitectureModel model);
    string ExportMermaidSequenceDiagram(ArchitectureModel model);
    string ExportConsolidatedReport(ArchitectureModel model);
    string ExportTraceabilityGraph(ArchitectureModel model);
    string ExportDecisionLog(ArchitectureModel model);
    string ExportCostsCsv(ArchitectureModel model);
}
