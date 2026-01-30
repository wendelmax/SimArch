import { useEffect, useState, useRef, useCallback } from 'react'
import mermaid from 'mermaid'
import * as api from '../api/client'

interface FlowsViewProps {
  getYaml: () => string
  onExportMermaid: () => void
}

const RENDER_ID = 'flows-mermaid-render'

export function FlowsView({ getYaml, onExportMermaid }: FlowsViewProps) {
  const [mermaidContent, setMermaidContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview')
  const [renderError, setRenderError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const yaml = getYaml()
    if (!yaml.trim()) {
      setMermaidContent(null)
      setError('Carregue ou desenhe um modelo com fluxos.')
      return
    }
    setError(null)
    api.exportMermaid(yaml).then((res) => {
      if (res.success && res.content) setMermaidContent(res.content)
      else setMermaidContent(null)
    })
  }, [getYaml])

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'dark',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#f9fafb',
        primaryBorderColor: '#374151',
        lineColor: '#94a3b8',
        secondaryColor: '#1f2937',
        tertiaryColor: '#111827',
        background: '#0b0f15',
        mainBkg: '#1f2937',
        nodeBorder: '#374151',
        clusterBkg: '#111827',
        titleColor: '#f9fafb',
        textColor: '#f9fafb',
      },
    })
  }, [])

  useEffect(() => {
    if (!mermaidContent || !previewRef.current || viewMode !== 'preview') {
      setRenderError(null)
      return
    }
    setRenderError(null)
    const id = `${RENDER_ID}-${Date.now()}`
    mermaid
      .render(id, mermaidContent)
      .then(({ svg, bindFunctions }) => {
        if (previewRef.current) {
          previewRef.current.innerHTML = svg
          bindFunctions?.(previewRef.current)
        }
      })
      .catch((err) => {
        setRenderError(err.message ?? 'Erro ao renderizar o diagrama.')
        if (previewRef.current) previewRef.current.innerHTML = ''
      })
  }, [mermaidContent, viewMode])

  const openMermaidLive = useCallback(() => {
    if (!mermaidContent) return
    const url = 'https://mermaid.live/edit'
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [mermaidContent])

  const copyCode = useCallback(() => {
    if (!mermaidContent) return
    navigator.clipboard?.writeText(mermaidContent).then(() => {
      openMermaidLive()
    }).catch(() => openMermaidLive())
  }, [mermaidContent, openMermaidLive])

  return (
    <div className="canvas-view-single flows-view">
      <div className="flows-view-header">
        <button type="button" className="toolbar-btn primary" onClick={onExportMermaid}>
          Exportar Mermaid
        </button>
        {mermaidContent && (
          <div className="flows-view-tabs">
            <button
              type="button"
              className={`flows-view-tab ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              Visualizacao
            </button>
            <button
              type="button"
              className={`flows-view-tab ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setViewMode('code')}
            >
              Codigo
            </button>
          </div>
        )}
        {mermaidContent && (
          <button type="button" className="toolbar-btn secondary" onClick={copyCode} title="Copiar e abrir no Mermaid Live">
            Abrir no Mermaid Live
          </button>
        )}
      </div>
      {error && <p className="flows-view-message">{error}</p>}
      {mermaidContent && viewMode === 'code' && (
        <pre className="flows-view-code">{mermaidContent}</pre>
      )}
      {mermaidContent && viewMode === 'preview' && (
        <div className="flows-view-preview-wrapper">
          {renderError && <p className="flows-view-render-error">{renderError}</p>}
          <div ref={previewRef} className="flows-view-preview" />
        </div>
      )}
    </div>
  )
}
