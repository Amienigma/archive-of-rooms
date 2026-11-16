/**
 * RoomManager for Archive of Rooms
 * Handles room lifecycle, metadata, and archival operations
 */

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.tags = new Map();
    this.visitors = new Map();
  }

  createRoom(data) {
    const id = data.id || `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const room = {
      id,
      title: data.title || 'Untitled Room',
      description: data.description || '',
      tags: data.tags || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      content: data.content || '',
      status: data.status || 'active',
      visits: 0,
      metadata: data.metadata || {}
    };
    this.rooms.set(id, room);
    this.indexTags(room);
    return room;
  }

  updateRoom(id, updates) {
    const room = this.rooms.get(id);
    if (!room) return null;
    Object.assign(room, updates, { updated: new Date().toISOString() });
    this.indexTags(room);
    return room;
  }

  archiveRoom(id) {
    const room = this.rooms.get(id);
    if (room) {
      room.status = 'archived';
      room.archivedAt = new Date().toISOString();
    }
    return room;
  }

  getRoom(id) {
    const room = this.rooms.get(id);
    if (room) {
      room.visits++;
      this.recordVisit(id);
    }
    return room;
  }

  searchRooms(query, options = {}) {
    const { status = 'active', limit = 20, tags = [] } = options;
    let results = Array.from(this.rooms.values());
    if (status) results = results.filter(r => r.status === status);
    if (tags.length) {
      results = results.filter(r => tags.every(t => r.tags.includes(t)));
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
      );
    }
    return results
      .sort((a, b) => new Date(b.updated) - new Date(a.updated))
      .slice(0, limit);
  }

  getByTag(tag) {
    const ids = this.tags.get(tag) || new Set();
    return Array.from(ids).map(id => this.rooms.get(id)).filter(Boolean);
  }

  indexTags(room) {
    // Clear old
    this.tags.forEach((set, tag) => set.delete(room.id));
    room.tags.forEach(tag => {
      if (!this.tags.has(tag)) this.tags.set(tag, new Set());
      this.tags.get(tag).add(room.id);
    });
  }

  recordVisit(roomId) {
    if (!this.visitors.has(roomId)) this.visitors.set(roomId, []);
    this.visitors.get(roomId).push(Date.now());
  }

  getPopular(limit = 10) {
    return Array.from(this.rooms.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, limit);
  }

  getRecent(limit = 10) {
    return Array.from(this.rooms.values())
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, limit);
  }

  exportAll() {
    return Array.from(this.rooms.values());
  }

  importAll(rooms) {
    rooms.forEach(r => this.rooms.set(r.id, r));
    rooms.forEach(r => this.indexTags(r));
  }

  getStats() {
    const active = Array.from(this.rooms.values()).filter(r => r.status === 'active').length;
    const archived = this.rooms.size - active;
    return {
      total: this.rooms.size,
      active,
      archived,
      tags: this.tags.size,
      totalVisits: Array.from(this.rooms.values()).reduce((sum, r) => sum + r.visits, 0)
    };
  }

  deleteRoom(id) {
    const room = this.rooms.get(id);
    if (room) {
      room.tags.forEach(tag => this.tags.get(tag)?.delete(id));
      this.rooms.delete(id);
      this.visitors.delete(id);
    }
    return !!room;
  }
}

export default RoomManager;
