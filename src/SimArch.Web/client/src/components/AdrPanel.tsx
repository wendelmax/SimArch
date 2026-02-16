import { useCallback, useState } from 'react'
import type { AdrDef, AdrStatus, AdrOptionDef, AdrAmendmentDef, AdrAppliesToDef } from '../utils/diagramToYaml'
import type { ParametricConstraintDef } from '../utils/diagramToYaml'

const STATUS_OPTIONS: AdrStatus[] = ['Draft', 'Proposed', 'UnderReview', 'Accepted', 'Rejected', 'Implemented', 'Superseded', 'Deprecated']
const TEMPLATE_OPTIONS: { id: AdrDef['template']; label: string }[] = [
  { id: 'simarch', label: 'SimArch' },
  { id: 'nygard', label: 'Nygard' },
  { id: 'madr', label: 'MADR' },
  { id: 'business', label: 'Business Case' },
]

function slugify(s: string): string {
  if (!s?.trim()) return 'untitled'
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function checkAdrCompleteness(a: AdrDef): { ok: boolean; items: string[] } {
  const items: string[] = []
  if (!a.title?.trim()) items.push('Titulo')
  if (!a.context?.trim()) items.push('Contexto')
  if (!a.decision?.trim()) items.push('Decisao')
  if (!a.consequences?.trim()) items.push('Consequencias')
  if (!a.date) items.push('Data')
  if (!a.owner?.trim()) items.push('Responsavel')
  if (a.template === 'madr' && (!a.options || a.options.length === 0)) items.push('Opcoes (pros/cons)')
  return { ok: items.length === 0, items }
}

interface AdrPanelProps {
  adrs: AdrDef[]
  onAdrsChange: (adrs: AdrDef[]) => void
  onExportDecisionLog?: () => void
  serviceIds?: string[]
  flowIds?: string[]
  constraints?: ParametricConstraintDef[]
  onConstraintsChange?: (constraints: ParametricConstraintDef[]) => void
}

export function AdrPanel({ adrs, onAdrsChange, onExportDecisionLog, serviceIds = [], flowIds = ['main'], constraints = [], onConstraintsChange }: AdrPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newAdr, setNewAdr] = useState<AdrDef | null>(null)
  const [templateChoice, setTemplateChoice] = useState<AdrDef['template']>('simarch')

  const addAdr = useCallback(() => {
    const nextNum = adrs.length === 0 ? 1 : Math.max(...adrs.map((a) => a.number), 0) + 1
    const id = `adr-${nextNum}`
    const base: AdrDef = {
      id,
      number: nextNum,
      title: '',
      template: templateChoice,
      status: 'Draft',
      context: '',
      decision: '',
      consequences: '',
    }
    if (templateChoice === 'madr') base.options = [{ option: '', pros: [], cons: [] }]
    setNewAdr(base)
  }, [adrs.length, templateChoice])

  const saveNewAdr = useCallback(() => {
    if (newAdr && newAdr.title.trim()) {
      const date = new Date().toISOString().slice(0, 10)
      const slug = newAdr.slug || slugify(newAdr.title)
      onAdrsChange([...adrs, { ...newAdr, title: newAdr.title.trim(), date, slug }])
      setNewAdr(null)
    }
  }, [newAdr, adrs, onAdrsChange])

  const updateAdrInPlace = useCallback(
    (id: string, patch: Partial<AdrDef>) => {
      onAdrsChange(adrs.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    },
    [adrs, onAdrsChange]
  )

  const deleteAdr = useCallback(
    (id: string) => {
      onAdrsChange(adrs.filter((a) => a.id !== id))
      setEditingId(null)
      setNewAdr(null)
    },
    [adrs, onAdrsChange]
  )

  const setStatus = useCallback(
    (id: string, status: AdrStatus) => {
      const date = new Date().toISOString().slice(0, 10)
      onAdrsChange(adrs.map((a) => (a.id === id ? { ...a, status, date } : a)))
    },
    [adrs, onAdrsChange]
  )

  const addAmendment = useCallback(
    (id: string) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr) return
      const date = new Date().toISOString().slice(0, 10)
      const amendments: AdrAmendmentDef[] = [...(adr.amendments ?? []), { date, text: '' }]
      updateAdrInPlace(id, { amendments })
    },
    [adrs, updateAdrInPlace]
  )

  const updateAmendment = useCallback(
    (id: string, idx: number, text: string) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr || !adr.amendments) return
      const amendments = [...adr.amendments]
      amendments[idx] = { ...amendments[idx], text }
      updateAdrInPlace(id, { amendments })
    },
    [adrs, updateAdrInPlace]
  )

  const addAppliesTo = useCallback(
    (id: string, elementType: string, elementId: string) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr) return
      const appliesTo: AdrAppliesToDef[] = [...(adr.appliesTo ?? []), { elementType, elementId }]
      updateAdrInPlace(id, { appliesTo })
    },
    [adrs, updateAdrInPlace]
  )

  const removeAppliesTo = useCallback(
    (id: string, idx: number) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr || !adr.appliesTo) return
      const appliesTo = adr.appliesTo.filter((_, i) => i !== idx)
      updateAdrInPlace(id, { appliesTo })
    },
    [adrs, updateAdrInPlace]
  )

  const toggleLinkedConstraint = useCallback(
    (id: string, constraintId: string) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr) return
      const linked = adr.linkedConstraintIds ?? []
      const isAdding = !linked.includes(constraintId)
      const next = isAdding ? [...linked, constraintId] : linked.filter((c) => c !== constraintId)
      updateAdrInPlace(id, { linkedConstraintIds: next })
      if (onConstraintsChange) {
        const nextConstraints = constraints.map((c) =>
          c.id === constraintId ? { ...c, adrId: isAdding ? id : undefined } : c
        )
        onConstraintsChange(nextConstraints)
      }
    },
    [adrs, constraints, updateAdrInPlace, onConstraintsChange]
  )

  const addOption = useCallback(
    (id: string) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr) return
      const options: AdrOptionDef[] = [...(adr.options ?? []), { option: '', pros: [], cons: [] }]
      updateAdrInPlace(id, { options })
    },
    [adrs, updateAdrInPlace]
  )

  const updateOption = useCallback(
    (id: string, idx: number, patch: Partial<AdrOptionDef>) => {
      const adr = adrs.find((a) => a.id === id)
      if (!adr || !adr.options) return
      const options = adr.options.map((o, i) => (i === idx ? { ...o, ...patch } : o))
      updateAdrInPlace(id, { options })
    },
    [adrs, updateAdrInPlace]
  )

  return (
    <div className="property-panel adr-panel">
      <div className="property-panel-title">Decisoes arquiteturais (ADR)</div>
      <div className="adr-panel-actions">
        <select value={templateChoice} onChange={(e) => setTemplateChoice(e.target.value as AdrDef['template'])} className="adr-template-select">
          {TEMPLATE_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button type="button" className="toolbar-btn primary" onClick={addAdr}>
          Novo ADR
        </button>
        {onExportDecisionLog && (
          <button type="button" className="toolbar-btn" onClick={onExportDecisionLog}>
            Exportar Decision Log
          </button>
        )}
      </div>
      <p className="adr-panel-hint">
        Status: Draft | Proposed | UnderReview | Accepted | Rejected | Implemented | Superseded | Deprecated. Template: SimArch, Nygard, MADR, Business Case.
      </p>
      <div className="adr-list">
        {newAdr && (
          <div className="adr-card editing">
            <input placeholder="Titulo" value={newAdr.title} onChange={(e) => setNewAdr((a) => (a ? { ...a, title: e.target.value } : null))} className="adr-input adr-title" />
            <textarea placeholder="Contexto" value={newAdr.context} onChange={(e) => setNewAdr((a) => (a ? { ...a, context: e.target.value } : null))} className="adr-textarea" rows={2} />
            <textarea placeholder="Decisao" value={newAdr.decision} onChange={(e) => setNewAdr((a) => (a ? { ...a, decision: e.target.value } : null))} className="adr-textarea" rows={2} />
            <textarea placeholder="Consequencias" value={newAdr.consequences} onChange={(e) => setNewAdr((a) => (a ? { ...a, consequences: e.target.value } : null))} className="adr-textarea" rows={2} />
            <div className="adr-card-actions">
              <button type="button" className="toolbar-btn primary" onClick={saveNewAdr}>Salvar</button>
              <button type="button" className="toolbar-btn" onClick={() => setNewAdr(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {adrs.slice().sort((a, b) => a.number - b.number).map((a) => {
          const { ok, items } = checkAdrCompleteness(a)
          const isEditing = editingId === a.id
          return (
            <div key={a.id} className={`adr-card ${isEditing ? 'editing' : ''} status-${a.status.toLowerCase()}`}>
              <div className="adr-card-header">
                <span className="adr-number">ADR {a.number.toString().padStart(3, '0')}</span>
                <span className="adr-status-badge">{a.status}</span>
                {a.slug && <span className="adr-slug">{a.slug}</span>}
                {!isEditing && <span className="adr-title-text">{a.title || '(sem titulo)'}</span>}
              </div>
              {!ok && (
                <div className="adr-checklist">
                  <span className="adr-checklist-label">Completude:</span>
                  {items.map((i) => (
                    <span key={i} className="adr-checklist-item">{i}</span>
                  ))}
                </div>
              )}
              {isEditing ? (
                <div className="adr-card-fields">
                  <input placeholder="Titulo" value={a.title} onChange={(e) => updateAdrInPlace(a.id, { title: e.target.value, slug: slugify(e.target.value) || a.slug })} className="adr-input adr-title" />
                  <input placeholder="Slug (identificador)" value={a.slug ?? ''} onChange={(e) => updateAdrInPlace(a.id, { slug: e.target.value || undefined })} className="adr-input" />
                  <label>Status
                    <select value={a.status} onChange={(e) => updateAdrInPlace(a.id, { status: e.target.value as AdrStatus })} className="adr-select">
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>Template
                    <select value={a.template ?? 'simarch'} onChange={(e) => updateAdrInPlace(a.id, { template: e.target.value as AdrDef['template'] })} className="adr-select">
                      {TEMPLATE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </label>
                  <input placeholder="Data (YYYY-MM-DD)" value={a.date ?? ''} onChange={(e) => updateAdrInPlace(a.id, { date: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Responsavel (Owner)" value={a.owner ?? ''} onChange={(e) => updateAdrInPlace(a.id, { owner: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Proposto por" value={a.proposedBy ?? ''} onChange={(e) => updateAdrInPlace(a.id, { proposedBy: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Revisado por" value={a.reviewedBy ?? ''} onChange={(e) => updateAdrInPlace(a.id, { reviewedBy: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Aprovado por" value={a.approvedBy ?? ''} onChange={(e) => updateAdrInPlace(a.id, { approvedBy: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Data alvo" value={a.targetDate ?? ''} onChange={(e) => updateAdrInPlace(a.id, { targetDate: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Data revisao" value={a.reviewDate ?? ''} onChange={(e) => updateAdrInPlace(a.id, { reviewDate: e.target.value || undefined })} className="adr-input" />
                  <textarea placeholder="Contexto" value={a.context} onChange={(e) => updateAdrInPlace(a.id, { context: e.target.value })} className="adr-textarea" rows={2} />
                  <textarea placeholder="Decisao" value={a.decision} onChange={(e) => updateAdrInPlace(a.id, { decision: e.target.value })} className="adr-textarea" rows={2} />
                  <textarea placeholder="Consequencias" value={a.consequences} onChange={(e) => updateAdrInPlace(a.id, { consequences: e.target.value })} className="adr-textarea" rows={2} />
                  <input placeholder="Alternativas consideradas" value={a.alternativesConsidered ?? ''} onChange={(e) => updateAdrInPlace(a.id, { alternativesConsidered: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Referencias" value={a.references ?? ''} onChange={(e) => updateAdrInPlace(a.id, { references: e.target.value || undefined })} className="adr-input" />
                  <input placeholder="Superseded by (id)" value={a.supersededBy ?? ''} onChange={(e) => updateAdrInPlace(a.id, { supersededBy: e.target.value || undefined })} className="adr-input" />

                  <div className="adr-section">
                    <span className="adr-section-label">Amendments (living document)</span>
                    {(a.amendments ?? []).map((m, i) => (
                      <div key={i} className="adr-amendment">
                        <span>{m.date}</span>
                        <textarea value={m.text} onChange={(e) => updateAmendment(a.id, i, e.target.value)} rows={2} className="adr-textarea" />
                      </div>
                    ))}
                    <button type="button" className="toolbar-btn small" onClick={() => addAmendment(a.id)}>+ Amendment</button>
                  </div>

                  <div className="adr-section">
                    <span className="adr-section-label">Aplica-se a (rastreabilidade)</span>
                    {(a.appliesTo ?? []).map((t, i) => (
                      <div key={i} className="adr-applies-row">
                        <span>{t.elementType}: {t.elementId}</span>
                        <button type="button" className="toolbar-btn small danger" onClick={() => removeAppliesTo(a.id, i)}>x</button>
                      </div>
                    ))}
                    <select
                      className="adr-select"
                      value=""
                      onChange={(e) => {
                        const v = e.target.value
                        if (v) {
                          const [type, id] = v.split(':')
                          addAppliesTo(a.id, type, id)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Adicionar servico/fluxo...</option>
                      {serviceIds.map((id) => <option key={id} value={`service:${id}`}>{id}</option>)}
                      {flowIds.map((id) => <option key={id} value={`flow:${id}`}>{id}</option>)}
                    </select>
                  </div>

                  {a.template === 'madr' && (
                    <div className="adr-section">
                      <span className="adr-section-label">Opcoes (pros/cons)</span>
                      {(a.options ?? []).map((o, i) => (
                        <div key={i} className="adr-option-block">
                          <input placeholder="Opcao" value={o.option} onChange={(e) => updateOption(a.id, i, { option: e.target.value })} className="adr-input" />
                          <input placeholder="Pros (virgula)" value={(o.pros ?? []).join(', ')} onChange={(e) => updateOption(a.id, i, { pros: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} className="adr-input" />
                          <input placeholder="Cons (virgula)" value={(o.cons ?? []).join(', ')} onChange={(e) => updateOption(a.id, i, { cons: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} className="adr-input" />
                        </div>
                      ))}
                      <button type="button" className="toolbar-btn small" onClick={() => addOption(a.id)}>+ Opcao</button>
                    </div>
                  )}

                  <div className="adr-section">
                    <span className="adr-section-label">Fitness functions (constraints vinculadas)</span>
                    {constraints.map((c) => (
                      <label key={c.id} className="adr-constraint-link">
                        <input type="checkbox" checked={(a.linkedConstraintIds ?? []).includes(c.id)} onChange={() => toggleLinkedConstraint(a.id, c.id)} />
                        {c.id}: {c.metric} {c.operator} {c.value}
                      </label>
                    ))}
                    {constraints.length === 0 && <span className="adr-hint">Nenhuma constraint. Defina na aba Arquitetura.</span>}
                  </div>

                  <div className="adr-card-actions">
                    <button type="button" className="toolbar-btn" onClick={() => setEditingId(null)}>Fechar</button>
                    <button type="button" className="toolbar-btn danger" onClick={() => deleteAdr(a.id)}>Excluir</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="adr-context-preview">{a.context.slice(0, 120)}{a.context.length > 120 ? '...' : ''}</p>
                  {(a.appliesTo ?? []).length > 0 && <p className="adr-applies-preview">Aplica-se a: {(a.appliesTo ?? []).map((t) => `${t.elementType}:${t.elementId}`).join(', ')}</p>}
                  {(a.linkedConstraintIds ?? []).length > 0 && <p className="adr-fitness-preview">Constraints: {(a.linkedConstraintIds ?? []).join(', ')}</p>}
                  <div className="adr-card-actions">
                    <button type="button" className="toolbar-btn" onClick={() => setStatus(a.id, 'Accepted')}>Aceitar</button>
                    <button type="button" className="toolbar-btn" onClick={() => setStatus(a.id, 'Rejected')}>Rejeitar</button>
                    <button type="button" className="toolbar-btn" onClick={() => setEditingId(a.id)}>Editar</button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
      {adrs.length === 0 && !newAdr && (
        <p className="adr-empty">
          Nenhum ADR. Escolha o template e use Novo ADR para registrar uma decisao (Contexto, Decisao, Consequencias).
        </p>
      )}
    </div>
  )
}
