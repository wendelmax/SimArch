import React from 'react';
import {
  BsGrid3X3Gap,
  BsListCheck,
  BsLink45Deg,
  BsDiagram3,
  BsFileEarmarkText,
  BsPlayCircle
} from 'react-icons/bs';
import type { RibbonMainTab } from './Ribbon';

interface SidebarProps {
  activeTab: RibbonMainTab;
  onTabChange: (tab: RibbonMainTab) => void;
}

const NAV_ITEMS: { id: RibbonMainTab; label: string; icon: React.ReactNode }[] = [
  { id: 'architecture', label: 'Architecture', icon: <BsGrid3X3Gap /> },
  { id: 'requirements', label: 'Requirements', icon: <BsListCheck /> },
  { id: 'traceability', label: 'Traceability', icon: <BsLink45Deg /> },
  { id: 'flows', label: 'Flows', icon: <BsDiagram3 /> },
  { id: 'decisions', label: 'Decisions', icon: <BsFileEarmarkText /> },
  { id: 'simulation', label: 'Simulation', icon: <BsPlayCircle /> },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">S</div>
        <span className="brand-name">SimArch</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        {/* Profile or Settings could go here */}
      </div>
    </aside>
  );
}
