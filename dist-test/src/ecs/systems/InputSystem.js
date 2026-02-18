"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputSystem = InputSystem;
const MoveIntent_js_1 = require("../components/MoveIntent.js");
function InputSystem(world, tick) {
    const players = world.query("PlayerTag");
    if (players.length === 0)
        return;
    const player = players[0];
    // Simulating 3 moves
    // Tick 0 -> dx=+1, dy=0
    // Tick 1 -> dx=0, dy=+1
    // Simulating 4 moves
    // Tick 0 -> dx=-1, dy=0
    // Tick 1 -> dx=-1, dy=0
    // Tick 2 -> dx=0, dy=-1
    // Tick 3 -> dx=0, dy=-1
    let dx = 0;
    let dy = 0;
    if (tick === 0) {
        dx = -1;
        dy = 0;
    }
    else if (tick === 1) {
        dx = -1;
        dy = 0;
    }
    else if (tick === 2) {
        dx = 0;
        dy = -1;
    }
    else if (tick === 3) {
        dx = 0;
        dy = -1;
    }
    else {
        return;
    }
    world.addComponent(player, "MoveIntent", new MoveIntent_js_1.MoveIntent(dx, dy, player, tick));
}
