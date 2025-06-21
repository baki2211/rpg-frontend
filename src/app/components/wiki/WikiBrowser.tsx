import React, { useState, useEffect } from 'react';
import './WikiBrowser.css';
import { api } from '../../../services/apiClient';

// WikiSection interface removed as it's not used in this component

interface WikiEntry {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  section: {
    name: string;
    slug: string;
  };
}

interface WikiEntryDetail extends WikiEntry {
  content: string;
}

interface WikiNavigationEntry {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  level: number;
  children?: WikiNavigationEntry[];
}

interface WikiNavigation {
  sections: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    entries: WikiNavigationEntry[];
  }>;
}

// Recursive component for rendering hierarchical entries
const HierarchicalEntryList: React.FC<{
  entries: WikiNavigationEntry[];
  sectionSlug: string;
  currentEntryId?: number;
  onEntryClick: (sectionSlug: string, entrySlug: string) => void;
  level?: number;
}> = ({ entries, sectionSlug, currentEntryId, onEntryClick, level = 1 }) => {
  return (
    <div className={`entry-level-${level}`}>
      {entries.map((entry) => (
        <div key={entry.id} className="entry-item-container">
          <div
            className={`nav-entry level-${entry.level} ${currentEntryId === entry.id ? 'active' : ''}`}
            onClick={() => onEntryClick(sectionSlug, entry.slug)}
            style={{ marginLeft: `${(entry.level - 1) * 16}px` }}
          >
            {entry.title}
          </div>
          {entry.children && entry.children.length > 0 && (
            <HierarchicalEntryList
              entries={entry.children}
              sectionSlug={sectionSlug}
              currentEntryId={currentEntryId}
              onEntryClick={onEntryClick}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Flatten entries for grid view
const flattenEntries = (entries: WikiNavigationEntry[]): WikiNavigationEntry[] => {
  const flattened: WikiNavigationEntry[] = [];
  
  const flatten = (entryList: WikiNavigationEntry[]) => {
    entryList.forEach(entry => {
      flattened.push(entry);
      if (entry.children && entry.children.length > 0) {
        flatten(entry.children);
      }
    });
  };
  
  flatten(entries);
  return flattened;
};

export const WikiBrowser: React.FC = () => {
  const [navigation, setNavigation] = useState<WikiNavigation | null>(null);
  const [currentEntry, setCurrentEntry] = useState<WikiEntryDetail | null>(null);
  const [searchResults, setSearchResults] = useState<WikiEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagEntries, setTagEntries] = useState<WikiEntry[]>([]);
  // const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'navigation' | 'entry' | 'search' | 'tag'>('navigation');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchNavigation();
    // fetchTags();
  }, []);

  const fetchNavigation = async () => {
    try {
      const response = await api.get<{success: boolean, data: WikiNavigation}>('/wiki/navigation');
      console.log('Navigation response:', response.data); // Debug log
      
      if (response.data && response.data.data && response.data.data.sections) {
        setNavigation(response.data.data);
        // Expand all sections by default
        const allSectionIds = response.data.data.sections.map(s => s.id);
        setExpandedSections(new Set(allSectionIds));
      } else {
        console.warn('Navigation data structure unexpected:', response.data);
        setNavigation({ sections: [] });
      }
    } catch (error) {
      console.error('Error fetching navigation:', error);
      setNavigation({ sections: [] });
    }
  };

  // const fetchTags = async () => {
  //   try {
  //     const response = await api.get<{success: boolean, data: string[]}>('/wiki/tags');
  //     setAvailableTags(response.data.data || []);
  //   } catch (error) {
  //     console.error('Error fetching tags:', error);
  //   }
  // };

  const fetchEntry = async (sectionSlug: string, entrySlug: string) => {
    setLoading(true);
    try {
      const response = await api.get<{success: boolean, data: WikiEntryDetail}>(`/wiki/sections/${sectionSlug}/entries/${entrySlug}`);
      setCurrentEntry(response.data.data);
      setView('entry');
    } catch (error) {
      console.error('Error fetching entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setView('navigation');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<{success: boolean, data: WikiEntry[]}>(`/wiki/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.data || []);
      setView('search');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = async (tag: string) => {
    setLoading(true);
    try {
      const response = await api.get<{success: boolean, data: WikiEntry[]}>(`/wiki/tags/${encodeURIComponent(tag)}/entries`);
      setTagEntries(response.data.data || []);
      setSelectedTag(tag);
      setView('tag');
    } catch (error) {
      console.error('Error fetching tag entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToNavigation = () => {
    setView('navigation');
    setCurrentEntry(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTag(null);
    setTagEntries([]);
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  };

  if (loading && !navigation) {
    return (
      <div className="wiki-browser loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="wiki-container">
      {/* Side Navigation */}
      <div className="wiki-sidebar">
        <div className="sidebar-header">
          <h2>Wiki Navigation</h2>
        </div>

        {navigation && (
          <div className="sidebar-navigation">
            {(navigation.sections || []).map((section) => (
              <div key={section.id} className="nav-section">
                <div 
                  className="section-title"
                  onClick={() => toggleSection(section.id)}
                >
                  <span className={`section-toggle ${expandedSections.has(section.id) ? 'expanded' : ''}`}>
                    ▶
                  </span>
                  {section.name}
                </div>
                
                {expandedSections.has(section.id) && (
                  <div className="section-entries">
                    {(section.entries || []).length > 0 ? (
                      <HierarchicalEntryList
                        entries={section.entries}
                        sectionSlug={section.slug}
                        currentEntryId={currentEntry?.id}
                        onEntryClick={fetchEntry}
                      />
                    ) : (
                      <div className="no-entries">No entries</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="wiki-main">
        <div className="wiki-header">
          <h1>RPG World Wiki</h1>
          <p>Explore the lore, races, geography, and history of our world</p>
          
          <div className="wiki-search">
            <input
              type="text"
              placeholder="Search the wiki..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            />
            <button onClick={() => handleSearch(searchQuery)}>Search</button>
          </div>

          {view !== 'navigation' && (
            <button className="back-button" onClick={handleBackToNavigation}>
              ← Back to Navigation
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-content">
            <div className="loading-spinner">Loading...</div>
          </div>
        )}

        {view === 'navigation' && navigation && !loading && (
          <div className="wiki-navigation">
            <div className="sections-grid">
              {(navigation.sections || []).map((section) => (
                <div key={section.id} className="section-card">
                  <div className="section-header">
                    <h2>{section.name}</h2>
                    {section.description && (
                      <p className="section-description">{section.description}</p>
                    )}
                    <div className="entry-count">{section.entries?.length || 0} entries</div>
                  </div>
                  
                  <div className="entries-list">
                    {(section.entries || []).length > 0 ? (
                      flattenEntries(section.entries).map((entry) => (
                        <div
                          key={entry.id}
                          className={`entry-item level-${entry.level}`}
                          onClick={() => fetchEntry(section.slug, entry.slug)}
                          style={{ marginLeft: `${(entry.level - 1) * 20}px` }}
                        >
                          <h4>{entry.title}</h4>
                          {entry.excerpt && (
                            <p className="entry-excerpt">{entry.excerpt}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-entries">No entries yet</div>
                    )}
                  </div>
                </div>
              ))}
            </div>


          </div>
        )}

        {view === 'entry' && currentEntry && !loading && (
          <div className="wiki-entry">
            <div className="entry-header">
              <div className="breadcrumb">
                <span className="section-name">{currentEntry.section.name}</span>
                <span className="separator">›</span>
                <span className="entry-title">{currentEntry.title}</span>
              </div>
              
              <h1>{currentEntry.title}</h1>
              
              <div className="entry-meta">
                <span className="view-count">{currentEntry.viewCount} views</span>
                <span className="last-updated">
                  Updated {formatDate(currentEntry.updatedAt)}
                </span>
              </div>

              {currentEntry.tags && currentEntry.tags.length > 0 && (
                <div className="entry-tags">
                  {currentEntry.tags.map((tag) => (
                    <button
                      key={tag}
                      className="tag"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="entry-content">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(currentEntry.content) 
                }} 
              />
            </div>
          </div>
        )}

        {view === 'search' && !loading && (
          <div className="search-results">
            <h2>Search Results for &ldquo;{searchQuery}&rdquo;</h2>
            
            {searchResults.length === 0 ? (
              <div className="no-results">
                <p>No entries found matching your search.</p>
                <p>Try different keywords or browse by sections above.</p>
              </div>
            ) : (
              <div className="results-grid">
                {searchResults.map((entry) => (
                  <div
                    key={entry.id}
                    className="result-card"
                    onClick={() => fetchEntry(entry.section.slug, entry.slug)}
                  >
                    <div className="result-header">
                      <h3>{entry.title}</h3>
                      <span className="section-badge">{entry.section.name}</span>
                    </div>
                    
                    {entry.excerpt && (
                      <p className="result-excerpt">{entry.excerpt}</p>
                    )}
                    
                    <div className="result-meta">
                      <div className="result-tags">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <span className="view-count">{entry.viewCount} views</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'tag' && selectedTag && !loading && (
          <div className="tag-results">
            <h2>Entries tagged with &ldquo;{selectedTag}&rdquo;</h2>
            
            {tagEntries.length === 0 ? (
              <div className="no-results">
                <p>No entries found with this tag.</p>
              </div>
            ) : (
              <div className="results-grid">
                {tagEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="result-card"
                    onClick={() => fetchEntry(entry.section.slug, entry.slug)}
                  >
                    <div className="result-header">
                      <h3>{entry.title}</h3>
                      <span className="section-badge">{entry.section.name}</span>
                    </div>
                    
                    {entry.excerpt && (
                      <p className="result-excerpt">{entry.excerpt}</p>
                    )}
                    
                    <div className="result-meta">
                      <div className="result-tags">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <span className="view-count">{entry.viewCount} views</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 