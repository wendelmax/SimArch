import { useCallback, useState } from 'react'
import type { ParametricConstraintDef, AdrDef } from '../utils/diagramToYaml'

const OPERATORS = ['lt', 'le', 'eq', 'ge', 'gt', 'ne'] as const

interface ConstraintsPanelProps {
  constraints: ParametricConstraintDef[]
  onConstraintsChange: (constraints: ParametricConstraintDef[]) => void
  adrs: AdrDef[]
  onAdrsChange?: (adrs: AdrDef[]) => void
}

export function ConstraintsPanel({ constraints, onConstraintsChange, adrs, onAdrsChange }: ConstraintsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newConstraint, setNewConstraint] = useState<ParametricConstraintDef | null>(null)

  const addConstraint = useCallback(() => {
    const id = `C${(constraints.length + 1).toString().padStart(2, '0')}`
    setNewConstraint({ id, metric: 'availability', operator: 'ge', value: 99 })
  }, [constraints.length])

  const saveNewConstraint = useCallback(() => {
    if (newConstraint && newConstraint.metric?.trim()) {
      const saved = { ...newConstraint, metric: newConstraint.metric.trim() }
      onConstraintsChange([...constraints, saved])
      if (saved.adrId && onAdrsChange) {
        const adr = adrs.find((a) => a.id === saved.adrId)
        if (adr && !(adr.linkedConstraintIds ?? []).includes(saved.id)) {
          const linked = [...(adr.linkedConstraintIds ?? []), saved.id]
          onAdrsChange(adrs.map((a) => (a.id === saved.adrId ? { ...a, linkedConstraintIds: linked } : a)))
        }
      }
      setNewConstraint(null)
    }
  }, [newConstraint, constraints, adrs, onConstraintsChange, onAdrsChange])

  const updateInPlace = useCallback(
    (id: string, patch: Partial<ParametricConstraintDef>) => {
      const prev = constraints.find((c) => c.id === id)
      const nextConstraints = constraints.map((c) => (c.id === id ? { ...c, ...patch } : c))
      onConstraintsChange(nextConstraints)
      if (onAdrsChange && 'adrId' in patch && prev) {
        const newAdrId = patch.adrId as string | undefined
        const oldAdrId = prev.adrId
        let nextAdrs = adrs
        if (oldAdrId && oldAdrId !== newAdrId) {
          const oldAdr = nextAdrs.find((a) => a.id === oldAdrId)
          if (oldAdr) {
            const linked = (oldAdr.linkedConstraintIds ?? []).filter((cid) => cid !== id)
            nextAdrs = nextAdrs.map((a) => (a.id === oldAdrId ? { ...a, linkedConstraintIds: linked } : a))
          }
        }
        if (newAdrId) {
          const newAdr = nextAdrs.find((a) => a.id === newAdrId)
          if (newAdr && !(newAdr.linkedConstraintIds ?? []).includes(id)) {
            const linked = [...(newAdr.linkedConstraintIds ?? []), id]
            nextAdrs = nextAdrs.map((a) => (a.id === newAdrId ? { ...a, linkedConstraintIds: linked } : a))
          }
        }
        if ((oldAdrId && oldAdrId !== newAdrId) || newAdrId) onAdrsChange(nextAdrs)
      }
    },
    [constraints, adrs, onConstraintsChange, onAdrsChange]
  )

  const deleteConstraint = useCallback(
    (id: string) => {
      onConstraintsChange(constraints.filter((c) => c.id !== id))
      setEditingId(null)
      setNewConstraint(null)
    },
    [constraints, onConstraintsChange]
  )

  return (
    <div className="property-panel constraints-panel">
      <div className="property-panel-title">Constraints (Fitness Functions)</div>
      <p className="constraints-panel-hint">
        Defina metricas arquiteturais. Vincule a um ADR para rastreabilidade.
      </p>
      <button type="button" className="toolbar-btn primary" onClick={addConstraint}>
        Nova constraint
      </button>
      <div className="constraints-list">
        {newConstraint && (
          <div className="constraint-card editing">
            <input placeholder="Id (ex: C01)" value={newConstraint.id} onChange={(e) => setNewConstraint((c) => (c ? { ...c, id: e.target.value } : null))} className="adr-input" />
            <input placeholder="Metrica (ex: availability)" value={newConstraint.metric} onChange={(e) => setNewConstraint((c) => (c ? { ...c, metric: e.target.value } : null))} className="adr-input" />
            <select value={newConstraint.operator} onChange={(e) => setNewConstraint((c) => (c ? { ...c, operator: e.target.value as ParametricConstraintDef['operator'] } : null))} className="adr-select">
              {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <input type="number" value={newConstraint.value} onChange={(e) => setNewConstraint((c) => (c ? { ...c, value: Number(e.target.value) || 0 } : null))} className="adr-input" />
            <select value={newConstraint.adrId ?? ''} onChange={(e) => setNewConstraint((c) => (c ? { ...c, adrId: e.target.value || undefined } : null))} className="adr-select">
              <option value="">Nenhum ADR</option>
              {adrs.map((a) => <option key={a.id} value={a.id}>ADR {a.number}: {a.title || '(sem titulo)'}</option>)}
            </select>
            <div className="constraint-card-actions">
              <button type="button" className="toolbar-btn primary" onClick={saveNewConstraint}>Salvar</button>
              <button type="button" className="toolbar-btn" onClick={() => setNewConstraint(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {constraints.map((c) => {
          const isEditing = editingId === c.id
          return (
            <div key={c.id} className={`constraint-card ${isEditing ? 'editing' : ''}`}>
              {isEditing ? (
                <div className="constraint-card-fields">
                  <input value={c.id} onChange={(e) => updateInPlace(c.id, { id: e.target.value })} className="adr-input" />
                  <input value={c.metric} onChange={(e) => updateInPlace(c.id, { metric: e.target.value })} className="adr-input" />
                  <select value={c.operator} onChange={(e) => updateInPlace(c.id, { operator: e.target.value as ParametricConstraintDef['operator'] })} className="adr-select">
                    {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input type="number" value={c.value} onChange={(e) => updateInPlace(c.id, { value: Number(e.target.value) || 0 })} className="adr-input" />
                  <label>ADR
                    <select value={c.adrId ?? ''} onChange={(e) => updateInPlace(c.id, { adrId: e.target.value || undefined })} className="adr-select">
                      <option value="">Nenhum</option>
                      {adrs.map((a) => <option key={a.id} value={a.id}>ADR {a.number}: {a.title || '(sem titulo)'}</option>)}
                    </select>
                  </label>
                  <div className="constraint-card-actions">
                    <button type="button" className="toolbar-btn" onClick={() => setEditingId(null)}>Fechar</button>
                    <button type="button" className="toolbar-btn danger" onClick={() => deleteConstraint(c.id)}>Excluir</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="constraint-card-header">
                    <span className="constraint-id">{c.id}</span>
                    {c.adrId && <span className="constraint-adr">ADR: {adrs.find((a) => a.id === c.adrId)?.number ?? c.adrId}</span>}
                  </div>
                  <p className="constraint-rule">{c.metric} {c.operator} {c.value}</p>
                  <button type="button" className="toolbar-btn small" onClick={() => setEditingId(c.id)}>Editar</button>
                </>
              )}
            </div>
          )
        })}
      </div>
      {constraints.length === 0 && !newConstraint && (
        <p className="constraints-empty">Nenhuma constraint. Use Nova constraint para criar fitness functions.</p>
      )}
    </div>
  )
}
