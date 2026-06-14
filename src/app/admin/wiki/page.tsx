'use client';

import React, { useState, useCallback } from 'react';
import './WikiPanel.css';
import { SectionsTab } from './tabs/SectionsTab';
import { EntriesTab } from './tabs/EntriesTab';
import { StatsTab } from './tabs/StatsTab';
import type { Message } from './types';

type TabId = 'sections' | 'entries' | 'stats';

const WikiPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('sections');
  const [message, setMessage] = useState<Message | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

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

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <SectionsTab active={activeTab === 'sections'} showMessage={showMessage} />
      <EntriesTab active={activeTab === 'entries'} showMessage={showMessage} />
      <StatsTab active={activeTab === 'stats'} />
    </div>
  );
};

export default WikiPanel;
