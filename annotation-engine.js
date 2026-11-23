/**
 * AnnotationEngine for Archive of Rooms
 * Manages annotations, notes, highlights, and linked commentary on archived rooms and documents.
 * Supports threaded discussions, timestamps, and cross-references.
 * Added 2026-11-22 as daily code addition.
 */

class AnnotationEngine {
  constructor() {
    this.annotations = new Map();
    this.threads = new Map();
    this.highlights = new Map();
    this.crossReferences = new Map();
    this.users = new Map();
    this.debug = false;
  }

  init() {
    console.log('AnnotationEngine initialized');
  }

  addAnnotation(roomId, content, author = 'anonymous', position = null) {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const annotation = {
      id,
      roomId,
      content,
      author,
      position,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replies: [],
      likes: 0,
      tags: [],
      resolved: false
    };
    this.annotations.set(id, annotation);
    if (!this.threads.has(roomId)) this.threads.set(roomId, []);
    this.threads.get(roomId).push(id);
    return annotation;
  }

  addReply(annotationId, content, author = 'anonymous') {
    const parent = this.annotations.get(annotationId);
    if (!parent) return null;
    const reply = {
      id: `reply-${Date.now()}`,
      content,
      author,
      createdAt: Date.now(),
      likes: 0
    };
    parent.replies.push(reply);
    parent.updatedAt = Date.now();
    return reply;
  }

  addHighlight(roomId, text, startOffset, endOffset, color = '#ffff00') {
    const id = `hl-${Date.now()}`;
    const highlight = {
      id,
      roomId,
      text,
      startOffset,
      endOffset,
      color,
      createdAt: Date.now()
    };
    this.highlights.set(id, highlight);
    return highlight;
  }

  addCrossReference(fromRoom, toRoom, note = '') {
    const key = `${fromRoom}->${toRoom}`;
    const ref = {
      from: fromRoom,
      to: toRoom,
      note,
      createdAt: Date.now()
    };
    this.crossReferences.set(key, ref);
    return ref;
  }

  getAnnotationsForRoom(roomId) {
    const ids = this.threads.get(roomId) || [];
    return ids.map(id => this.annotations.get(id)).filter(Boolean);
  }

  getHighlightsForRoom(roomId) {
    return Array.from(this.highlights.values()).filter(h => h.roomId === roomId);
  }

  searchAnnotations(query) {
    const q = query.toLowerCase();
    return Array.from(this.annotations.values()).filter(a =>
      a.content.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  tagAnnotation(id, tag) {
    const ann = this.annotations.get(id);
    if (ann && !ann.tags.includes(tag)) {
      ann.tags.push(tag);
      ann.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  resolveAnnotation(id) {
    const ann = this.annotations.get(id);
    if (ann) {
      ann.resolved = true;
      ann.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  likeAnnotation(id) {
    const ann = this.annotations.get(id);
    if (ann) {
      ann.likes++;
      return ann.likes;
    }
    return 0;
  }

  getRecentAnnotations(limit = 20) {
    return Array.from(this.annotations.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  getCrossReferences(roomId) {
    return Array.from(this.crossReferences.values()).filter(r => r.from === roomId || r.to === roomId);
  }

  exportAnnotations(roomId) {
    return {
      annotations: this.getAnnotationsForRoom(roomId),
      highlights: this.getHighlightsForRoom(roomId),
      crossReferences: this.getCrossReferences(roomId)
    };
  }

  importAnnotations(data) {
    if (data.annotations) {
      for (const ann of data.annotations) {
        this.annotations.set(ann.id, ann);
        if (!this.threads.has(ann.roomId)) this.threads.set(ann.roomId, []);
        if (!this.threads.get(ann.roomId).includes(ann.id)) {
          this.threads.get(ann.roomId).push(ann.id);
        }
      }
    }
    if (data.highlights) {
      for (const hl of data.highlights) {
        this.highlights.set(hl.id, hl);
      }
    }
  }

  getStats() {
    return {
      totalAnnotations: this.annotations.size,
      totalHighlights: this.highlights.size,
      totalCrossReferences: this.crossReferences.size,
      roomsWithAnnotations: this.threads.size,
      resolvedCount: Array.from(this.annotations.values()).filter(a => a.resolved).length
    };
  }

  clearRoom(roomId) {
    const ids = this.threads.get(roomId) || [];
    for (const id of ids) this.annotations.delete(id);
    this.threads.delete(roomId);
    for (const [hlId, hl] of this.highlights) {
      if (hl.roomId === roomId) this.highlights.delete(hlId);
    }
  }

  version = '1.0.0';
  description = 'Annotation and commentary system for Archive of Rooms';
}

export default AnnotationEngine;
