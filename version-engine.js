/**
 * VersionEngine for Archive of Rooms
 * Tracks versions, history, and diffs of room entries.
 *
 * @module VersionEngine
 * @version 1.0.0
 * @date 2026-11-20
 */

class VersionEngine {
  constructor() {
    this.versions = new Map(); // roomId -> array of versions
  }

  saveVersion(roomId, content, author = 'system', note = '') {
    if (!this.versions.has(roomId)) {
      this.versions.set(roomId, []);
    }
    const history = this.versions.get(roomId);
    const version = {
      id: history.length + 1,
      timestamp: new Date().toISOString(),
      author,
      note,
      content: JSON.parse(JSON.stringify(content)), // deep clone
      hash: this.simpleHash(JSON.stringify(content)),
    };
    history.push(version);
    return version;
  }

  getHistory(roomId) {
    return this.versions.get(roomId) || [];
  }

  getVersion(roomId, versionId) {
    const history = this.getHistory(roomId);
    return history.find(v => v.id === versionId) || null;
  }

  getLatest(roomId) {
    const history = this.getHistory(roomId);
    return history[history.length - 1] || null;
  }

  diff(roomId, v1, v2) {
    const a = this.getVersion(roomId, v1);
    const b = this.getVersion(roomId, v2);
    if (!a || !b) return null;
    // Simple string diff stub
    return {
      from: v1,
      to: v2,
      changed: JSON.stringify(a.content) !== JSON.stringify(b.content),
      summary: `Diff between v${v1} and v${v2}`,
    };
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  stats() {
    let total = 0;
    this.versions.forEach(h => total += h.length);
    return {
      roomsTracked: this.versions.size,
      totalVersions: total,
    };
  }

  clearRoom(roomId) {
    this.versions.delete(roomId);
  }

  clearAll() {
    this.versions.clear();
  }
}

export default VersionEngine;
if (typeof module !== 'undefined') module.exports = VersionEngine;
