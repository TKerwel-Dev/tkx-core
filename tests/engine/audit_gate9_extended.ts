
import { GameEngine } from "../../src/engine/GameEngine.js";
import { SpawnGridSystem } from "../../src/ecs/systems/SpawnGridSystem.js";
import { InputSystem } from "../../src/ecs/systems/InputSystem.js";
import { MovementSystem } from "../../src/ecs/systems/MovementSystem.js";
import { CollisionSystem } from "../../src/ecs/systems/CollisionSystem.js";
import { CombatSystem } from "../../src/ecs/systems/CombatSystem.js";
import { LootSystem } from "../../src/ecs/systems/LootSystem.js";
import { InventorySystem } from "../../src/ecs/systems/InventorySystem.js";
import { EquipmentSystem } from "../../src/ecs/systems/EquipmentSystem.js";
import { StatAggregationSystem } from "../../src/ecs/systems/StatAggregationSystem.js";
import { VisualSystem } from "../../src/ecs/systems/VisualSystem.js";
import { UISystem } from "../../src/ecs/systems/UISystem.js";
import { PersistenceService } from "../../src/persistence/PersistenceService.js";
import { BaseStats } from "../../src/ecs/components/BaseStats.js";
import { DerivedStats } from "../../src/ecs/components/DerivedStats.js";
import { EquipItemEvent, UnequipItemEvent, ItemAddedEvent } from "../../src/engine/EventBus.js";

