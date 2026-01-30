import type { RequirementDef, TraceabilityLinkDef } from '../utils/diagramToYaml'

interface TraceabilityMatrixPanelProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
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
      {requirements.length === 0 && (
        <div className="property-panel-empty">
          Nenhum requisito. Use o painel Requisitos ou carregue um YAML.
        </div>
      )}
    </div>
  )
}
