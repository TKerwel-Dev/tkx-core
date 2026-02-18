"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    events = [];
    publish(event) {
        this.events.push(event);
    }
    getEvents(type) {
        return this.events.filter(e => e.type === type);
    }
    clear() {
        this.events = [];
    }
    get length() {
        return this.events.length;
    }
}
exports.EventBus = EventBus;
