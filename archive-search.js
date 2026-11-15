/**
 * ArchiveSearch for The Archive of Rooms
 * Full-text and category search across the room archive.
 * Daily code addition 2026-11-14.
 */

class ArchiveSearch {
  constructor(rooms) {
    this.rooms = rooms || [];
    this.inverted = new Map();
    this.indexRooms();
  }

  indexRooms() {
    for (const room of this.rooms) {
      const text = [room.title, room.description, room.category, ...(room.tags || [])].join(' ').toLowerCase();
      const words = text.split(/\W+/).filter(w => w.length > 2);
      for (const word of words) {
        if (!this.inverted.has(word)) this.inverted.set(word, new Set());
        this.inverted.get(word).add(room);
      }
    }
  }

  search(query, options = {}) {
    const { category, limit = 50 } = options;
    if (!query) return this.filterByCategory(category).slice(0, limit);

    const terms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    const scores = new Map();

    for (const term of terms) {
      const matches = this.inverted.get(term) || new Set();
      for (const room of matches) {
        scores.set(room, (scores.get(room) || 0) + 1);
      }
    }

    let results = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([room]) => room);

    if (category) results = results.filter(r => r.category === category);
    return results.slice(0, limit);
  }

  filterByCategory(cat) {
    if (!cat) return this.rooms;
    return this.rooms.filter(r => r.category === cat);
  }

  getCategories() {
    const cats = new Set(this.rooms.map(r => r.category).filter(Boolean));
    return Array.from(cats);
  }

  suggest(query) {
    // Simple suggestion based on prefix
    const suggestions = [];
    for (const word of this.inverted.keys()) {
      if (word.startsWith(query.toLowerCase())) suggestions.push(word);
      if (suggestions.length > 10) break;
    }
    return suggestions;
  }
}

export { ArchiveSearch };

console.log('ArchiveSearch engine ready');
