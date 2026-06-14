'use client';

import React, { useState } from 'react';
import './WikiPanel.css';
import { SectionsTab } from './tabs/SectionsTab';
import { EntriesTab } from './tabs/EntriesTab';
import { StatsTab } from './tabs/StatsTab';

type TabId = 'sections' | 'entries' | 'stats';

const WikiPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('sections');

  return (
    <div className="wiki-panel">
      <div className="panel-header">
        <h2>Wiki Management</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            Sections
          </button>
          <button
            className={`tab ${activeTab === 'entries' ? 'active' : ''}`}
            onClick={() => setActiveTab('entries')}
          >
            Entries
          </button>
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>
      </div>

      <SectionsTab active={activeTab === 'sections'} />
      <EntriesTab active={activeTab === 'entries'} />
      <StatsTab active={activeTab === 'stats'} />
    </div>
  );
};

export default WikiPanel;
