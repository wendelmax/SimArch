import { useState, useRef, useEffect } from 'react';
import { getExamplesByCloud, CLOUD_GROUP_LABELS, type ExampleCloudGroup } from '../data/exampleProjects'
import {
    BsSave,
    BsFolder2Open,
    BsPlusLg,
    BsChevronDown,
    BsDownload,
    BsCollection,
    BsGear,
    BsLayoutSidebar,
    BsLayoutSidebarReverse,
    BsLayoutSplit
} from 'react-icons/bs';

interface HeaderProps {
    modelName: string;
    onNew: () => void;
    onOpen: () => void;
    onLoadExample?: (yaml: string) => void;
    onSave: () => void;
    onExport: (type: string) => void;
    onToggleLeftPanel: () => void;
    showLeftPanel: boolean;
    onTogglePanel: () => void;
    showPanel: boolean;
    onToggleBottomPanel: () => void;
    showBottomPanel: boolean;
}

export function Header({
    modelName,
    onNew,
    onOpen,
    onLoadExample,
    onSave,
    onExport,
    onToggleLeftPanel,
    showLeftPanel,
    onTogglePanel,
    showPanel,
    onToggleBottomPanel,
    showBottomPanel,
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
                            <div className={`dropdown-menu dropdown-menu-examples dropdown-menu-grouped ${examplesOpen ? 'dropdown-menu-open' : ''}`}>
                                {(Object.keys(CLOUD_GROUP_LABELS) as ExampleCloudGroup[]).map((cloud) => {
                                    const examples = getExamplesByCloud()[cloud]
                                    if (!examples.length) return null
                                    return (
                                        <div key={cloud} className="dropdown-group">
                                            <div className="dropdown-group-label">{CLOUD_GROUP_LABELS[cloud]}</div>
                                            {examples.map((ex) => (
                                                <button
                                                    key={ex.id}
                                                    type="button"
                                                    onClick={() => { onLoadExample(ex.yaml); setExamplesOpen(false); }}
                                                    title={ex.description}
                                                >
                                                    {ex.name}
                                                </button>
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <button onClick={onSave} className="save-btn" title="Salvar YAML"><BsSave /> Save</button>
                </div>
            </div>

            <div className="header-right">
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

                <button type="button" className="btn-icon" onClick={onToggleLeftPanel} title={showLeftPanel ? 'Ocultar painel esquerdo' : 'Mostrar painel esquerdo'} style={{ color: showLeftPanel ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    <BsLayoutSidebar />
                </button>
                <button type="button" className="btn-icon" onClick={onTogglePanel} title={showPanel ? 'Ocultar painel direito' : 'Mostrar painel direito'} style={{ color: showPanel ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    <BsLayoutSidebarReverse />
                </button>
                <button type="button" className="btn-icon" onClick={onToggleBottomPanel} title={showBottomPanel ? 'Ocultar painel inferior' : 'Mostrar painel inferior'} style={{ color: showBottomPanel ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    <BsLayoutSplit />
                </button>
                <button className="btn-icon" title="Configuracoes (em breve)"><BsGear /></button>
            </div>
        </header>
    );
}
