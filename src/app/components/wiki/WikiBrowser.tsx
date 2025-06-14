import React, { useState, useEffect } from 'react';
import './WikiBrowser.css';

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

interface WikiNavigation {
  sections: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    entries: Array<{
      id: number;
      title: string;
      slug: string;
      excerpt?: string;
    }>;
  }>;
}

export const WikiBrowser: React.FC = () => {
  const [navigation, setNavigation] = useState<WikiNavigation | null>(null);
  const [currentEntry, setCurrentEntry] = useState<WikiEntryDetail | null>(null);
  const [searchResults, setSearchResults] = useState<WikiEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagEntries, setTagEntries] = useState<WikiEntry[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'navigation' | 'entry' | 'search' | 'tag'>('navigation');

  useEffect(() => {
    fetchNavigation();
    fetchTags();
  }, []);

  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/wiki/navigation');
      if (response.ok) {
        const data = await response.json();
        setNavigation(data);
      }
    } catch (error) {
      console.error('Error fetching navigation:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/wiki/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchEntry = async (sectionSlug: string, entrySlug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wiki/sections/${sectionSlug}/entries/${entrySlug}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentEntry(data);
        setView('entry');
      }
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
      const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setView('search');
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = async (tag: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wiki/tags/${encodeURIComponent(tag)}/entries`);
      if (response.ok) {
        const data = await response.json();
        setTagEntries(data);
        setSelectedTag(tag);
        setView('tag');
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - in a real app, you'd use a proper markdown library
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  };

  if (loading) {
    return (
      <div className="wiki-browser loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="wiki-browser">
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

      {view === 'navigation' && navigation && (
        <div className="wiki-navigation">
          <div className="sections-grid">
            {navigation.sections.map((section) => (
              <div key={section.id} className="section-card">
                <div className="section-header">
                  <h2>{section.name}</h2>
                  {section.description && (
                    <p className="section-description">{section.description}</p>
                  )}
                  <div className="entry-count">{section.entries.length} entries</div>
                </div>
                
                <div className="entries-list">
                  {section.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="entry-item"
                      onClick={() => fetchEntry(section.slug, entry.slug)}
                    >
                      <h4>{entry.title}</h4>
                      {entry.excerpt && (
                        <p className="entry-excerpt">{entry.excerpt}</p>
                      )}
                    </div>
                  ))}
                  
                  {section.entries.length === 0 && (
                    <div className="no-entries">No entries yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="tags-section">
            <h3>Browse by Tags</h3>
            <div className="tags-cloud">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  className="tag-button"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'entry' && currentEntry && (
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

            {currentEntry.tags.length > 0 && (
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

      {view === 'search' && (
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

      {view === 'tag' && selectedTag && (
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
  );
}; 