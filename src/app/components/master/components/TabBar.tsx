import React from 'react';
import type { TabKey } from '../constants';

interface TabBarProps {
  tabs: readonly { key: TabKey; label: string }[];
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange }) => (
  <div className="master-panel-tabs">
    {tabs.map(({ key, label }) => (
      <button
        key={key}
        className={`tab ${active === key ? 'active' : ''}`}
        onClick={() => onChange(key)}
      >
        {label}
      </button>
    ))}
  </div>
);
