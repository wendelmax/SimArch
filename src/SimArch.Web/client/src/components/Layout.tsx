import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { RibbonMainTab } from './Ribbon';

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
    onValidate: () => void;
    onCompareScenarios?: () => void;
    onCompareCloud?: () => void;
    onTogglePanel: () => void;
    showPanel: boolean;
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
    onValidate,
    onCompareScenarios,
    onCompareCloud,
    onTogglePanel,
    showPanel
}: LayoutProps) {
    return (
        <div className="layout-root">
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
            <div className="layout-main">
                <Header
                    modelName={modelName}
                    onNew={onNew}
                    onOpen={onOpen}
                    onLoadExample={onLoadExample}
                    onSave={onSave}
                    onExport={onExport}
                    onValidate={onValidate}
                    onCompareScenarios={onCompareScenarios}
                    onCompareCloud={onCompareCloud}
                    onTogglePanel={onTogglePanel}
                    showPanel={showPanel}
                />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
}
