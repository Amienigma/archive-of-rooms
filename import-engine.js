/**
 * ImportEngine for Archive of Rooms
 * Bulk import, CSV/JSON parsing, validation, deduplication,
 * and progressive ingestion for room archives.
 */

class ImportEngine {
  constructor() {
    this.queue = [];
    this.processed = 0;
    this.errors = [];
    this.stats = { total: 0, success: 0, failed: 0, duplicates: 0 };
  }

  async importFromJSON(jsonData, options = {}) {
    const records = Array.isArray(jsonData) ? jsonData : [jsonData];
    this.stats.total += records.length;
    const results = [];
    for (const record of records) {
      try {
        const validated = this.validate(record);
        if (options.dedupe && this.isDuplicate(validated)) {
          this.stats.duplicates++;
          continue;
        }
        results.push(validated);
        this.stats.success++;
      } catch (e) {
        this.errors.push({ record, error: e.message });
        this.stats.failed++;
      }
    }
    this.processed += results.length;
    return results;
  }

  validate(record) {
    if (!record || typeof record !== 'object') throw new Error('Invalid record');
    if (!record.id && !record.name) throw new Error('Missing identifier');
    return {
      id: record.id || this.generateId(),
      name: record.name || 'Untitled',
      description: record.description || '',
      tags: Array.isArray(record.tags) ? record.tags : [],
      metadata: record.metadata || {},
      importedAt: new Date().toISOString()
    };
  }

  generateId() {
    return `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  isDuplicate(record) {
    // Simplified; in real use check against existing store
    return false;
  }

  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
  }

  async importFromCSV(csvText, options = {}) {
    const records = this.parseCSV(csvText);
    return this.importFromJSON(records, options);
  }

  batchProcess(records, batchSize = 50, processor) {
    const batches = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches.map(batch => processor(batch));
  }

  getStats() {
    return { ...this.stats, errors: this.errors.length, processed: this.processed };
  }

  clearErrors() {
    this.errors = [];
  }

  // Advanced
  transformRecords(records, transformer) {
    return records.map(transformer).filter(Boolean);
  }

  mergeImports(existing, incoming, strategy = 'prefer-incoming') {
    const map = new Map(existing.map(e => [e.id, e]));
    for (const inc of incoming) {
      if (map.has(inc.id)) {
        if (strategy === 'prefer-incoming') map.set(inc.id, { ...map.get(inc.id), ...inc });
        else if (strategy === 'merge') map.set(inc.id, { ...map.get(inc.id), ...inc, tags: [...new Set([...(map.get(inc.id).tags || []), ...(inc.tags || [])])] });
      } else {
        map.set(inc.id, inc);
      }
    }
    return Array.from(map.values());
  }

  previewImport(data, limit = 5) {
    const records = Array.isArray(data) ? data : this.parseCSV(typeof data === 'string' ? data : '');
    return records.slice(0, limit).map(r => this.validate(r));
  }

  // Utils
  reset() {
    this.queue = [];
    this.processed = 0;
    this.errors = [];
    this.stats = { total: 0, success: 0, failed: 0, duplicates: 0 };
  }

  listErrors() {
    return this.errors;
  }

  // End of ImportEngine
}

export function createImportEngine() {
  return new ImportEngine();
}

export default ImportEngine;
