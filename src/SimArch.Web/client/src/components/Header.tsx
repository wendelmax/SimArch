import { useState, useRef, useEffect } from 'react';
import { EXAMPLE_PROJECTS } from '../data/exampleProjects'
import {
    BsSave,
    BsFolder2Open,
    BsPlusLg,
    BsChevronDown,
    BsDownload,
    BsCollection,
    BsExclamationTriangle,
    BsGear,
    BsLayoutSidebarReverse,
    BsPlayCircle,
    BsCloudArrowUp
} from 'react-icons/bs';

interface HeaderProps {
    modelName: string;
    onNew: () => void;
    onOpen: () => void;
    onLoadExample?: (yaml: string) => void;
    onSave: () => void;
    onExport: (type: string) => void;
    onValidate: () => void;
    onCompareScenarios?: () => void;
    onCompareCloud?: () => void;
    onTogglePanel: () => void;
    showPanel: boolean;
}

export function Header({
    modelName,
    onNew,
    onOpen,
    onLoadExample,
    onSave,
    onExport,
    onValidate,
    onCompareScenarios,
    onCompareCloud,
    onTogglePanel,
    showPanel
}: HeaderProps) {
    const [exportOpen, setExportOpen] = useState(false);
    const [examplesOpen, setExamplesOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const examplesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
            if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) setExamplesOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="model-title">{modelName}</h1>
                <div className="header-actions">
                    <button onClick={onNew} title="Novo projeto"><BsPlusLg /></button>
                    <button onClick={onOpen} title="Abrir YAML"><BsFolder2Open /></button>
                    {onLoadExample && (
                        <div className="dropdown" ref={examplesRef}>
                            <button
                                onClick={() => setExamplesOpen((v) => !v)}
                                aria-expanded={examplesOpen}
                                aria-haspopup="true"
                                title="Projetos exemplo"
                            >
                                <BsCollection /> Exemplos <BsChevronDown className="chevron" />
                            </button>
                            <div className={`dropdown-menu ${examplesOpen ? 'dropdown-menu-open' : ''}`}>
                                {EXAMPLE_PROJECTS.map((ex) => (
                                    <button key={ex.id} onClick={() => { onLoadExample(ex.yaml); setExamplesOpen(false); }} title={ex.description}>
                                        {ex.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <button onClick={onSave} className="save-btn" title="Salvar YAML"><BsSave /> Save</button>
                </div>
            </div>

            <div className="header-right">
<button onClick={onValidate} className="btn-secondary" title="Validate Conflicts">
                        <BsExclamationTriangle /> <span className="btn-label">Validate</span>
                    </button>
                    {onCompareScenarios && (
                        <button onClick={onCompareScenarios} className="btn-secondary" title="Comparar cenarios A vs B">
                            <BsPlayCircle /> <span className="btn-label">Comparar cenarios</span>
                        </button>
                    )}
                    {onCompareCloud && (
                        <button onClick={onCompareCloud} className="btn-secondary" title="Comparar em outra nuvem">
                            <BsCloudArrowUp /> <span className="btn-label">Outra nuvem</span>
                        </button>
                    )}

                <div className="dropdown" ref={exportRef}>
                    <button
                        className="btn-secondary"
                        onClick={() => setExportOpen((v) => !v)}
                        aria-expanded={exportOpen}
                        aria-haspopup="true"
                    >
                        <BsDownload /> <span className="btn-label">Export</span> <BsChevronDown className="chevron" />
                    </button>
                    <div className={`dropdown-menu ${exportOpen ? 'dropdown-menu-open' : ''}`}>
                        <button onClick={() => { onExport('adr'); setExportOpen(false); }}>Architecture Summary (PDF)</button>
                        <button onClick={() => { onExport('pdf'); setExportOpen(false); }}>Architecture Report (PDF)</button>
                        <button onClick={() => { onExport('json'); setExportOpen(false); }}>JSON Definition</button>
                        <button onClick={() => { onExport('mermaid'); setExportOpen(false); }}>Mermaid Diagram</button>
                        <button onClick={() => { onExport('consolidated'); setExportOpen(false); }}>Consolidated Report (PDF)</button>
                        <button onClick={() => { onExport('costs'); setExportOpen(false); }}>FinOps Costs (CSV)</button>
                        <button onClick={() => { onExport('decision-log'); setExportOpen(false); }}>Decision Log (PDF)</button>
                    </div>
                </div>

                <button className="btn-icon" onClick={onTogglePanel} title={showPanel ? 'Hide Panel' : 'Show Panel'} style={{ color: showPanel ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    <BsLayoutSidebarReverse />
                </button>
                <button className="btn-icon" title="Configuracoes (em breve)"><BsGear /></button>
            </div>
        </header>
    );
}
