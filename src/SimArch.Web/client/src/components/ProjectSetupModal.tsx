import { useState } from 'react'
import type { CloudProvider } from '../data/cloudCatalog'
import { providerLabels } from '../data/cloudCatalog'

export type ProjectType = 'single' | 'multicloud'

const CLOUD_OPTIONS: CloudProvider[] = ['generic', 'aws', 'azure', 'gcp', 'oracle']

interface ProjectSetupModalProps {
  onChoose: (projectType: ProjectType, primaryCloud: CloudProvider | null) => void
}

export function ProjectSetupModal({ onChoose }: ProjectSetupModalProps) {
  const [projectType, setProjectType] = useState<ProjectType>('single')
  const [primaryCloud, setPrimaryCloud] = useState<CloudProvider>('aws')

  const handleConfirm = () => {
    onChoose(projectType, projectType === 'single' ? primaryCloud : null)
  }

  return (
    <div className="project-setup-overlay">
      <div className="project-setup-modal">
        <h2 className="project-setup-title">Tipo de projeto</h2>
        <p className="project-setup-desc">
          Cloud unica: apenas componentes de uma nuvem. Multi-cloud: sub-canvas por nuvem e pontes (gateway, fila, VPN) para ligacoes entre nuvens.
        </p>
        <div className="project-setup-options">
          <label className="project-setup-option">
            <input
              type="radio"
              name="projectType"
              checked={projectType === 'single'}
              onChange={() => setProjectType('single')}
            />
            <span>Cloud unica</span>
          </label>
          <label className="project-setup-option">
            <input
              type="radio"
              name="projectType"
              checked={projectType === 'multicloud'}
              onChange={() => setProjectType('multicloud')}
            />
            <span>Multi-cloud</span>
          </label>
        </div>
        {projectType === 'single' && (
          <div className="project-setup-cloud">
            <label htmlFor="project-setup-cloud-select" className="project-setup-cloud-label">
              Nuvem
            </label>
            <select
              id="project-setup-cloud-select"
              className="project-setup-cloud-select"
              value={primaryCloud}
              onChange={(e) => setPrimaryCloud(e.target.value as CloudProvider)}
            >
              {CLOUD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {providerLabels[p]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="project-setup-actions">
          <button type="button" className="toolbar-btn primary" onClick={handleConfirm}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
