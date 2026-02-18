"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameEngine_js_1 = require("../../src/engine/GameEngine.js");
const SpawnGridSystem_js_1 = require("../../src/ecs/systems/SpawnGridSystem.js");
const InputSystem_js_1 = require("../../src/ecs/systems/InputSystem.js");
const MovementSystem_js_1 = require("../../src/ecs/systems/MovementSystem.js");
const CollisionSystem_js_1 = require("../../src/ecs/systems/CollisionSystem.js");
const CombatSystem_js_1 = require("../../src/ecs/systems/CombatSystem.js");
const LootSystem_js_1 = require("../../src/ecs/systems/LootSystem.js");
const InventorySystem_js_1 = require("../../src/ecs/systems/InventorySystem.js");
const EquipmentSystem_js_1 = require("../../src/ecs/systems/EquipmentSystem.js");
const StatAggregationSystem_js_1 = require("../../src/ecs/systems/StatAggregationSystem.js");
const VisualSystem_js_1 = require("../../src/ecs/systems/VisualSystem.js");
const UISystem_js_1 = require("../../src/ecs/systems/UISystem.js");
const PersistenceService_js_1 = require("../../src/persistence/PersistenceService.js");
const BaseStats_js_1 = require("../../src/ecs/components/BaseStats.js");
async function verifyExtended() {
    const violations = [];
    const engine = new GameEngine_js_1.GameEngine();
    // Register all systems strictly in order
    // Ensure all systems are registered to mimic full game loop
    engine.registry.registerOnce("SpawnGridSystem", SpawnGridSystem_js_1.SpawnGridSystem);
    engine.registry.register("InputSystem", InputSystem_js_1.InputSystem);
    engine.registry.register("MovementSystem", MovementSystem_js_1.MovementSystem);
    engine.registry.register("CollisionSystem", CollisionSystem_js_1.CollisionSystem);
    engine.registry.register("CombatSystem", CombatSystem_js_1.CombatSystem);
    engine.registry.register("LootSystem", LootSystem_js_1.LootSystem);
    engine.registry.register("InventorySystem", InventorySystem_js_1.InventorySystem);
    engine.registry.register("EquipmentSystem", EquipmentSystem_js_1.EquipmentSystem);
    engine.registry.register("StatAggregationSystem", StatAggregationSystem_js_1.StatAggregationSystem);
    engine.registry.register("VisualSystem", VisualSystem_js_1.VisualSystem);
    engine.registry.register("UISystem", UISystem_js_1.UISystem);
    engine.start();
    // Setup Actors
    // Player is 1, Monster is 2 usually (from SpawnGridSystem)
    const player = engine.world.query("PlayerTag")[0];
    const monster = engine.world.query("MonsterTag")[0];
    // Force Positions to known state
    // Player at (1,1), Monster at (8,8)
    const setPos = (ent, x, y) => {
        const p = engine.world.getComponent(ent, "Position");
        if (p) {
            p.x = x;
            p.y = y;
        }
    };
    setPos(player, 1, 1);
    setPos(monster, 8, 8);
    // Initial Stat Aggregation (Tick 0)
    engine.world.addComponent(player, "BaseStats", new BaseStats_js_1.BaseStats(1, 0));
    // Ensure Monster Health is 3
    engine.world.addComponent(monster, "Health", { current: 3, max: 3 });
    // Helper for manual step to ensure determinism and override positions if needed
    const manualStep = (overridePlayerPos) => {
        const tick = engine.tick;
        const w = engine.world;
        // Run systems in order
        (0, InputSystem_js_1.InputSystem)(w, tick);
        (0, MovementSystem_js_1.MovementSystem)(w, tick);
        // Explicit Position Override for Audit Control
        if (overridePlayerPos) {
            setPos(player, overridePlayerPos.x, overridePlayerPos.y);
        }
        (0, CollisionSystem_js_1.CollisionSystem)(w, tick);
        (0, CombatSystem_js_1.CombatSystem)(w, tick);
        (0, LootSystem_js_1.LootSystem)(w, tick);
        (0, InventorySystem_js_1.InventorySystem)(w, tick);
        (0, EquipmentSystem_js_1.EquipmentSystem)(w, tick);
        (0, StatAggregationSystem_js_1.StatAggregationSystem)(w, tick);
        (0, VisualSystem_js_1.VisualSystem)(w, tick);
        (0, UISystem_js_1.UISystem)(w, tick);
        w.events.clear();
        engine.tick++;
    };
    console.log("=== PHASE 1: BASELINE DAMAGE ===");
    // 1. Tick 0: Stats init
    manualStep();
    const baselineStats = engine.world.getComponent(player, "DerivedStats");
    if (!baselineStats || baselineStats.damage !== 1) {
        violations.push(`Phase 1: Baseline Damage mismatch. Expected 1, got ${baselineStats?.damage}`);
    }
    // 2. Hit Sequence: Away -> Contact -> Hit
    manualStep({ x: 1, y: 1 }); // Away (Clear Lock)
    manualStep({ x: 8, y: 8 }); // Contact (Hit)
    const hp1 = engine.world.getComponent(monster, "Health").current;
    console.log(`Phase 1 Monster HP: ${hp1}`);
    if (hp1 !== 2)
        violations.push(`Phase 1: Monster HP Mismatch. Expected 2 (3-1), got ${hp1}`);
    console.log("=== PHASE 2: EQUIP RUSTY SWORD ===");
    // 3. Equip
    engine.world.events.publish({
        type: "ItemAddedEvent",
        tick: engine.tick,
        targetEntityId: player,
        itemId: "rusty_sword",
        quantity: 1
    });
    engine.world.events.publish({
        type: "EquipItemEvent",
        tick: engine.tick,
        entityId: player,
        slot: "weapon",
        itemId: "rusty_sword"
    });
    manualStep({ x: 1, y: 1 }); // Away + Process Equip
    const equippedStats = engine.world.getComponent(player, "DerivedStats");
    if (!equippedStats || equippedStats.damage !== 2) {
        violations.push(`Phase 2: Equipped Damage mismatch. Expected 2, got ${equippedStats?.damage}`);
    }
    // 4. Hit Sequence
    manualStep({ x: 1, y: 1 }); // Away (Clear Lock)
    manualStep({ x: 8, y: 8 }); // Contact (Hit)
    const hp2 = engine.world.getComponent(monster, "Health").current;
    console.log(`Phase 2 Monster HP: ${hp2}`);
    if (hp2 !== 0)
        violations.push(`Phase 2: Monster HP Mismatch. Expected 0 (2-2), got ${hp2}`);
    console.log("=== PHASE 3: SNAPSHOT + RESTORE ===");
    const snapshot = PersistenceService_js_1.PersistenceService.serialize(engine.world, engine.tick);
    // WIPEOUT
    engine.world.clear();
    // RESTORE
    PersistenceService_js_1.PersistenceService.deserialize(snapshot, engine.world);
    // Re-acquire references (IDs are preserved)
    const rPlayer = engine.world.query("PlayerTag")[0];
    const rMonster = engine.world.query("MonsterTag")[0];
    // Redefine setPos for restored world/IDs if needed (though world instance is same)
    const setPosRestored = (ent, x, y) => {
        const p = engine.world.getComponent(ent, "Position");
        if (p) {
            p.x = x;
            p.y = y;
        }
    };
    // Override manualStep to use new IDs (though strictly they are same integers)
    const manualStepRestored = (overridePlayerPos) => {
        const tick = engine.tick;
        const w = engine.world;
        (0, InputSystem_js_1.InputSystem)(w, tick);
        (0, MovementSystem_js_1.MovementSystem)(w, tick);
        if (overridePlayerPos)
            setPosRestored(rPlayer, overridePlayerPos.x, overridePlayerPos.y);
        (0, CollisionSystem_js_1.CollisionSystem)(w, tick);
        (0, CombatSystem_js_1.CombatSystem)(w, tick);
        (0, LootSystem_js_1.LootSystem)(w, tick);
        (0, InventorySystem_js_1.InventorySystem)(w, tick);
        (0, EquipmentSystem_js_1.EquipmentSystem)(w, tick);
        (0, StatAggregationSystem_js_1.StatAggregationSystem)(w, tick);
        (0, VisualSystem_js_1.VisualSystem)(w, tick);
        (0, UISystem_js_1.UISystem)(w, tick);
        w.events.clear();
        engine.tick++;
    };
    const restoredStats = engine.world.getComponent(rPlayer, "DerivedStats");
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
    const hp3 = engine.world.getComponent(rMonster, "Health").current;
    console.log(`Phase 3 Monster HP: ${hp3}`);
    if (hp3 !== 1)
        violations.push(`Phase 3: Monster HP Mismatch. Expected 1 (3-2), got ${hp3}`);
    console.log("=== PHASE 4: UNEQUIP ===");
    engine.world.events.publish({
        type: "UnequipItemEvent",
        tick: engine.tick,
        entityId: rPlayer,
        slot: "weapon"
    });
    manualStepRestored({ x: 1, y: 1 }); // Away + Process Unequip
    const unequippedStats = engine.world.getComponent(rPlayer, "DerivedStats");
    if (!unequippedStats || unequippedStats.damage !== 1) {
        violations.push(`Phase 4: Unequipped Damage mismatch. Expected 1, got ${unequippedStats?.damage}`);
    }
    // Reset Monster HP to 3 for final check
    engine.world.addComponent(rMonster, "Health", { current: 3, max: 3 });
    manualStepRestored({ x: 1, y: 1 }); // Away
    manualStepRestored({ x: 8, y: 8 }); // Contact
    const hp4 = engine.world.getComponent(rMonster, "Health").current;
    console.log(`Phase 4 Monster HP: ${hp4}`);
    if (hp4 !== 2)
        violations.push(`Phase 4: Monster HP Mismatch. Expected 2 (3-1), got ${hp4}`);
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
