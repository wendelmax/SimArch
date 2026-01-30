import { useCallback, useState } from 'react'
import type { AdrDef, AdrStatus } from '../utils/diagramToYaml'

const STATUS_OPTIONS: AdrStatus[] = ['Proposed', 'Accepted', 'Rejected', 'Superseded']

interface AdrPanelProps {
  adrs: AdrDef[]
  onAdrsChange: (adrs: AdrDef[]) => void
  onExportDecisionLog?: () => void
}

export function AdrPanel({ adrs, onAdrsChange, onExportDecisionLog }: AdrPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newAdr, setNewAdr] = useState<AdrDef | null>(null)

  const addAdr = useCallback(() => {
    const nextNum = adrs.length === 0 ? 1 : Math.max(...adrs.map((a) => a.number), 0) + 1
    const id = `adr-${nextNum}`
    setNewAdr({
      id,
      number: nextNum,
      title: '',
      status: 'Proposed',
      context: '',
      decision: '',
      consequences: '',
    })
  }, [adrs.length])

  const saveNewAdr = useCallback(() => {
    if (newAdr && newAdr.title.trim()) {
      const date = new Date().toISOString().slice(0, 10)
      onAdrsChange([...adrs, { ...newAdr, title: newAdr.title.trim(), date }])
      setNewAdr(null)
    }
  }, [newAdr, adrs, onAdrsChange])

  const updateAdr = useCallback(
    (id: string, patch: Partial<AdrDef>) => {
      onAdrsChange(
        adrs.map((a) => (a.id === id ? { ...a, ...patch } : a))
      )
      setEditingId(null)
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
      const adr = adrs.find((a) => a.id === id)
      if (!adr) return
      const date = new Date().toISOString().slice(0, 10)
      onAdrsChange(
        adrs.map((a) => (a.id === id ? { ...a, status, date } : a))
      )
    },
    [adrs, onAdrsChange]
  )

  return (
    <div className="property-panel adr-panel">
      <div className="property-panel-title">Decisoes arquiteturais (ADR)</div>
      <div className="adr-panel-actions">
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
        Status: Proposed (em revisao) | Accepted (aceito) | Rejected (rejeitado) | Superseded (substituido por outro ADR).
      </p>
      <div className="adr-list">
        {newAdr && (
          <div className="adr-card editing">
            <input
              placeholder="Numero"
              type="number"
              value={newAdr.number}
              onChange={(e) => setNewAdr((a) => (a ? { ...a, number: parseInt(e.target.value, 10) || 0 } : null))}
              className="adr-input"
            />
            <input
              placeholder="Titulo"
              value={newAdr.title}
              onChange={(e) => setNewAdr((a) => (a ? { ...a, title: e.target.value } : null))}
              className="adr-input adr-title"
            />
            <textarea
              placeholder="Contexto"
              value={newAdr.context}
              onChange={(e) => setNewAdr((a) => (a ? { ...a, context: e.target.value } : null))}
              className="adr-textarea"
              rows={2}
            />
            <textarea
              placeholder="Decisao"
              value={newAdr.decision}
              onChange={(e) => setNewAdr((a) => (a ? { ...a, decision: e.target.value } : null))}
              className="adr-textarea"
              rows={2}
            />
            <textarea
              placeholder="Consequencias"
              value={newAdr.consequences}
              onChange={(e) => setNewAdr((a) => (a ? { ...a, consequences: e.target.value } : null))}
              className="adr-textarea"
              rows={2}
            />
            <div className="adr-card-actions">
              <button type="button" className="toolbar-btn primary" onClick={saveNewAdr}>
                Salvar
              </button>
              <button type="button" className="toolbar-btn" onClick={() => setNewAdr(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {adrs
          .slice()
          .sort((a, b) => a.number - b.number)
          .map((a) => (
            <div key={a.id} className={`adr-card ${editingId === a.id ? 'editing' : ''} status-${a.status.toLowerCase()}`}>
              <div className="adr-card-header">
                <span className="adr-number">ADR {a.number.toString().padStart(3, '0')}</span>
                <span className="adr-status-badge">{a.status}</span>
                {editingId !== a.id ? (
                  <span className="adr-title-text">{a.title || '(sem titulo)'}</span>
                ) : null}
              </div>
              {editingId === a.id ? (
                <div className="adr-card-fields">
                  <input
                    placeholder="Titulo"
                    value={a.title}
                    onChange={(e) => updateAdr(a.id, { title: e.target.value })}
                    className="adr-input adr-title"
                  />
                  <label>
                    Status
                    <select
                      value={a.status}
                      onChange={(e) => updateAdr(a.id, { status: e.target.value as AdrStatus })}
                      className="adr-select"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    placeholder="Data (YYYY-MM-DD)"
                    value={a.date ?? ''}
                    onChange={(e) => updateAdr(a.id, { date: e.target.value || undefined })}
                    className="adr-input"
                  />
                  <input
                    placeholder="Responsavel"
                    value={a.owner ?? ''}
                    onChange={(e) => updateAdr(a.id, { owner: e.target.value || undefined })}
                    className="adr-input"
                  />
                  <textarea
                    placeholder="Contexto"
                    value={a.context}
                    onChange={(e) => updateAdr(a.id, { context: e.target.value })}
                    className="adr-textarea"
                    rows={2}
                  />
                  <textarea
                    placeholder="Decisao"
                    value={a.decision}
                    onChange={(e) => updateAdr(a.id, { decision: e.target.value })}
                    className="adr-textarea"
                    rows={2}
                  />
                  <textarea
                    placeholder="Consequencias"
                    value={a.consequences}
                    onChange={(e) => updateAdr(a.id, { consequences: e.target.value })}
                    className="adr-textarea"
                    rows={2}
                  />
                  <input
                    placeholder="Alternativas consideradas"
                    value={a.alternativesConsidered ?? ''}
                    onChange={(e) => updateAdr(a.id, { alternativesConsidered: e.target.value || undefined })}
                    className="adr-input"
                  />
                  <input
                    placeholder="Superseded by (id do novo ADR)"
                    value={a.supersededBy ?? ''}
                    onChange={(e) => updateAdr(a.id, { supersededBy: e.target.value || undefined })}
                    className="adr-input"
                  />
                  <div className="adr-card-actions">
                    <button type="button" className="toolbar-btn" onClick={() => setEditingId(null)}>
                      Fechar
                    </button>
                    <button type="button" className="toolbar-btn danger" onClick={() => deleteAdr(a.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="adr-context-preview">{a.context.slice(0, 120)}{a.context.length > 120 ? '...' : ''}</p>
                  <div className="adr-card-actions">
                    <button type="button" className="toolbar-btn" onClick={() => setStatus(a.id, 'Accepted')}>
                      Aceitar
                    </button>
                    <button type="button" className="toolbar-btn" onClick={() => setStatus(a.id, 'Rejected')}>
                      Rejeitar
                    </button>
                    <button type="button" className="toolbar-btn" onClick={() => setEditingId(a.id)}>
                      Editar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
      {adrs.length === 0 && !newAdr && (
        <p className="adr-empty">
          Nenhum ADR. Use Novo ADR para registrar uma decisao (Contexto, Decisao, Consequencias, Alternativas).
        </p>
      )}
    </div>
  )
}
