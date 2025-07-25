import { SearchUI } from './SearchUI.js';
import { SearchAlgorithm } from './SearchAlgorithm.js';

export class SearchManager {
  constructor() {
    this.searchIndex = new Map();
    this.searchHistory = [];
    this.highlightedNodes = new Set();
    this.searchResults = [];
    this.isSearchActive = false;
    this.currentResultIndex = 0;

    this.ui = new SearchUI({
      onSearch: (query) => this.performSearch(query),
      onPreviousResult: () => this.previousResult(),
      onNextResult: () => this.nextResult(),
      onClose: () => this.closeSearch(),
      onReplace: () => this.openReplaceDialog(),
      onGoToResult: (index) => this.goToResult(index),
    });

    this.algorithm = null;
  }

  setupSearchEvents(graphCanvas, callbacks) {
    this.graphCanvas = graphCanvas;
    this.callbacks = callbacks || {};
    this.algorithm = new SearchAlgorithm(graphCanvas);

    this.setupKeyboardShortcuts();
    this.rebuildSearchIndex();
    this.loadSearchHistory();

    console.log('Search enhancements initialized');
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.openSearchDialog();
      }
      if (e.key === 'Escape' && this.isSearchActive) {
        this.closeSearch();
      }
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
    if (this.isSearchActive) {
      this.ui.searchDialog.focus();
      return;
    }

    this.isSearchActive = true;
    this.ui.createSearchDialog();
  }

  performSearch(query) {
    if (!query.trim()) {
      this.clearSearchResults();
      return;
    }

    const options = this.ui.getSearchOptions();
    options.activeFilters = this.ui.getActiveFilters();
    const results = this.algorithm.searchNodes(query, options);

    this.searchResults = results;
    this.ui.displaySearchResults(results);
    this.highlightSearchResults(results);

    this.dispatchSearchEvent('search:filtered', { query, results, options });
    this.addToSearchHistory(query);
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

    node.searchHighlight = true;
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

    this.ui.updateResultSelection(index);
  }

  focusOnNode(node) {
    if (!node || !this.graphCanvas) return;

    const canvas = this.graphCanvas;
    canvas.ds.offset[0] = -node.pos[0] + canvas.canvas.width / 2;
    canvas.ds.offset[1] = -node.pos[1] + canvas.canvas.height / 2;

    canvas.selectNode(node);
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

  closeSearch() {
    this.ui.close();
    this.clearHighlights();
    this.isSearchActive = false;
    this.searchResults = [];
    this.currentResultIndex = 0;
  }

  clearSearchResults() {
    this.searchResults = [];
    this.clearHighlights();
    this.ui.displaySearchResults([]);
  }

  addToSearchHistory(query) {
    if (!query.trim()) return;

    const existingIndex = this.searchHistory.indexOf(query);
    if (existingIndex >= 0) {
      this.searchHistory.splice(existingIndex, 1);
    }

    this.searchHistory.unshift(query);

    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }

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
      const searchableFields = this.algorithm.getSearchableFields(node);
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

    if (this.callbacks[eventType.replace(':', '')]) {
      this.callbacks[eventType.replace(':', '')](detail);
    }
  }
}

export default SearchManager;
