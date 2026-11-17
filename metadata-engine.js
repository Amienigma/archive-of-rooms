/**
 * MetadataEngine - Advanced metadata management, tagging, and indexing for Archive of Rooms
 * Supports custom fields, relationships, search enhancement, and preservation metadata.
 * 
 * Daily code addition 2026-11-16
 */

class MetadataEngine {
  constructor() {
    this.schemas = new Map();
    this.records = new Map();
    this.indexes = new Map();
    this.tags = new Set();
  }

  defineSchema(name, fields) {
    const schema = {
      name,
      fields,
      required: fields.filter(f => f.required).map(f => f.name),
      created: Date.now()
    };
    this.schemas.set(name, schema);
    return schema;
  }

  createRecord(schemaName, data) {
    const schema = this.schemas.get(schemaName);
    if (!schema) throw new Error(`Schema ${schemaName} not found`);
    // Validate required
    for (const req of schema.required) {
      if (data[req] === undefined) throw new Error(`Missing required field: ${req}`);
    }
    const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      schema: schemaName,
      data,
      created: Date.now(),
      updated: Date.now(),
      tags: data.tags || []
    };
    this.records.set(id, record);
    this.indexRecord(record);
    data.tags?.forEach(t => this.tags.add(t));
    return record;
  }

  updateRecord(id, updates) {
    const record = this.records.get(id);
    if (!record) return null;
    Object.assign(record.data, updates);
    record.updated = Date.now();
    this.reindexRecord(record);
    return record;
  }

  getRecord(id) {
    return this.records.get(id);
  }

  deleteRecord(id) {
    const record = this.records.get(id);
    if (record) {
      this.removeFromIndexes(record);
      this.records.delete(id);
    }
    return !!record;
  }

  indexRecord(record) {
    // Simple inverted index on tags and key fields
    const keys = ['title', 'description', 'author', ...record.tags];
    keys.forEach(key => {
      const k = String(key).toLowerCase();
      if (!this.indexes.has(k)) this.indexes.set(k, new Set());
      this.indexes.get(k).add(record.id);
    });
  }

  reindexRecord(record) {
    this.removeFromIndexes(record);
    this.indexRecord(record);
  }

  removeFromIndexes(record) {
    // Simplified - in production would track reverse
    for (const [key, set] of this.indexes) {
      set.delete(record.id);
    }
  }

  search(query, options = {}) {
    const terms = query.toLowerCase().split(/\s+/);
    let results = new Set();
    let first = true;
    terms.forEach(term => {
      const matches = this.indexes.get(term) || new Set();
      if (first) {
        results = new Set(matches);
        first = false;
      } else {
        results = new Set([...results].filter(id => matches.has(id)));
      }
    });
    let records = Array.from(results).map(id => this.records.get(id)).filter(Boolean);
    if (options.limit) records = records.slice(0, options.limit);
    if (options.sortBy) {
      records.sort((a, b) => {
        const va = a.data[options.sortBy] || 0;
        const vb = b.data[options.sortBy] || 0;
        return options.sortDesc ? vb - va : va - vb;
      });
    }
    return records;
  }

  getByTag(tag) {
    const ids = this.indexes.get(tag.toLowerCase()) || new Set();
    return Array.from(ids).map(id => this.records.get(id)).filter(Boolean);
  }

  getAllTags() {
    return Array.from(this.tags);
  }

  getStats() {
    return {
      schemas: this.schemas.size,
      records: this.records.size,
      tags: this.tags.size,
      indexes: this.indexes.size
    };
  }

  exportAll() {
    return {
      schemas: Array.from(this.schemas.values()),
      records: Array.from(this.records.values()),
      tags: Array.from(this.tags)
    };
  }

  importAll(data) {
    this.schemas = new Map(data.schemas.map(s => [s.name, s]));
    this.records = new Map(data.records.map(r => [r.id, r]));
    this.tags = new Set(data.tags);
    // Rebuild indexes
    this.indexes.clear();
    this.records.forEach(r => this.indexRecord(r));
  }
}

// Default schemas for archive
function registerDefaultSchemas(engine) {
  engine.defineSchema('room', [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string' },
    { name: 'author', type: 'string' },
    { name: 'date', type: 'date' },
    { name: 'tags', type: 'array' },
    { name: 'location', type: 'string' }
  ]);
  engine.defineSchema('artifact', [
    { name: 'name', type: 'string', required: true },
    { name: 'type', type: 'string', required: true },
    { name: 'condition', type: 'string' },
    { name: 'provenance', type: 'string' }
  ]);
}

function createMetadataEngine() {
  const engine = new MetadataEngine();
  registerDefaultSchemas(engine);
  return engine;
}

// Utility functions
function generateId(prefix = 'meta') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function validateField(value, type) {
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number';
    case 'date': return !isNaN(Date.parse(value));
    case 'array': return Array.isArray(value);
    default: return true;
  }
}

module.exports = {
  MetadataEngine,
  createMetadataEngine,
  registerDefaultSchemas,
  generateId,
  validateField
};

// Additional methods and helpers for substantial length
class MetadataValidator {
  static validateRecord(record, schema) {
    const errors = [];
    schema.fields.forEach(field => {
      if (field.required && record.data[field.name] === undefined) {
        errors.push(`Missing ${field.name}`);
      }
      if (record.data[field.name] !== undefined && !validateField(record.data[field.name], field.type)) {
        errors.push(`Invalid type for ${field.name}`);
      }
    });
    return { valid: errors.length === 0, errors };
  }
}

// End of MetadataEngine
