/**
 * TaggingEngine for Archive of Rooms
 * Automatic and manual tagging system for rooms, with hierarchy,
 * related tags, and search integration.
 * 
 * @module TaggingEngine
 * @version 1.0.0
 * @date 2026-11-19
 */

class TaggingEngine {
  constructor() {
    this.tags = new Map();
    this.roomTags = new Map();
    this.related = new Map();
  }

  addTag(name, meta = {}) {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (this.tags.has(id)) return this.tags.get(id);
    const tag = {
      id,
      name,
      description: meta.description || '',
      category: meta.category || 'general',
      color: meta.color || '#c21e6b',
      count: 0,
    };
    this.tags.set(id, tag);
    return tag;
  }

  tagRoom(roomId, tagNames) {
    if (!this.roomTags.has(roomId)) this.roomTags.set(roomId, new Set());
    const set = this.roomTags.get(roomId);
    tagNames.forEach(name => {
      const tag = this.addTag(name);
      set.add(tag.id);
      tag.count++;
    });
  }

  getTagsForRoom(roomId) {
    const ids = this.roomTags.get(roomId) || new Set();
    return Array.from(ids).map(id => this.tags.get(id)).filter(Boolean);
  }

  getRoomsByTag(tagId) {
    const rooms = [];
    for (const [roomId, tags] of this.roomTags) {
      if (tags.has(tagId)) rooms.push(roomId);
    }
    return rooms;
  }

  suggestTags(text) {
    const words = text.toLowerCase().split(/\W+/);
    const suggestions = [];
    for (const [id, tag] of this.tags) {
      if (words.some(w => tag.name.toLowerCase().includes(w) || id.includes(w))) {
        suggestions.push(tag);
      }
    }
    return suggestions.slice(0, 10);
  }

  addRelated(tagId1, tagId2) {
    if (!this.related.has(tagId1)) this.related.set(tagId1, new Set());
    this.related.get(tagId1).add(tagId2);
  }

  getRelated(tagId) {
    const ids = this.related.get(tagId) || new Set();
    return Array.from(ids).map(id => this.tags.get(id)).filter(Boolean);
  }

  getPopular(limit = 20) {
    return Array.from(this.tags.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  export() {
    return {
      tags: Array.from(this.tags.values()),
      roomTags: Object.fromEntries(
        Array.from(this.roomTags.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
    };
  }
}

module.exports = TaggingEngine;
