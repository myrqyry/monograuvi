export class SearchUI {
  constructor(eventHandlers) {
    this.eventHandlers = eventHandlers;
    this.searchDialog = null;
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

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.eventHandlers.onSearch(e.target.value);
      }, 300);
    });

    dialog.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.eventHandlers.onSearch(searchInput.value);
      });
    });

    dialog.querySelector('#prev-result').addEventListener('click', () => this.eventHandlers.onPreviousResult());
    dialog.querySelector('#next-result').addEventListener('click', () => this.eventHandlers.onNextResult());
    dialog.querySelector('#close-search').addEventListener('click', () => this.eventHandlers.onClose());
    dialog.querySelector('#replace-btn').addEventListener('click', () => this.eventHandlers.onReplace());

    dialog.parentElement.addEventListener('click', (e) => {
      if (e.target === dialog.parentElement) {
        this.eventHandlers.onClose();
      }
    });
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
      const matches = result.matches.slice(0, 3);

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

    container.querySelectorAll('.search-result').forEach(element => {
      element.addEventListener('click', () => {
        const index = parseInt(element.dataset.index);
        this.eventHandlers.onGoToResult(index);
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

  close() {
    if (this.searchDialog) {
      document.body.removeChild(this.searchDialog);
      this.searchDialog = null;
    }
  }
}
