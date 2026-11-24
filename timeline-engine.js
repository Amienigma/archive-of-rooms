/**
 * TimelineEngine for Archive of Rooms
 * Chronological organization, event sequencing, and temporal queries
 * for room history and archival navigation.
 */

class TimelineEngine {
  constructor() {
    this.events = [];
    this.indexes = { byYear: new Map(), byRoom: new Map() };
  }

  addEvent(event) {
    const e = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: event.timestamp || Date.now(),
      roomId: event.roomId,
      type: event.type || 'note',
      title: event.title || '',
      description: event.description || '',
      metadata: event.metadata || {}
    };
    this.events.push(e);
    this.indexEvent(e);
    return e.id;
  }

  indexEvent(event) {
    const year = new Date(event.timestamp).getFullYear();
    if (!this.indexes.byYear.has(year)) this.indexes.byYear.set(year, []);
    this.indexes.byYear.get(year).push(event);

    if (!this.indexes.byRoom.has(event.roomId)) this.indexes.byRoom.set(event.roomId, []);
    this.indexes.byRoom.get(event.roomId).push(event);
  }

  getTimeline(start, end, roomId = null) {
    return this.events
      .filter(e => {
        if (e.timestamp < start || e.timestamp > end) return false;
        if (roomId && e.roomId !== roomId) return false;
        return true;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  getByYear(year) {
    return (this.indexes.byYear.get(year) || []).sort((a, b) => a.timestamp - b.timestamp);
  }

  getByRoom(roomId, limit = 50) {
    return (this.indexes.byRoom.get(roomId) || [])
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getRange(daysBack = 30) {
    const end = Date.now();
    const start = end - daysBack * 24 * 60 * 60 * 1000;
    return this.getTimeline(start, end);
  }

  findGaps(minGapDays = 7) {
    const sorted = [...this.events].sort((a, b) => a.timestamp - b.timestamp);
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      const gap = (sorted[i].timestamp - sorted[i - 1].timestamp) / (24 * 60 * 60 * 1000);
      if (gap > minGapDays) {
        gaps.push({
          after: sorted[i - 1],
          before: sorted[i],
          days: gap
        });
      }
    }
    return gaps;
  }

  getDensity(year) {
    const events = this.getByYear(year);
    const months = Array(12).fill(0);
    for (const e of events) {
      const m = new Date(e.timestamp).getMonth();
      months[m]++;
    }
    return months;
  }

  searchEvents(query) {
    const q = query.toLowerCase();
    return this.events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  }

  exportRange(start, end) {
    return {
      period: { start, end },
      events: this.getTimeline(start, end),
      count: this.getTimeline(start, end).length
    };
  }

  // More timeline features
  getMilestones(threshold = 10) {
    const byType = {};
    for (const e of this.events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    return Object.entries(byType)
      .filter(([, count]) => count >= threshold)
      .map(([type, count]) => ({ type, count }));
  }

  getStats() {
    if (this.events.length === 0) return { total: 0 };
    const timestamps = this.events.map(e => e.timestamp);
    return {
      total: this.events.length,
      earliest: Math.min(...timestamps),
      latest: Math.max(...timestamps),
      roomsCovered: this.indexes.byRoom.size,
      yearsCovered: this.indexes.byYear.size
    };
  }

  clear() {
    this.events = [];
    this.indexes.byYear.clear();
    this.indexes.byRoom.clear();
  }
}

module.exports = TimelineEngine;
