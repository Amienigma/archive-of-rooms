// ExportEngine - Multi-format export for Archive of Rooms
// Supports JSON, CSV, PDF-like text, and archive bundles
// Daily addition 2026-11-17

class ExportEngine {
  constructor() {
    this.formats = ['json', 'csv', 'txt', 'md'];
  }

  exportRooms(rooms, format = 'json', options = {}) {
    switch (format.toLowerCase()) {
      case 'json': return this.toJSON(rooms, options);
      case 'csv': return this.toCSV(rooms, options);
      case 'txt': return this.toText(rooms, options);
      case 'md': return this.toMarkdown(rooms, options);
      default: throw new Error(`Unsupported format: ${format}`);
    }
  }

  toJSON(rooms, options) {
    const data = options.pretty ? JSON.stringify(rooms, null, 2) : JSON.stringify(rooms);
    return { content: data, mime: 'application/json', extension: 'json' };
  }

  toCSV(rooms, options) {
    if (rooms.length === 0) return { content: '', mime: 'text/csv', extension: 'csv' };
    const fields = options.fields || Object.keys(rooms[0]);
    const header = fields.join(',');
    const rows = rooms.map(room => fields.map(f => this.escapeCSV(room[f])).join(',')).join('\n');
    return { content: header + '\n' + rows, mime: 'text/csv', extension: 'csv' };
  }

  toText(rooms, options) {
    const lines = rooms.map(room => {
      return `Room: ${room.name || 'Unnamed'}\nDescription: ${room.description || ''}\nCategory: ${room.category || ''}\n---`;
    });
    return { content: lines.join('\n\n'), mime: 'text/plain', extension: 'txt' };
  }

  toMarkdown(rooms, options) {
    const md = rooms.map(room => {
      return `## ${room.name || 'Unnamed Room'}\n\n**Category:** ${room.category || 'N/A'}\n\n${room.description || ''}\n\n---\n`;
    }).join('\n');
    return { content: md, mime: 'text/markdown', extension: 'md' };
  }

  escapeCSV(value) {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Bundle multiple exports
  createArchive(rooms, formats = ['json', 'csv']) {
    const files = {};
    formats.forEach(fmt => {
      const result = this.exportRooms(rooms, fmt);
      files[`rooms.${result.extension}`] = result.content;
    });
    return files;
  }

  // Filter before export
  exportFiltered(rooms, filterFn, format) {
    const filtered = rooms.filter(filterFn);
    return this.exportRooms(filtered, format);
  }

  getSupportedFormats() {
    return this.formats;
  }
}

export default ExportEngine;

console.log('ExportEngine for Archive of Rooms - 2026-11-17');
