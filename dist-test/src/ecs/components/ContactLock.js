"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactLock = void 0;
class ContactLock {
    targetId;
    startTick;
    constructor(targetId, startTick) {
        this.targetId = targetId;
        this.startTick = startTick;
    }
}
exports.ContactLock = ContactLock;
