"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpawnGridSystem = SpawnGridSystem;
const Position_js_1 = require("../components/Position.js");
const Visual_js_1 = require("../components/Visual.js");
const TileTag_js_1 = require("../components/TileTag.js");
const PlayerTag_js_1 = require("../components/PlayerTag.js");
const MonsterTag_js_1 = require("../components/MonsterTag.js");
const Health_js_1 = require("../components/Health.js");
function SpawnGridSystem(world, tick) {
    // 10x10 Grid of Tiles
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const tile = world.createEntity();
            world.addComponent(tile, "Position", new Position_js_1.Position(x, y));
            world.addComponent(tile, "Visual", new Visual_js_1.Visual(".", 0));
            world.addComponent(tile, "TileTag", new TileTag_js_1.TileTag());
        }
    }
    // Monster at 3,3
    const monster = world.createEntity();
    world.addComponent(monster, "Position", new Position_js_1.Position(3, 3));
    world.addComponent(monster, "Visual", new Visual_js_1.Visual("M", 1));
    world.addComponent(monster, "MonsterTag", new MonsterTag_js_1.MonsterTag());
    world.addComponent(monster, "Health", new Health_js_1.Health(3, 3));
    // Player at 5,5
    const player = world.createEntity();
    world.addComponent(player, "Position", new Position_js_1.Position(5, 5));
    world.addComponent(player, "Visual", new Visual_js_1.Visual("P", 2));
    world.addComponent(player, "PlayerTag", new PlayerTag_js_1.PlayerTag());
    world.addComponent(player, "Health", new Health_js_1.Health(3, 3));
}
