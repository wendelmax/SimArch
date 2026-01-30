import { useState, useEffect } from 'react'

interface ProjectInfoCardProps {
  modelName: string
  onModelNameChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  version: string
  onVersionChange: (value: string) => void
  participants: string[]
  onParticipantsChange: (value: string[]) => void
}

export function ProjectInfoCard({
  modelName,
  onModelNameChange,
  description,
  onDescriptionChange,
  version,
  onVersionChange,
  participants,
  onParticipantsChange,
}: ProjectInfoCardProps) {
  const [participantsText, setParticipantsText] = useState(participants.join('\n'))
  useEffect(() => {
    setParticipantsText(participants.join('\n'))
  }, [participants])

  const handleParticipantsBlur = () => {
    const list = participantsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (JSON.stringify(list) !== JSON.stringify(participants)) onParticipantsChange(list)
  }

  return (
    <div className="project-info-card">
      <div className="project-info-title">Identificacao do projeto</div>
      <p className="project-info-hint">
        Preencha para que a documentacao exportada (ADR, Decision Log, Relatorio consolidado) inclua projeto e envolvidos.
      </p>
      <label className="project-info-label">
        Nome do projeto
        <input
          type="text"
          className="project-info-input"
          value={modelName}
          onChange={(e) => onModelNameChange(e.target.value)}
          placeholder="Ex: Sistema de Checkout"
        />
      </label>
      <label className="project-info-label">
        Descricao
        <textarea
          className="project-info-textarea"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Breve descricao do projeto ou contexto"
          rows={2}
        />
      </label>
      <label className="project-info-label">
        Versao
        <input
          type="text"
          className="project-info-input project-info-version"
          value={version}
          onChange={(e) => onVersionChange(e.target.value)}
          placeholder="Ex: 1.0.0"
        />
      </label>
      <label className="project-info-label">
        Envolvidos no projeto (um por linha; ex: Nome - Papel)
        <textarea
          className="project-info-textarea"
          value={participantsText}
          onBlur={handleParticipantsBlur}
          onChange={(e) => setParticipantsText(e.target.value)}
          placeholder="Joao Silva - Arquiteto&#10;Maria Santos - Product Owner"
          rows={3}
        />
      </label>
    </div>
  )
}
