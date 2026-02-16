using System.Text;
using System.Text.Json;
using SimArch.Domain;

namespace SimArch.Export;

public sealed class ExportService : IExportService
{
    private static void AppendProjectHeader(StringBuilder sb, ArchitectureModel model, string docTitle)
    {
        sb.AppendLine("# " + docTitle + " - " + model.Name);
        sb.AppendLine();
        if (!string.IsNullOrWhiteSpace(model.Description))
        {
            sb.AppendLine("**Descricao do projeto:** " + model.Description);
            sb.AppendLine();
        }
        if (!string.IsNullOrWhiteSpace(model.Version))
        {
            sb.AppendLine("**Versao:** " + model.Version);
            sb.AppendLine();
        }
        sb.AppendLine("**Data do documento:** " + DateTime.UtcNow.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture));
        sb.AppendLine();
        if (model.Participants.Count > 0)
        {
            sb.AppendLine("**Envolvidos no projeto:**");
            foreach (var p in model.Participants)
                sb.AppendLine("- " + EscapeMd(p));
            sb.AppendLine();
        }
    }

    public string ExportToAdr(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        AppendProjectHeader(sb, model, "ADR");
        sb.Append(ExportToAdrBody(model));
        return sb.ToString();
    }

    private static string ExportToAdrBody(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("## Context");
        sb.AppendLine("Architecture model: " + model.Name);
        if (!string.IsNullOrWhiteSpace(model.Description))
            sb.AppendLine(model.Description);
        sb.AppendLine();
        sb.AppendLine("## Services");
        foreach (var s in model.Services)
        {
            sb.AppendLine("- **" + s.Name + "** (" + s.Id + ")");
            if (s.Sla != null)
                sb.AppendLine("  - SLA: " + s.Sla.MaxLatencyMs.TotalMilliseconds + "ms, " + s.Sla.AvailabilityPercent + "%");
            if (s.Timeout != null)
                sb.AppendLine("  - Timeout: " + s.Timeout.Duration.TotalMilliseconds + "ms");
            if (s.CircuitBreaker != null)
                sb.AppendLine("  - CircuitBreaker: threshold=" + s.CircuitBreaker.FailureThreshold + ", open=" + s.CircuitBreaker.OpenDuration.TotalSeconds + "s");
            if (s.Bulkhead != null)
                sb.AppendLine("  - Bulkhead: maxConcurrency=" + s.Bulkhead.MaxConcurrency);
            if (s.Queue != null)
                sb.AppendLine("  - Queue: capacity=" + s.Queue.Capacity);
            if (s.FallbackServiceId != null)
                sb.AppendLine("  - Fallback: " + s.FallbackServiceId);
        }
        sb.AppendLine();
        sb.AppendLine("## Flows");
        foreach (var f in model.Flows)
        {
            sb.AppendLine("### " + f.Name);
            foreach (var step in f.Steps)
                sb.AppendLine("- " + step.FromNodeId + " -> " + step.ToNodeId +
                    (step.OnFailureTargetId != null ? " (on failure: " + step.OnFailureTargetId + ")" : ""));
        }
        if (model.Requirements.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("## Requirements");
            foreach (var r in model.Requirements)
            {
                var links = model.TraceabilityLinks.Where(t => t.RequirementId == r.Id).ToList();
                var norm = !string.IsNullOrEmpty(r.StandardRef) ? " (" + r.StandardRef + ")" : "";
                sb.AppendLine("- **" + r.Id + "** [" + r.Priority + "] " + r.Text + norm);
                foreach (var t in links)
                    sb.AppendLine("  - " + t.LinkType + " -> " + t.ElementType + ":" + t.ElementId);
            }
        }
        return sb.ToString();
    }

    public string ExportToMarkdown(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# " + model.Name);
        sb.AppendLine();
        sb.AppendLine("## Services (" + model.Services.Count + ")");
        sb.AppendLine("| Id | Name | SLA | Timeout | CircuitBreaker | Fallback |");
        sb.AppendLine("|----|------|-----|---------|----------------|----------|");
        foreach (var s in model.Services)
        {
            var sla = s.Sla != null ? s.Sla.MaxLatencyMs.TotalMilliseconds + "ms" : "-";
            var timeout = s.Timeout != null ? s.Timeout.Duration.TotalMilliseconds + "ms" : "-";
            var cb = s.CircuitBreaker != null ? s.CircuitBreaker.FailureThreshold + "/" + s.CircuitBreaker.OpenDuration.TotalSeconds + "s" : "-";
            var fallback = s.FallbackServiceId ?? "-";
            sb.AppendLine("| " + s.Id + " | " + s.Name + " | " + sla + " | " + timeout + " | " + cb + " | " + fallback + " |");
        }
        sb.AppendLine();
        sb.AppendLine("## Flows (" + model.Flows.Count + ")");
        foreach (var f in model.Flows)
        {
            sb.AppendLine("### " + f.Name);
            sb.AppendLine(string.Join(" -> ", f.Steps.Select(x => x.FromNodeId + "->" + x.ToNodeId)));
        }
        return sb.ToString();
    }

    public string ExportToJson(ArchitectureModel model)
    {
        var dto = new
        {
            model.Id,
            model.Name,
            Services = model.Services.Select(s => new
            {
                s.Id,
                s.Name,
                SlaMs = s.Sla != null ? (int)s.Sla.MaxLatencyMs.TotalMilliseconds : (int?)null,
                Availability = s.Sla?.AvailabilityPercent,
                TimeoutMs = s.Timeout != null ? (int)s.Timeout.Duration.TotalMilliseconds : (int?)null,
                CircuitBreaker = s.CircuitBreaker != null ? new
                {
                    s.CircuitBreaker.FailureThreshold,
                    OpenDurationMs = (int)s.CircuitBreaker.OpenDuration.TotalMilliseconds,
                    s.CircuitBreaker.SuccessThresholdInHalfOpen
                } : null,
                Bulkhead = s.Bulkhead != null ? new { s.Bulkhead.MaxConcurrency } : null,
                Queue = s.Queue != null ? new { s.Queue.Capacity } : null,
                s.FallbackServiceId
            }),
            Flows = model.Flows.Select(f => new
            {
                f.Id,
                f.Name,
                Steps = f.Steps.Select(st => new { st.FromNodeId, st.ToNodeId, st.OnFailureTargetId })
            }),
            Requirements = model.Requirements.Select(r => new { r.Id, r.Text, r.Priority, r.Type, r.StandardRef }),
            TraceabilityLinks = model.TraceabilityLinks.Select(t => new { t.RequirementId, t.LinkType, t.ElementType, t.ElementId })
        };
        return JsonSerializer.Serialize(dto, new JsonSerializerOptions { WriteIndented = true });
    }

    public string ExportTraceabilityMatrix(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("# Matriz de Rastreabilidade - " + model.Name);
        sb.AppendLine();
        sb.AppendLine("| Requisito | Texto | Prioridade | Tipo | Norma | Link | Elemento | Status |");
        sb.AppendLine("|-----------|-------|------------|------|-------|------|----------|--------|");
        foreach (var r in model.Requirements)
        {
            var norm = EscapeMd(r.StandardRef ?? "-");
            var links = model.TraceabilityLinks.Where(t => t.RequirementId == r.Id).ToList();
            if (links.Count == 0)
                sb.AppendLine("| " + r.Id + " | " + EscapeMd(r.Text) + " | " + r.Priority + " | " + r.Type + " | " + norm + " | - | - | Nao rastreado |");
            else
                foreach (var t in links)
                {
                    var status = string.Equals(t.LinkType, "verify", StringComparison.OrdinalIgnoreCase) ? "Verificado" : "Rastreado";
                    sb.AppendLine("| " + r.Id + " | " + EscapeMd(r.Text) + " | " + r.Priority + " | " + r.Type + " | " + norm + " | " + t.LinkType + " | " + t.ElementType + ":" + t.ElementId + " | " + status + " |");
                }
        }
        var untraced = model.Requirements.Where(r => !model.TraceabilityLinks.Any(t => t.RequirementId == r.Id)).ToList();
        var unverified = model.Requirements.Where(r =>
            model.TraceabilityLinks.Any(t => t.RequirementId == r.Id) &&
            !model.TraceabilityLinks.Any(t => t.RequirementId == r.Id && string.Equals(t.LinkType, "verify", StringComparison.OrdinalIgnoreCase))).ToList();
        if (untraced.Count > 0 || unverified.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("## Gap Analysis");
            if (untraced.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("### Requisitos nao rastreados");
                foreach (var r in untraced)
                    sb.AppendLine("- **" + r.Id + "** " + EscapeMd(r.Text));
            }
            if (unverified.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("### Requisitos nao verificados");
                foreach (var r in unverified)
                    sb.AppendLine("- **" + r.Id + "** " + EscapeMd(r.Text));
            }
        }
        var adrsWithApplies = model.Adrs.Where(a => a.AppliesTo.Count > 0).ToList();
        if (adrsWithApplies.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("## ADR -> Elementos");
            sb.AppendLine();
            sb.AppendLine("| ADR | Titulo | Tipo | Elemento |");
            sb.AppendLine("|-----|--------|------|----------|");
            foreach (var a in adrsWithApplies)
            {
                foreach (var t in a.AppliesTo)
                    sb.AppendLine("| ADR " + a.Number.ToString("000", System.Globalization.CultureInfo.InvariantCulture) + " | " + EscapeMd(a.Title) + " | " + t.ElementType + " | " + t.ElementId + " |");
            }
        }
        return sb.ToString();
    }

    public string ExportTraceabilityMatrixCsv(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("RequirementId;Text;Priority;Type;StandardRef;LinkType;ElementType;ElementId");
        foreach (var r in model.Requirements)
        {
            var links = model.TraceabilityLinks.Where(t => t.RequirementId == r.Id).ToList();
            var norm = EscapeCsv(r.StandardRef ?? "");
            if (links.Count == 0)
                sb.AppendLine(EscapeCsv(r.Id) + ";" + EscapeCsv(r.Text) + ";" + EscapeCsv(r.Priority) + ";" + EscapeCsv(r.Type) + ";" + norm + ";;;");
            else
                foreach (var t in links)
                    sb.AppendLine(EscapeCsv(r.Id) + ";" + EscapeCsv(r.Text) + ";" + EscapeCsv(r.Priority) + ";" + EscapeCsv(r.Type) + ";" + norm + ";" + EscapeCsv(t.LinkType) + ";" + EscapeCsv(t.ElementType) + ";" + EscapeCsv(t.ElementId));
        }
        return sb.ToString();
    }

    private static string EscapeMd(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Replace("|", "\\|", StringComparison.Ordinal).Replace("\r", "").Replace("\n", " ");
    }

    private static string EscapeCsv(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        if (s.Contains(';') || s.Contains('"') || s.Contains('\n')) return "\"" + s.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
        return s;
    }

    public string ExportMermaidSequenceDiagram(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        foreach (var flow in model.Flows)
        {
            if (sb.Length > 0) sb.AppendLine();
            sb.AppendLine("sequenceDiagram");
            var participants = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var step in flow.Steps)
            {
                if (!string.IsNullOrEmpty(step.FromNodeId)) participants.Add(step.FromNodeId);
                if (!string.IsNullOrEmpty(step.ToNodeId)) participants.Add(step.ToNodeId);
                if (!string.IsNullOrEmpty(step.OnFailureTargetId)) participants.Add(step.OnFailureTargetId);
            }
            foreach (var p in participants.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
                sb.AppendLine("    participant " + MermaidId(p));
            foreach (var step in flow.Steps)
            {
                if (string.IsNullOrEmpty(step.FromNodeId) || string.IsNullOrEmpty(step.ToNodeId)) continue;
                sb.AppendLine("    " + MermaidId(step.FromNodeId) + "->>+" + MermaidId(step.ToNodeId) + ": " + flow.Name);
                if (!string.IsNullOrEmpty(step.OnFailureTargetId))
                    sb.AppendLine("    " + MermaidId(step.ToNodeId) + "-->>" + MermaidId(step.OnFailureTargetId) + ": on failure");
            }
        }
        return sb.Length > 0 ? sb.ToString() : "sequenceDiagram\n    note empty: no flows defined";
    }

    private static string MermaidId(string id)
    {
        if (string.IsNullOrEmpty(id)) return "Unknown";
        var safe = new string(id.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
        return string.IsNullOrEmpty(safe) ? "S" + id.GetHashCode(StringComparison.Ordinal).ToString("X", System.Globalization.CultureInfo.InvariantCulture) : safe;
    }

    public string ExportConsolidatedReport(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        AppendProjectHeader(sb, model, "Relatorio Consolidado");
        sb.AppendLine("## Resumo da arquitetura");
        sb.AppendLine();
        sb.Append(ExportToAdrBody(model));
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        if (model.Adrs.Count > 0)
        {
            sb.AppendLine("## Decision Log");
            sb.AppendLine();
            sb.Append(ExportDecisionLogBody(model));
            sb.AppendLine();
            sb.AppendLine("---");
            sb.AppendLine();
        }
        sb.AppendLine(ExportTraceabilityMatrix(model));
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("## Constraints");
        if (model.Constraints.Count == 0)
            sb.AppendLine("Nenhuma constraint definida.");
        else
        {
            sb.AppendLine("| Id | Metric | Operator | Value | ADR |");
            sb.AppendLine("|----|--------|----------|-------|-----|");
            foreach (var c in model.Constraints)
                sb.AppendLine("| " + c.Id + " | " + EscapeMd(c.Metric) + " | " + c.Operator + " | " + c.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) + " | " + EscapeMd(c.AdrId ?? "-") + " |");
        }
        return sb.ToString();
    }

    public string ExportTraceabilityGraph(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("flowchart LR");
        var reqNodeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var elemNodeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in model.Requirements)
            reqNodeIds.Add("req_" + MermaidId(r.Id));
        foreach (var t in model.TraceabilityLinks)
            elemNodeIds.Add("elem_" + MermaidId(t.ElementId));
        foreach (var r in model.Requirements)
        {
            var mid = MermaidId(r.Id);
            var label = EscapeMermaidLabel(r.Id);
            sb.AppendLine("    req_" + mid + "[\"" + label + "\"]");
        }
        foreach (var eid in elemNodeIds)
        {
            var elemName = eid.StartsWith("elem_", StringComparison.Ordinal) ? eid.Substring(5) : eid;
            sb.AppendLine("    " + eid + "([" + elemName + "])");
        }
        foreach (var t in model.TraceabilityLinks)
        {
            var from = "req_" + MermaidId(t.RequirementId);
            var to = "elem_" + MermaidId(t.ElementId);
            sb.AppendLine("    " + from + " -->|" + t.LinkType + "| " + to);
        }
        if (reqNodeIds.Count == 0 && elemNodeIds.Count == 0)
            return "flowchart LR\n    note([No requirements or links])";
        return sb.ToString();
    }

    private static string EscapeMermaidLabel(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Replace("\"", "'", StringComparison.Ordinal).Replace("\r", "").Replace("\n", " ").Trim();
    }

    public string ExportDecisionLog(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        AppendProjectHeader(sb, model, "Decision Log");
        sb.Append(ExportDecisionLogBody(model));
        return sb.ToString();
    }

    private static string ExportDecisionLogBody(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Registro de decisões arquiteturais (ADR). Status: Draft | Proposed | UnderReview | Accepted | Rejected | Implemented | Superseded | Deprecated.");
        sb.AppendLine();
        foreach (var a in model.Adrs.OrderBy(x => x.Number))
        {
            sb.AppendLine("---");
            sb.AppendLine();
            sb.AppendLine("## ADR " + a.Number.ToString("000", System.Globalization.CultureInfo.InvariantCulture) + " - " + EscapeMd(a.Title));
            if (!string.IsNullOrEmpty(a.Slug))
                sb.AppendLine("Slug: `" + EscapeMd(a.Slug) + "`");
            sb.AppendLine();
            sb.AppendLine("| Campo | Valor |");
            sb.AppendLine("|------|-------|");
            sb.AppendLine("| **Status** | " + EscapeMd(a.Status) + " |");
            sb.AppendLine("| **Template** | " + EscapeMd(a.Template ?? "simarch") + " |");
            sb.AppendLine("| **Data** | " + EscapeMd(a.Date ?? "-") + " |");
            sb.AppendLine("| **Responsável** | " + EscapeMd(a.Owner ?? "-") + " |");
            if (!string.IsNullOrEmpty(a.ProposedBy))
                sb.AppendLine("| **Proposto por** | " + EscapeMd(a.ProposedBy) + " |");
            if (!string.IsNullOrEmpty(a.ReviewedBy))
                sb.AppendLine("| **Revisado por** | " + EscapeMd(a.ReviewedBy) + " |");
            if (!string.IsNullOrEmpty(a.ApprovedBy))
                sb.AppendLine("| **Aprovado por** | " + EscapeMd(a.ApprovedBy) + " |");
            if (!string.IsNullOrEmpty(a.TargetDate))
                sb.AppendLine("| **Data alvo** | " + EscapeMd(a.TargetDate) + " |");
            if (!string.IsNullOrEmpty(a.ReviewDate))
                sb.AppendLine("| **Data revisão** | " + EscapeMd(a.ReviewDate) + " |");
            if (a.Stakeholders.Count > 0)
                sb.AppendLine("| **Stakeholders** | " + EscapeMd(string.Join(", ", a.Stakeholders)) + " |");
            if (!string.IsNullOrEmpty(a.SupersededBy))
                sb.AppendLine("| **Superseded by** | " + EscapeMd(a.SupersededBy) + " |");
            sb.AppendLine();
            sb.AppendLine("### Context");
            sb.AppendLine();
            sb.AppendLine(a.Context);
            sb.AppendLine();
            sb.AppendLine("### Decision");
            sb.AppendLine();
            sb.AppendLine(a.Decision);
            sb.AppendLine();
            sb.AppendLine("### Consequences");
            sb.AppendLine();
            sb.AppendLine(a.Consequences);
            if (!string.IsNullOrWhiteSpace(a.AlternativesConsidered))
            {
                sb.AppendLine();
                sb.AppendLine("### Alternatives Considered");
                sb.AppendLine();
                sb.AppendLine(a.AlternativesConsidered);
            }
            if (!string.IsNullOrWhiteSpace(a.References))
            {
                sb.AppendLine();
                sb.AppendLine("### References");
                sb.AppendLine();
                sb.AppendLine(a.References);
            }
            if (a.Amendments.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("### Amendments");
                sb.AppendLine();
                foreach (var m in a.Amendments)
                {
                    sb.AppendLine("- **" + EscapeMd(m.Date) + "**: " + EscapeMd(m.Text));
                }
            }
            if (a.AppliesTo.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("### Applies To");
                sb.AppendLine();
                foreach (var t in a.AppliesTo)
                    sb.AppendLine("- " + t.ElementType + ": " + t.ElementId);
            }
            if (a.LinkedConstraintIds.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("### Fitness Functions (Constraints)");
                sb.AppendLine();
                foreach (var cid in a.LinkedConstraintIds)
                    sb.AppendLine("- " + cid);
            }
            if (a.Options.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("### Options");
                sb.AppendLine();
                foreach (var o in a.Options)
                {
                    sb.AppendLine("**" + EscapeMd(o.Option) + "**");
                    if (o.Pros.Count > 0)
                    {
                        sb.AppendLine("- Pros: " + string.Join("; ", o.Pros));
                    }
                    if (o.Cons.Count > 0)
                    {
                        sb.AppendLine("- Cons: " + string.Join("; ", o.Cons));
                    }
                    sb.AppendLine();
                }
            }
            sb.AppendLine();
        }
        if (model.Adrs.Count == 0)
        {
            sb.AppendLine("Nenhum ADR registrado.");
        }
        return sb.ToString();
    }

    public string ExportCostsCsv(ArchitectureModel model)
    {
        var sb = new StringBuilder();
        sb.AppendLine("id;nome;custo_mes;custo_hora;moeda");
        var withCost = model.Services.Where(s => (s.CostPerMonth ?? 0) > 0 || (s.CostPerHour ?? 0) > 0).ToList();
        double totalMonth = 0, totalHour = 0;
        var currency = "USD";
        foreach (var s in withCost)
        {
            var month = s.CostPerMonth ?? 0;
            var hour = s.CostPerHour ?? 0;
            currency = s.Currency ?? currency;
            totalMonth += month;
            totalHour += hour;
            sb.AppendLine(EscapeCsv(s.Id) + ";" + EscapeCsv(s.Name) + ";" + month.ToString(System.Globalization.CultureInfo.InvariantCulture) + ";" + hour.ToString(System.Globalization.CultureInfo.InvariantCulture) + ";" + EscapeCsv(currency));
        }
        if (withCost.Count > 0)
            sb.AppendLine("TOTAL;;" + totalMonth.ToString(System.Globalization.CultureInfo.InvariantCulture) + ";" + totalHour.ToString(System.Globalization.CultureInfo.InvariantCulture) + ";" + currency);
        return sb.ToString();
    }
}

