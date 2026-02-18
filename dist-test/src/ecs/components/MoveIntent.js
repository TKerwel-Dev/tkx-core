"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveIntent = void 0;
class MoveIntent {
    dx;
    dy;
    sourceEntityId;
    tickCreated;
    constructor(dx, dy, sourceEntityId, tickCreated) {
        this.dx = dx;
        this.dy = dy;
        this.sourceEntityId = sourceEntityId;
        this.tickCreated = tickCreated;
    }
}
exports.MoveIntent = MoveIntent;
