import { World } from "../../engine/World";
import { Position } from "../components/Position";
import { Visual } from "../components/Visual";
import { TileTag } from "../components/TileTag";
import { PlayerTag } from "../components/PlayerTag";
import { MonsterTag } from "../components/MonsterTag";
import { Health } from "../components/Health";

export function SpawnGridSystem(world: World, tick: number): void {
    // 10x10 Grid of Tiles
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const tile = world.createEntity();
            world.addComponent(tile, "Position", new Position(x, y));
            world.addComponent(tile, "Visual", new Visual(".", 0));
            world.addComponent(tile, "TileTag", new TileTag());
        }
    }

    // Monster at 3,3
    const monster = world.createEntity();
    world.addComponent(monster, "Position", new Position(3, 3));
    world.addComponent(monster, "Visual", new Visual("M", 1));
    world.addComponent(monster, "MonsterTag", new MonsterTag());
    world.addComponent(monster, "Health", new Health(3, 3));

    // Player at 5,5
    const player = world.createEntity();
    world.addComponent(player, "Position", new Position(5, 5));
    world.addComponent(player, "Visual", new Visual("P", 2));
    world.addComponent(player, "PlayerTag", new PlayerTag());
    world.addComponent(player, "Health", new Health(3, 3));
}
