import { useCallback, useState } from 'react'
import type { RequirementDef, TraceabilityLinkDef } from '../utils/diagramToYaml'

interface RequirementsPanelProps {
  requirements: RequirementDef[]
  traceabilityLinks: TraceabilityLinkDef[]
  onRequirementsChange: (requirements: RequirementDef[]) => void
  onTraceabilityLinksChange: (links: TraceabilityLinkDef[]) => void
  elementIds: string[]
}

export function RequirementsPanel({
  requirements,
  traceabilityLinks,
  onRequirementsChange,
  onTraceabilityLinksChange,
  elementIds,
}: RequirementsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newReq, setNewReq] = useState<RequirementDef | null>(null)

  const addLink = useCallback(
    (requirementId: string, linkType: 'satisfy' | 'verify', elementId: string) => {
      if (!elementId) return
      onTraceabilityLinksChange([
        ...traceabilityLinks,
        { requirementId, linkType, elementType: 'service', elementId },
      ])
    },
    [traceabilityLinks, onTraceabilityLinksChange]
  )

  const removeLink = useCallback(
    (link: TraceabilityLinkDef) => {
      onTraceabilityLinksChange(
        traceabilityLinks.filter(
          (l) =>
            !(l.requirementId === link.requirementId && l.elementId === link.elementId && l.linkType === link.linkType)
        )
      )
    },
    [traceabilityLinks, onTraceabilityLinksChange]
  )

  const addRequirement = useCallback(() => {
    const id = `R${(requirements.length + 1).toString().padStart(2, '0')}`
    setNewReq({ id, text: '', priority: 'medium', type: 'functional' })
  }, [requirements.length])

  const saveNewRequirement = useCallback(() => {
    if (newReq && newReq.text.trim()) {
      onRequirementsChange([...requirements, { ...newReq, text: newReq.text.trim() }])
      setNewReq(null)
    }
  }, [newReq, requirements, onRequirementsChange])

  const updateRequirement = useCallback(
    (id: string, patch: Partial<RequirementDef>) => {
      onRequirementsChange(
        requirements.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
      setEditingId(null)
    },
    [requirements, onRequirementsChange]
  )

  const deleteRequirement = useCallback(
    (id: string) => {
      onRequirementsChange(requirements.filter((r) => r.id !== id))
      onTraceabilityLinksChange(traceabilityLinks.filter((l) => l.requirementId !== id))
    },
    [requirements, traceabilityLinks, onRequirementsChange, onTraceabilityLinksChange]
  )

  const linksFor = (requirementId: string) =>
    traceabilityLinks.filter((l) => l.requirementId === requirementId)

  return (
    <div className="property-panel">
      <div className="property-panel-title">Requisitos</div>
      <div className="requirements-panel-actions">
        <button type="button" className="toolbar-btn primary" onClick={addRequirement}>
          Adicionar
        </button>
      </div>
      <div className="requirements-panel-list">
        {newReq && (
          <div className="requirement-card editing">
            <input
              placeholder="Id"
              value={newReq.id}
              onChange={(e) => setNewReq((r) => (r ? { ...r, id: e.target.value } : null))}
              className="requirement-input"
            />
            <input
              placeholder="Texto"
              value={newReq.text}
              onChange={(e) => setNewReq((r) => (r ? { ...r, text: e.target.value } : null))}
              className="requirement-input"
            />
            <select
              value={newReq.priority}
              onChange={(e) => setNewReq((r) => (r ? { ...r, priority: e.target.value } : null))}
              className="requirement-select"
            >
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
            <select
              value={newReq.type}
              onChange={(e) => setNewReq((r) => (r ? { ...r, type: e.target.value } : null))}
              className="requirement-select"
            >
              <option value="functional">functional</option>
              <option value="non-functional">non-functional</option>
            </select>
            <input
              placeholder="Norma (opcional)"
              value={newReq.standardRef ?? ''}
              onChange={(e) => setNewReq((r) => (r ? { ...r, standardRef: e.target.value || undefined } : null))}
              className="requirement-input"
            />
            <div className="requirement-card-actions">
              <button type="button" className="toolbar-btn primary" onClick={saveNewRequirement}>
                Salvar
              </button>
              <button type="button" className="toolbar-btn" onClick={() => setNewReq(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {requirements.map((r) => (
          <div key={r.id} className="requirement-card">
            {editingId === r.id ? (
              <>
                <input
                  value={r.id}
                  onChange={(e) => updateRequirement(r.id, { id: e.target.value })}
                  className="requirement-input"
                />
                <input
                  value={r.text}
                  onChange={(e) => updateRequirement(r.id, { text: e.target.value })}
                  className="requirement-input"
                />
                <select
                  value={r.priority}
                  onChange={(e) => updateRequirement(r.id, { priority: e.target.value })}
                  className="requirement-select"
                >
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
                <select
                  value={r.type}
                  onChange={(e) => updateRequirement(r.id, { type: e.target.value })}
                  className="requirement-select"
                >
                  <option value="functional">functional</option>
                  <option value="non-functional">non-functional</option>
                </select>
                <input
                  placeholder="Norma"
                  value={r.standardRef ?? ''}
                  onChange={(e) => updateRequirement(r.id, { standardRef: e.target.value || undefined })}
                  className="requirement-input"
                />
                <div className="requirement-card-actions">
                  <button type="button" className="toolbar-btn" onClick={() => setEditingId(null)}>
                    Fechar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="requirement-card-header">
                  <span className="requirement-id">{r.id}</span>
                  <span className="requirement-priority">{r.priority}</span>
                  <span className="requirement-type">{r.type}</span>
                </div>
                <div className="requirement-text">{r.text}</div>
                {r.standardRef && (
                  <div className="requirement-norma">Norma: {r.standardRef}</div>
                )}
                <div className="requirement-links">
                  {linksFor(r.id).map((t, i) => (
                    <span key={i} className="requirement-link-tag">
                      {t.linkType} → {t.elementId}
                      <button
                        type="button"
                        className="requirement-link-remove"
                        onClick={() => removeLink(t)}
                        aria-label="Remover link"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <select
                    className="requirement-link-add"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value
                      if (v) {
                        addLink(r.id, 'satisfy', v)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">Satisfeito por...</option>
                    {elementIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <select
                    className="requirement-link-add"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value
                      if (v) {
                        addLink(r.id, 'verify', v)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">Verificado por...</option>
                    {elementIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="requirement-card-actions">
                  <button type="button" className="toolbar-btn" onClick={() => setEditingId(r.id)}>
                    Editar
                  </button>
                  <button type="button" className="toolbar-btn" onClick={() => deleteRequirement(r.id)}>
                    Remover
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {requirements.length === 0 && !newReq && (
        <div className="property-panel-empty">
          Nenhum requisito. Adicione ou carregue um YAML com requirements.
        </div>
      )}
    </div>
  )
}
