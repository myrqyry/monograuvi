// src/utils/SearchEnhancements.js
/* global LiteGraph */

export class SearchEnhancements {
  constructor() {
    this.searchIndex = new Map();
    this.searchHistory = [];
    this.searchFilters = new Set();
    this.fuzzySearchThreshold = 0.6;
    this.isSearchActive = false;
    this.highlightedNodes = new Set();
    this.searchResults = [];
  }

  setupSearchEvents(graphCanvas, callbacks) {
    this.graphCanvas = graphCanvas;
    this.callbacks = callbacks || {};
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Initialize search index
    this.rebuildSearchIndex();
    
    console.log('Search enhancements initialized');
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+F or Cmd+F for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.openSearchDialog();
      }
      
      // Escape to close search
      if (e.key === 'Escape' && this.isSearchActive) {
        this.closeSearch();
      }
      
      // Enter to go to next result
      if (e.key === 'Enter' && this.isSearchActive) {
        e.preventDefault();
        if (e.shiftKey) {
          this.previousResult();
        } else {
          this.nextResult();
        }
      }
    });
  }

  openSearchDialog() {
    if (this.searchDialog) {
      this.searchDialog.focus();
      return;
    }

    this.isSearchActive = true;
    this.createSearchDialog();
  }

  createSearchDialog() {
    // Create search overlay
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 100px;
    `;

    // Create search dialog
    const dialog = document.createElement('div');
    dialog.className = 'search-dialog';
    dialog.style.cssText = `
      background: var(--theme-node-background, #3a3a3a);
      border: 1px solid var(--theme-node-border, #555);
      border-radius: 8px;
      padding: 20px;
      min-width: 400px;
      max-width: 600px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      color: var(--theme-node-text, #fff);
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 15px 0;">Search Nodes</h3>
      
      <div class="search-input-container" style="margin-bottom: 15px;">
        <input type="text" id="search-input" placeholder="Search nodes, properties, connections..." 
               style="width: 100%; padding: 8px; border: 1px solid var(--theme-node-border, #555); 
                      background: var(--theme-canvas-background, #2a2a2a); color: var(--theme-node-text, #fff);
                      border-radius: 4px;">
      </div>
      
      <div class="search-filters" style="margin-bottom: 15px;">
        <label><input type="checkbox" id="filter-audio"> Audio Nodes</label>
        <label><input type="checkbox" id="filter-visual"> Visual Nodes</label>
        <label><input type="checkbox" id="filter-control"> Control Nodes</label>
        <label><input type="checkbox" id="filter-output"> Output Nodes</label>
        <label><input type="checkbox" id="filter-connected"> Connected Only</label>
      </div>
      
      <div class="search-options" style="margin-bottom: 15px;">
        <label><input type="checkbox" id="fuzzy-search" checked> Fuzzy Search</label>
        <label><input type="checkbox" id="case-sensitive"> Case Sensitive</label>
        <label><input type="checkbox" id="regex-search"> Regex</label>
      </div>
      
      <div class="search-results" id="search-results" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;">
        <div class="search-status">Start typing to search...</div>
      </div>
      
      <div class="search-actions" style="display: flex; justify-content: space-between;">
        <div>
          <button id="prev-result">Previous</button>
          <button id="next-result">Next</button>
          <span id="result-count">0 results</span>
        </div>
        <div>
          <button id="replace-btn">Replace</button>
          <button id="close-search">Close</button>
        </div>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    this.searchDialog = overlay;
    this.setupSearchDialogEvents(dialog);

    // Focus the search input
    const searchInput = dialog.querySelector('#search-input');
    searchInput.focus();
  }

  setupSearchDialogEvents(dialog) {
    const searchInput = dialog.querySelector('#search-input');
    const resultsContainer = dialog.querySelector('#search-results');
    const resultCount = dialog.querySelector('#result-count');
    
    // Real-time search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300);
    });

    // Filter changes
    dialog.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.performSearch(searchInput.value);
      });
    });

    // Navigation buttons
    dialog.querySelector('#prev-result').addEventListener('click', () => this.previousResult());
    dialog.querySelector('#next-result').addEventListener('click', () => this.nextResult());
    dialog.querySelector('#close-search').addEventListener('click', () => this.closeSearch());
    dialog.querySelector('#replace-btn').addEventListener('click', () => this.openReplaceDialog());

    // Click outside to close
    dialog.parentElement.addEventListener('click', (e) => {
      if (e.target === dialog.parentElement) {
        this.closeSearch();
      }
    });
  }

  performSearch(query) {
    if (!query.trim()) {
      this.clearSearchResults();
      return;
    }

    const options = this.getSearchOptions();
    const results = this.searchNodes(query, options);
    
    this.searchResults = results;
    this.displaySearchResults(results);
    this.highlightSearchResults(results);
    
    // Trigger search events
    this.dispatchSearchEvent('search:filtered', { query, results, options });
    
    // Add to search history
    this.addToSearchHistory(query);
  }

  searchNodes(query, options) {
    if (!this.graphCanvas || !this.graphCanvas.graph) return [];

    const nodes = this.graphCanvas.graph._nodes || [];
    const results = [];

    for (const node of nodes) {
      const score = this.calculateNodeScore(node, query, options);
      if (score > 0) {
        results.push({
          node,
          score,
          matches: this.findMatches(node, query, options)
        });
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }

  calculateNodeScore(node, query, options) {
    let score = 0;
    const normalizedQuery = options.caseSensitive ? query : query.toLowerCase();

    // Check if node passes filters
    if (!this.passesFilters(node, options)) return 0;

    if (options.regex) {
      try {
        const regex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
        score += this.scoreRegexMatches(node, regex);
      } catch (e) {
        // Invalid regex, fall back to normal search
        score += this.scoreTextMatches(node, normalizedQuery, options);
      }
    } else if (options.fuzzy) {
      score += this.scoreFuzzyMatches(node, normalizedQuery, options);
    } else {
      score += this.scoreTextMatches(node, normalizedQuery, options);
    }

    return score;
  }

  passesFilters(node, options) {
    const activeFilters = this.getActiveFilters();
    
    if (activeFilters.has('audio') && !node.type?.startsWith('audio/')) return false;
    if (activeFilters.has('visual') && !node.type?.startsWith('visual/')) return false;
    if (activeFilters.has('control') && !node.type?.startsWith('control/')) return false;
    if (activeFilters.has('output') && !node.type?.startsWith('output/')) return false;
    if (activeFilters.has('connected') && !this.isNodeConnected(node)) return false;
    
    return true;
  }

  scoreTextMatches(node, query, options) {
    let score = 0;
    const searchableFields = this.getSearchableFields(node);
    
    for (const [field, value, weight] of searchableFields) {
      const normalizedValue = options.caseSensitive ? value : value.toLowerCase();
      
      if (normalizedValue.includes(query)) {
        // Exact match gets higher score
        if (normalizedValue === query) {
          score += weight * 10;
        } else if (normalizedValue.startsWith(query)) {
          score += weight * 5;
        } else {
          score += weight * 2;
        }
      }
    }
    
    return score;
  }

  scoreFuzzyMatches(node, query, options) {
    let score = 0;
    const searchableFields = this.getSearchableFields(node);
    
    for (const [field, value, weight] of searchableFields) {
      const normalizedValue = options.caseSensitive ? value : value.toLowerCase();
      const similarity = this.calculateFuzzyScore(query, normalizedValue);
      
      if (similarity >= this.fuzzySearchThreshold) {
        score += weight * similarity * 3;
      }
    }
    
    return score;
  }

  scoreRegexMatches(node, regex) {
    let score = 0;
    const searchableFields = this.getSearchableFields(node);
    
    for (const [field, value, weight] of searchableFields) {
      const matches = value.match(regex);
      if (matches) {
        score += weight * matches.length * 2;
      }
    }
    
    return score;
  }

  getSearchableFields(node) {
    const fields = [];
    
    // Node title (highest weight)
    if (node.title) {
      fields.push(['title', node.title, 10]);
    }
    
    // Node type (high weight)
    if (node.type) {
      fields.push(['type', node.type, 8]);
    }
    
    // Node properties (medium weight)
    if (node.properties) {
      for (const [key, value] of Object.entries(node.properties)) {
        fields.push([`property.${key}`, String(value), 5]);
      }
    }
    
    // Input/output names (medium weight)
    if (node.inputs) {
      node.inputs.forEach((input, index) => {
        fields.push([`input.${index}`, input.name || input.type, 4]);
      });
    }
    
    if (node.outputs) {
      node.outputs.forEach((output, index) => {
        fields.push([`output.${index}`, output.name || output.type, 4]);
      });
    }
    
    // Node ID (low weight)
    fields.push(['id', String(node.id), 1]);
    
    return fields;
  }

  calculateFuzzyScore(pattern, text) {
    // Simple fuzzy matching algorithm
    if (pattern === text) return 1;
    if (pattern.length === 0) return 0;
    if (text.length === 0) return 0;
    
    let score = 0;
    let patternIndex = 0;
    let previousMatchIndex = -1;
    
    for (let i = 0; i < text.length; i++) {
      if (patternIndex < pattern.length && text[i] === pattern[patternIndex]) {
        score += 1;
        
        // Bonus for consecutive matches
        if (previousMatchIndex === i - 1) {
          score += 0.5;
        }
        
        // Bonus for matches at word boundaries
        if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '-' || text[i - 1] === '_') {
          score += 0.3;
        }
        
        previousMatchIndex = i;
        patternIndex++;
      }
    }
    
    return (score / pattern.length) * (patternIndex / pattern.length);
  }

  findMatches(node, query, options) {
    const matches = [];
    const searchableFields = this.getSearchableFields(node);
    const normalizedQuery = options.caseSensitive ? query : query.toLowerCase();
    
    for (const [field, value, weight] of searchableFields) {
      const normalizedValue = options.caseSensitive ? value : value.toLowerCase();
      
      if (options.regex) {
        try {
          const regex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
          const regexMatches = [...value.matchAll(regex)];
          regexMatches.forEach(match => {
            matches.push({
              field,
              value,
              match: match[0],
              index: match.index
            });
          });
        } catch (e) {
          // Invalid regex
        }
      } else if (normalizedValue.includes(normalizedQuery)) {
        const index = normalizedValue.indexOf(normalizedQuery);
        matches.push({
          field,
          value,
          match: value.substring(index, index + query.length),
          index
        });
      }
    }
    
    return matches;
  }

  displaySearchResults(results) {
    const container = document.querySelector('#search-results');
    const countElement = document.querySelector('#result-count');
    
    if (!container || !countElement) return;
    
    countElement.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
    
    if (results.length === 0) {
      container.innerHTML = '<div class="search-status">No results found</div>';
      return;
    }
    
    const resultHTML = results.map((result, index) => {
      const node = result.node;
      const matches = result.matches.slice(0, 3); // Show max 3 matches
      
      return `
        <div class="search-result" data-index="${index}" style="
          padding: 8px;
          border: 1px solid var(--theme-node-border, #555);
          margin-bottom: 4px;
          cursor: pointer;
          border-radius: 4px;
        ">
          <div style="font-weight: bold;">${node.title || node.type}</div>
          <div style="font-size: 12px; color: var(--theme-node-text-secondary, #ccc);">
            Score: ${result.score.toFixed(2)} | Type: ${node.type}
          </div>
          ${matches.map(match => `
            <div style="font-size: 11px; color: var(--theme-node-text-secondary, #ccc);">
              ${match.field}: "${this.highlightMatch(match.value, match.match)}"
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
    
    container.innerHTML = resultHTML;
    
    // Add click handlers for results
    container.querySelectorAll('.search-result').forEach(element => {
      element.addEventListener('click', () => {
        const index = parseInt(element.dataset.index);
        this.goToResult(index);
      });
    });
  }

  highlightMatch(text, match) {
    return text.replace(new RegExp(this.escapeRegex(match), 'gi'), 
      `<span style="background: var(--theme-selection-color, #00d9ff); color: black; padding: 1px;">$&</span>`);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  highlightSearchResults(results) {
    this.clearHighlights();
    
    results.forEach(result => {
      this.highlightNode(result.node);
      this.highlightedNodes.add(result.node.id);
    });
  }

  highlightNode(node) {
    if (!node || !this.graphCanvas) return;
    
    // Add visual highlight to node
    node.searchHighlight = true;
    
    // Trigger redraw
    this.graphCanvas.setDirty(true, true);
    
    this.dispatchSearchEvent('search:item:highlight', { node });
  }

  clearHighlights() {
    if (!this.graphCanvas || !this.graphCanvas.graph) return;
    
    this.highlightedNodes.forEach(nodeId => {
      const node = this.graphCanvas.graph.getNodeById(nodeId);
      if (node) {
        delete node.searchHighlight;
      }
    });
    
    this.highlightedNodes.clear();
    this.graphCanvas.setDirty(true, true);
  }

  goToResult(index) {
    if (index < 0 || index >= this.searchResults.length) return;
    
    const result = this.searchResults[index];
    this.focusOnNode(result.node);
    this.currentResultIndex = index;
    
    // Update UI to show current result
    this.updateResultSelection(index);
  }

  focusOnNode(node) {
    if (!node || !this.graphCanvas) return;
    
    // Center the view on the node
    const canvas = this.graphCanvas;
    canvas.ds.offset[0] = -node.pos[0] + canvas.canvas.width / 2;
    canvas.ds.offset[1] = -node.pos[1] + canvas.canvas.height / 2;
    
    // Select the node
    canvas.selectNode(node);
    
    // Trigger redraw
    canvas.setDirty(true, true);
  }

  nextResult() {
    if (this.searchResults.length === 0) return;
    
    this.currentResultIndex = (this.currentResultIndex + 1) % this.searchResults.length;
    this.goToResult(this.currentResultIndex);
  }

  previousResult() {
    if (this.searchResults.length === 0) return;
    
    this.currentResultIndex = this.currentResultIndex === 0 ? 
      this.searchResults.length - 1 : this.currentResultIndex - 1;
    this.goToResult(this.currentResultIndex);
  }

  updateResultSelection(index) {
    const results = document.querySelectorAll('.search-result');
    results.forEach((result, i) => {
      if (i === index) {
        result.style.background = 'var(--theme-node-background-selected, #4a4a4a)';
      } else {
        result.style.background = '';
      }
    });
  }

  closeSearch() {
    if (this.searchDialog) {
      document.body.removeChild(this.searchDialog);
      this.searchDialog = null;
    }
    
    this.clearHighlights();
    this.isSearchActive = false;
    this.searchResults = [];
    this.currentResultIndex = 0;
  }

  clearSearchResults() {
    this.searchResults = [];
    this.clearHighlights();
    
    const container = document.querySelector('#search-results');
    const countElement = document.querySelector('#result-count');
    
    if (container) container.innerHTML = '<div class="search-status">Start typing to search...</div>';
    if (countElement) countElement.textContent = '0 results';
  }

  getSearchOptions() {
    const dialog = this.searchDialog;
    if (!dialog) return {};
    
    return {
      caseSensitive: dialog.querySelector('#case-sensitive')?.checked || false,
      fuzzy: dialog.querySelector('#fuzzy-search')?.checked || true,
      regex: dialog.querySelector('#regex-search')?.checked || false
    };
  }

  getActiveFilters() {
    const filters = new Set();
    const dialog = this.searchDialog;
    if (!dialog) return filters;
    
    if (dialog.querySelector('#filter-audio')?.checked) filters.add('audio');
    if (dialog.querySelector('#filter-visual')?.checked) filters.add('visual');
    if (dialog.querySelector('#filter-control')?.checked) filters.add('control');
    if (dialog.querySelector('#filter-output')?.checked) filters.add('output');
    if (dialog.querySelector('#filter-connected')?.checked) filters.add('connected');
    
    return filters;
  }

  isNodeConnected(node) {
    if (!this.graphCanvas || !this.graphCanvas.graph) return false;
    
    const graph = this.graphCanvas.graph;
    
    // Check if node has any connections
    for (const link of Object.values(graph.links || {})) {
      if (link && (link.origin_id === node.id || link.target_id === node.id)) {
        return true;
      }
    }
    
    return false;
  }

  addToSearchHistory(query) {
    if (!query.trim()) return;
    
    // Remove existing entry
    const existingIndex = this.searchHistory.indexOf(query);
    if (existingIndex >= 0) {
      this.searchHistory.splice(existingIndex, 1);
    }
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Limit history size
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('monograuvi-search-history', JSON.stringify(this.searchHistory));
  }

  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('monograuvi-search-history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load search history:', e);
      this.searchHistory = [];
    }
  }

  rebuildSearchIndex() {
    this.searchIndex.clear();
    
    if (!this.graphCanvas || !this.graphCanvas.graph) return;
    
    const nodes = this.graphCanvas.graph._nodes || [];
    
    nodes.forEach(node => {
      const searchableFields = this.getSearchableFields(node);
      const indexEntry = {
        node,
        fields: searchableFields,
        lastUpdated: Date.now()
      };
      
      this.searchIndex.set(node.id, indexEntry);
    });
    
    console.log(`Rebuilt search index with ${this.searchIndex.size} nodes`);
  }

  dispatchSearchEvent(eventType, detail) {
    document.dispatchEvent(new CustomEvent(eventType, { detail }));
    
    // Call callback if provided
    if (this.callbacks[eventType.replace(':', '')]) {
      this.callbacks[eventType.replace(':', '')](detail);
    }
  }

  // Quick search API for programmatic use
  quickSearch(query, options = {}) {
    const defaultOptions = {
      caseSensitive: false,
      fuzzy: true,
      regex: false,
      limit: 10
    };
    
    const searchOptions = { ...defaultOptions, ...options };
    const results = this.searchNodes(query, searchOptions);
    
    return results.slice(0, searchOptions.limit);
  }

  // Search by node type
  searchByType(nodeType) {
    if (!this.graphCanvas || !this.graphCanvas.graph) return [];
    
    const nodes = this.graphCanvas.graph._nodes || [];
    return nodes.filter(node => node.type?.startsWith(nodeType));
  }

  // Search by connection status
  searchConnectedNodes() {
    if (!this.graphCanvas || !this.graphCanvas.graph) return [];
    
    const nodes = this.graphCanvas.graph._nodes || [];
    return nodes.filter(node => this.isNodeConnected(node));
  }

  // Search by property
  searchByProperty(propertyName, propertyValue = null) {
    if (!this.graphCanvas || !this.graphCanvas.graph) return [];
    
    const nodes = this.graphCanvas.graph._nodes || [];
    return nodes.filter(node => {
      if (!node.properties || !node.properties.hasOwnProperty(propertyName)) {
        return false;
      }
      
      if (propertyValue === null) {
        return true; // Just check if property exists
      }
      
      return node.properties[propertyName] === propertyValue;
    });
  }
}

export default SearchEnhancements;
