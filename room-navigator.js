/**
 * Archive of Rooms - Room Navigator
 * Client-side navigation, history, and room state management.
 * 
 * @version 2026-11-13
 */

class RoomNavigator {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    this.listeners = [];
  }

  navigate(roomId, state = {}) {
    const entry = { roomId, state, timestamp: Date.now() };
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(entry);
    this.currentIndex = this.history.length - 1;
    this.notify();
    return entry;
  }

  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.notify();
      return this.history[this.currentIndex];
    }
    return null;
  }

  forward() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.notify();
      return this.history[this.currentIndex];
    }
    return null;
  }

  getCurrent() {
    return this.history[this.currentIndex] || null;
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    const current = this.getCurrent();
    this.listeners.forEach(cb => cb(current));
  }

  getHistory() {
    return [...this.history];
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.notify();
  }
}

if (typeof window !== 'undefined') {
  window.RoomNavigator = RoomNavigator;
}

module.exports = RoomNavigator;