async function verifyExtended() {
    const violations: string[] = [];
    const engine = new GameEngine();

    // Register all systems strictly in order
    // Ensure all systems are registered to mimic full game loop
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem);
    engine.registry.register("MovementSystem", MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem);
    engine.registry.register("LootSystem", LootSystem);
    engine.registry.register("InventorySystem", InventorySystem);
    engine.registry.register("EquipmentSystem", EquipmentSystem);
    engine.registry.register("StatAggregationSystem", StatAggregationSystem);
    engine.registry.register("VisualSystem", VisualSystem);
    engine.registry.register("UISystem", UISystem);

    engine.start();

    // Setup Actors
    // Player is 1, Monster is 2 usually (from SpawnGridSystem)
    const player = engine.world.query("PlayerTag")[0];
    const monster = engine.world.query("MonsterTag")[0];

    // Force Positions to known state
    // Player at (1,1), Monster at (8,8)
    const setPos = (ent: number, x: number, y: number) => {
        const p = engine.world.getComponent<any>(ent, "Position");
        if (p) { p.x = x; p.y = y; }
    };
    setPos(player, 1, 1);
    setPos(monster, 8, 8);

    // Initial Stat Aggregation (Tick 0)
    engine.world.addComponent(player, "BaseStats", new BaseStats(1, 0));

    // Ensure Monster Health is 3
    engine.world.addComponent(monster, "Health", { current: 3, max: 3 });

    // Helper for manual step to ensure determinism and override positions if needed
    const manualStep = (overridePlayerPos?: { x: number, y: number }) => {
        const tick = engine.tick;
        const w = engine.world;

        // Run systems in order
        InputSystem(w, tick);
        MovementSystem(w, tick);

        // Explicit Position Override for Audit Control
        if (overridePlayerPos) {
            setPos(player, overridePlayerPos.x, overridePlayerPos.y);
        }

        CollisionSystem(w, tick);
        CombatSystem(w, tick);
        LootSystem(w, tick);
        InventorySystem(w, tick);
        EquipmentSystem(w, tick);
        StatAggregationSystem(w, tick);
        VisualSystem(w, tick);
        UISystem(w, tick);

        w.events.clear();
        engine.tick++;
    };

    console.log("=== PHASE 1: BASELINE DAMAGE ===");
    // 1. Tick 0: Stats init
    manualStep();
    const baselineStats = engine.world.getComponent<DerivedStats>(player, "DerivedStats");
    if (!baselineStats || baselineStats.damage !== 1) {
        violations.push(`Phase 1: Baseline Damage mismatch. Expected 1, got ${baselineStats?.damage}`);
    }

    // 2. Hit Sequence: Away -> Contact -> Hit
    manualStep({ x: 1, y: 1 }); // Away (Clear Lock)
    manualStep({ x: 8, y: 8 }); // Contact (Hit)

    const hp1 = engine.world.getComponent<any>(monster, "Health").current;
    console.log(`Phase 1 Monster HP: ${hp1}`);
    if (hp1 !== 2) violations.push(`Phase 1: Monster HP Mismatch. Expected 2 (3-1), got ${hp1}`);


    console.log("=== PHASE 2: EQUIP RUSTY SWORD ===");
    // 3. Equip
    engine.world.events.publish({
        type: "ItemAddedEvent",
        tick: engine.tick,
        targetEntityId: player,
        itemId: "rusty_sword",
        quantity: 1
    } as ItemAddedEvent);

    engine.world.events.publish({
        type: "EquipItemEvent",
        tick: engine.tick,
        entityId: player,
        slot: "weapon",
        itemId: "rusty_sword"
    } as EquipItemEvent);

    manualStep({ x: 1, y: 1 }); // Away + Process Equip

    const equippedStats = engine.world.getComponent<DerivedStats>(player, "DerivedStats");
    if (!equippedStats || equippedStats.damage !== 2) {
        violations.push(`Phase 2: Equipped Damage mismatch. Expected 2, got ${equippedStats?.damage}`);
    }

    // 4. Hit Sequence
    manualStep({ x: 1, y: 1 }); // Away (Clear Lock)
    manualStep({ x: 8, y: 8 }); // Contact (Hit)

    const hp2 = engine.world.getComponent<any>(monster, "Health").current;
    console.log(`Phase 2 Monster HP: ${hp2}`);
    if (hp2 !== 0) violations.push(`Phase 2: Monster HP Mismatch. Expected 0 (2-2), got ${hp2}`);


    console.log("=== PHASE 3: SNAPSHOT + RESTORE ===");
    const snapshot = PersistenceService.serialize(engine.world, engine.tick);

    // WIPEOUT
    engine.world.clear();

    // RESTORE
    PersistenceService.deserialize(snapshot, engine.world);

    // Re-acquire references (IDs are preserved)
    const rPlayer = engine.world.query("PlayerTag")[0];
    const rMonster = engine.world.query("MonsterTag")[0];

    // Redefine setPos for restored world/IDs if needed (though world instance is same)
    const setPosRestored = (ent: number, x: number, y: number) => {
        const p = engine.world.getComponent<any>(ent, "Position");
        if (p) { p.x = x; p.y = y; }
    };

    // Override manualStep to use new IDs (though strictly they are same integers)
    const manualStepRestored = (overridePlayerPos?: { x: number, y: number }) => {
        const tick = engine.tick;
        const w = engine.world;
        InputSystem(w, tick);
        MovementSystem(w, tick);
        if (overridePlayerPos) setPosRestored(rPlayer, overridePlayerPos.x, overridePlayerPos.y);
        CollisionSystem(w, tick);
        CombatSystem(w, tick);
        LootSystem(w, tick);
        InventorySystem(w, tick);
        EquipmentSystem(w, tick);
        StatAggregationSystem(w, tick);
        VisualSystem(w, tick);
        UISystem(w, tick);
        w.events.clear();
        engine.tick++;
    };

    const restoredStats = engine.world.getComponent<DerivedStats>(rPlayer, "DerivedStats");
    if (!restoredStats || restoredStats.damage !== 2) {
        violations.push(`Phase 3: Restored Damage mismatch. Expected 2, got ${restoredStats?.damage}`);
    }

    // Hit Sequence (Hit Dead Monster? Tests collision/event logic mostly, or damage value)
    // NOTE: Monster is at 0 HP. Hitting it again might reduce to -2.
    // Spec says: "Monster HP reduziert sich um 2 (wenn Monster noch lebt) ODER bleibt 0" -- Wait, if dead it might be ignored?
    // Actually, simple CombatSystem usually allows overkill.
    // Let's reset HP to 10 for safe testing of damage value? 
    // Spec: "Erzwinge einen gültigen Hit... DamageEvent amount == 2"
    // I will check damage event via violation check on HP delta or just DamageEvent?
    // Let's reset monster to 3 HP to verify damage is exactly 2.
    engine.world.addComponent(rMonster, "Health", { current: 3, max: 3 });

    manualStepRestored({ x: 1, y: 1 }); // Away
    manualStepRestored({ x: 8, y: 8 }); // Contact

    const hp3 = engine.world.getComponent<any>(rMonster, "Health").current;
    console.log(`Phase 3 Monster HP: ${hp3}`);
    if (hp3 !== 1) violations.push(`Phase 3: Monster HP Mismatch. Expected 1 (3-2), got ${hp3}`);


    console.log("=== PHASE 4: UNEQUIP ===");
    engine.world.events.publish({
        type: "UnequipItemEvent",
        tick: engine.tick,
        entityId: rPlayer,
        slot: "weapon"
    } as UnequipItemEvent);

    manualStepRestored({ x: 1, y: 1 }); // Away + Process Unequip

    const unequippedStats = engine.world.getComponent<DerivedStats>(rPlayer, "DerivedStats");
    if (!unequippedStats || unequippedStats.damage !== 1) {
        violations.push(`Phase 4: Unequipped Damage mismatch. Expected 1, got ${unequippedStats?.damage}`);
    }

    // Reset Monster HP to 3 for final check
    engine.world.addComponent(rMonster, "Health", { current: 3, max: 3 });

    manualStepRestored({ x: 1, y: 1 }); // Away
    manualStepRestored({ x: 8, y: 8 }); // Contact

    const hp4 = engine.world.getComponent<any>(rMonster, "Health").current;
    console.log(`Phase 4 Monster HP: ${hp4}`);
    if (hp4 !== 2) violations.push(`Phase 4: Monster HP Mismatch. Expected 2 (3-1), got ${hp4}`);


    // REPORT
    const pass = violations.length === 0;
    console.log(`=== GATE 9 EXTENDED AUDIT REPORT ===
Status: ${pass ? "PASS" : "FAIL"}
Violations: ${JSON.stringify(violations, null, 2)}
====================================`);

    process.exit(pass ? 0 : 1);
}

verifyExtended().catch(e => {
    console.error(e);
    process.exit(1);
});
