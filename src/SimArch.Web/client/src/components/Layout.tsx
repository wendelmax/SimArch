import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SimulationBottomPanel } from './SimulationBottomPanel';
import type { RibbonMainTab } from './Ribbon';
import type { ServiceMetricsDto, ConstraintEvaluationDto } from '../api/client';

interface SimulationResultData {
    elapsedSec: number;
    serviceMetrics: ServiceMetricsDto[];
    constraintResults: ConstraintEvaluationDto[];
}

interface LayoutProps {
    children: React.ReactNode;
    activeTab: RibbonMainTab;
    onTabChange: (tab: RibbonMainTab) => void;
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
    simulationResult?: SimulationResultData | null;
    simulationViewMode?: 'dashboard' | 'live';
}

export function Layout({
    children,
    activeTab,
    onTabChange,
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
    simulationResult,
    simulationViewMode = 'dashboard',
}: LayoutProps) {
    const showLayoutBottomPanel = activeTab === 'simulation' && showBottomPanel && simulationViewMode === 'live';

    return (
        <div className="layout-root">
            {showLeftPanel && <Sidebar activeTab={activeTab} onTabChange={onTabChange} />}
            <div className={`layout-main ${showLayoutBottomPanel ? 'layout-main-with-bottom' : ''}`}>
                <Header
                    modelName={modelName}
                    onNew={onNew}
                    onOpen={onOpen}
                    onLoadExample={onLoadExample}
                    onSave={onSave}
                    onExport={onExport}
                    onToggleLeftPanel={onToggleLeftPanel}
                    showLeftPanel={showLeftPanel}
                    onTogglePanel={onTogglePanel}
                    showPanel={showPanel}
                    onToggleBottomPanel={onToggleBottomPanel}
                    showBottomPanel={showBottomPanel}
                />
                <main className="content-area">
                    {children}
                </main>
                {showLayoutBottomPanel && (
                    <div className="layout-bottom-panel-wrapper">
                        <SimulationBottomPanel
                            elapsedSec={simulationResult?.elapsedSec ?? 0}
                            serviceMetrics={simulationResult?.serviceMetrics ?? []}
                            constraintResults={simulationResult?.constraintResults ?? []}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
