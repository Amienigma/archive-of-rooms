/**
 * CollaborationEngine for Archive of Rooms
 * Enables shared rooms, real-time presence, comment threads, and
 * versioned snapshots of archived spaces.
 * 
 * @version 1.0.0
 * @date 2026-11-18
 */

class CollaborationEngine {
  constructor() {
    this.rooms = new Map();
    this.presence = new Map();
    this.comments = new Map();
    this.snapshots = new Map();
  }

  createRoom(roomId, owner, meta = {}) {
    this.rooms.set(roomId, {
      id: roomId,
      owner,
      created: Date.now(),
      members: [owner],
      meta,
    });
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");
    if (!room.members.includes(userId)) room.members.push(userId);
    this.setPresence(roomId, userId, "active");
    return room;
  }

  setPresence(roomId, userId, status) {
    if (!this.presence.has(roomId)) this.presence.set(roomId, new Map());
    this.presence.get(roomId).set(userId, { status, lastSeen: Date.now() });
  }

  addComment(roomId, userId, text, parentId = null) {
    if (!this.comments.has(roomId)) this.comments.set(roomId, []);
    const comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      text,
      parentId,
      ts: Date.now(),
    };
    this.comments.get(roomId).push(comment);
    return comment;
  }

  getComments(roomId) {
    return this.comments.get(roomId) || [];
  }

  createSnapshot(roomId, label) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const snap = {
      id: `snap_${Date.now()}`,
      label,
      ts: Date.now(),
      state: JSON.parse(JSON.stringify(room)),
    };
    if (!this.snapshots.has(roomId)) this.snapshots.set(roomId, []);
    this.snapshots.get(roomId).push(snap);
    return snap;
  }

  listPresence(roomId) {
    const map = this.presence.get(roomId);
    if (!map) return [];
    return Array.from(map.entries()).map(([userId, data]) => ({ userId, ...data }));
  }
}

if (typeof module !== "undefined") module.exports = CollaborationEngine;
