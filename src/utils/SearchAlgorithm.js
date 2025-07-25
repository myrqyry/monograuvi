export class SearchAlgorithm {
  constructor(graphCanvas, fuzzySearchThreshold = 0.6) {
    this.graphCanvas = graphCanvas;
    this.fuzzySearchThreshold = fuzzySearchThreshold;
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

    results.sort((a, b) => b.score - a.score);

    return results;
  }

  calculateNodeScore(node, query, options) {
    let score = 0;
    const normalizedQuery = options.caseSensitive ? query : query.toLowerCase();

    if (!this.passesFilters(node, options)) return 0;

    if (options.regex) {
      try {
        const regex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
        score += this.scoreRegexMatches(node, regex);
      } catch (e) {
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
    const activeFilters = options.activeFilters || new Set();

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

    if (node.title) {
      fields.push(['title', node.title, 10]);
    }
    if (node.type) {
      fields.push(['type', node.type, 8]);
    }
    if (node.properties) {
      for (const [key, value] of Object.entries(node.properties)) {
        fields.push([`property.${key}`, String(value), 5]);
      }
    }
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
    fields.push(['id', String(node.id), 1]);

    return fields;
  }

  calculateFuzzyScore(pattern, text) {
    if (pattern === text) return 1;
    if (pattern.length === 0) return 0;
    if (text.length === 0) return 0;

    let score = 0;
    let patternIndex = 0;
    let previousMatchIndex = -1;

    for (let i = 0; i < text.length; i++) {
      if (patternIndex < pattern.length && text[i] === pattern[patternIndex]) {
        score += 1;

        if (previousMatchIndex === i - 1) {
          score += 0.5;
        }

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

    for (const [field, value] of searchableFields) {
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
        } catch (e) {}
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

  isNodeConnected(node) {
    if (!this.graphCanvas || !this.graphCanvas.graph) return false;

    const graph = this.graphCanvas.graph;

    for (const link of Object.values(graph.links || {})) {
      if (link && (link.origin_id === node.id || link.target_id === node.id)) {
        return true;
      }
    }

    return false;
  }
}
