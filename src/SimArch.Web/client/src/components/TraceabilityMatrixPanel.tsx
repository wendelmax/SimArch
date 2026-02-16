import type { RequirementDef, TraceabilityLinkDef, AdrDef } from '../utils/diagramToYaml'

interface TraceabilityMatrixPanelProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
  adrs?: AdrDef[]
  onSelectElement?: (elementId: string) => void
}

function statusFor(links: TraceabilityLinkDef[], requirementId: string): string {
  const reqLinks = links.filter((l) => l.requirementId === requirementId)
  if (reqLinks.length === 0) return 'Nao rastreado'
  const hasVerify = reqLinks.some((l) => l.linkType === 'verify')
  return hasVerify ? 'Verificado' : 'Rastreado'
}

export function TraceabilityMatrixPanel({
  requirements,
  traceabilityLinks,
  adrs = [],
  onSelectElement,
}: TraceabilityMatrixPanelProps) {
  const rows: { req: RequirementDef; link?: TraceabilityLinkDef; status: string }[] = []
  requirements.forEach((req) => {
    const reqLinks = traceabilityLinks.filter((l) => l.requirementId === req.id)
    const status = statusFor(traceabilityLinks, req.id)
    if (reqLinks.length === 0) {
      rows.push({ req, status })
    } else {
      reqLinks.forEach((link) => rows.push({ req, link, status }))
    }
  })

  return (
    <div className="property-panel">
      <div className="property-panel-title">Matriz de Rastreabilidade</div>
      <div className="traceability-matrix-wrap">
        <table className="traceability-matrix-table">
          <thead>
            <tr>
              <th>Requisito</th>
              <th>Texto</th>
              <th>Prioridade</th>
              <th>Tipo</th>
              <th>Norma</th>
              <th>Link</th>
              <th>Elemento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.link ? `${row.req.id}-${row.link.elementId}-${row.link.linkType}` : `${row.req.id}-${i}`}>
                <td>{row.req.id}</td>
                <td className="traceability-text">{row.req.text}</td>
                <td>{row.req.priority}</td>
                <td>{row.req.type}</td>
                <td>{row.req.standardRef ?? '-'}</td>
                <td>{row.link?.linkType ?? '-'}</td>
                <td>
                  {row.link ? (
                    <button
                      type="button"
                      className="traceability-element-link"
                      onClick={() => onSelectElement?.(row.link!.elementId)}
                    >
                      {row.link.elementType}:{row.link.elementId}
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td className={row.status === 'Verificado' ? 'traceability-verified' : row.status === 'Nao rastreado' ? 'traceability-untraced' : ''}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {adrs.length > 0 && (
        <>
          <div className="property-panel-title traceability-adr-title">ADR → Elementos</div>
          <table className="traceability-matrix-table">
            <thead>
              <tr>
                <th>ADR</th>
                <th>Titulo</th>
                <th>Tipo</th>
                <th>Elemento</th>
              </tr>
            </thead>
            <tbody>
              {adrs.flatMap((a) =>
                (a.appliesTo ?? []).map((t, i) => (
                  <tr key={`${a.id}-${t.elementId}-${i}`}>
                    <td>ADR {a.number.toString().padStart(3, '0')}</td>
                    <td className="traceability-text">{a.title || '(sem titulo)'}</td>
                    <td>{t.elementType}</td>
                    <td>
                      <button
                        type="button"
                        className="traceability-element-link"
                        onClick={() => onSelectElement?.(t.elementId)}
                      >
                        {t.elementId}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
      {requirements.length === 0 && adrs.length === 0 && (
        <div className="property-panel-empty">
          Nenhum requisito ou ADR. Use o painel Requisitos/Decisoes ou carregue um YAML.
        </div>
      )}
    </div>
  )
}
