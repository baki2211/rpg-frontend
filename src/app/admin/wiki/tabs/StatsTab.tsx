'use client';

import React from 'react';
import { useWikiStats } from '../../../hooks/queries/useWiki';

interface StatsTabProps {
  active: boolean;
}

export const StatsTab: React.FC<StatsTabProps> = ({ active }) => {
  const { data: stats } = useWikiStats();

  return (
    <div className="stats-tab" hidden={!active}>
      <h3>Wiki Statistics</h3>
      {stats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Sections</h4>
            <div className="stat-number">{stats.totalSections}</div>
            <div className="stat-detail">{stats.activeSections} active</div>
          </div>
          <div className="stat-card">
            <h4>Entries</h4>
            <div className="stat-number">{stats.totalEntries}</div>
            <div className="stat-detail">{stats.publishedEntries} published</div>
          </div>
          <div className="stat-card">
            <h4>Total Views</h4>
            <div className="stat-number">{stats.totalViews}</div>
          </div>
          <div className="stat-card">
            <h4>Popular Tags</h4>
            <div className="popular-tags">
              {stats.popularTags.slice(0, 10).map(({ tag, count }) => (
                <div key={tag} className="tag-stat">
                  <span className="tag">{tag}</span>
                  <span className="count">({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="loading">Loading statistics...</div>
      )}
    </div>
  );
};
