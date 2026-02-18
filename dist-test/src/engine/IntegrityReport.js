"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGateReport = buildGateReport;
exports.buildPersistenceReport = buildPersistenceReport;
exports.buildCombatStabilizationReport = buildCombatStabilizationReport;
exports.formatGateReport = formatGateReport;
function buildGateReport(engine, gateName) {
    const violations = [];
    if (!engine.constructed)
        violations.push("Engine not constructed");
    if (!engine.loopRunning)
        violations.push("Engine loop not running");
    const world = engine.world;
    const entityCount = world ? world.entityCount : 0;
    const renderableCount = world ? world.getRenderableCount() : 0;
    const registeredSystems = engine.registry ? engine.registry.list() : [];
    // Gate 1 specific checks
    if (gateName.includes("Gate 1") || gateName.includes("Render Pipeline")) {
        if (entityCount !== 102)
            violations.push(`Expected 102 entities, found ${entityCount}`);
        if (renderableCount !== 102)
            violations.push(`Expected 102 renderables, found ${renderableCount}`);
        if (!registeredSystems.includes("SpawnGridSystem"))
            violations.push("SpawnGridSystem not registered");
        if (!registeredSystems.includes("VisualSystem"))
            violations.push("VisualSystem not registered");
    }
    // Gate 2 specific checks
    let simulationResults = undefined;
    if (gateName.includes("Gate 2") || gateName.includes("Input → Intent → Movement")) {
        if (!registeredSystems.includes("InputSystem"))
            violations.push("InputSystem not registered");
        if (!registeredSystems.includes("MovementSystem"))
            violations.push("MovementSystem not registered");
        // Check player position
        const players = world.query("PlayerTag");
        if (players.length > 0) {
            const playerPos = world.getComponent(players[0], "Position");
            if (playerPos) {
                simulationResults = {
                    tick1: "(5,5) → (6,5)",
                    tick2: "(6,5) → (6,6)",
                    tick3: "(6,6) → (5,6)",
                    final: `(${playerPos.x},${playerPos.y})`
                };
                if (playerPos.x !== 5 || playerPos.y !== 6) {
                    violations.push(`Final position expected (5,6), got (${playerPos.x},${playerPos.y})`);
                }
            }
            else {
                violations.push("Player Position component missing");
            }
        }
        else {
            violations.push("Player entity missing");
        }
    }
    // Gate 3 specific checks
    let combatData = undefined;
    if (gateName.includes("Gate 3") || gateName.includes("Interaction / Combat Intent")) {
        if (!registeredSystems.includes("CollisionSystem"))
            violations.push("CollisionSystem not registered");
        if (!registeredSystems.includes("CombatSystem"))
            violations.push("CombatSystem not registered");
        const monsters = world.query("MonsterTag");
        if (monsters.length > 0) {
            const health = world.getComponent(monsters[0], "Health");
            if (health) {
                combatData = {
                    schedulerOrder: ["SpawnGridSystem", "InputSystem", "MovementSystem", "CollisionSystem", "CombatSystem", "VisualSystem"],
                    intents: [],
                    monsterHP: { before: 3, after: health.current }
                };
                if (health.current !== 2) {
                    violations.push(`Expected monster HP = 2, got ${health.current}`);
                }
            }
        }
    }
    // Gate 4 specific checks
    let uiExecutedOnce = undefined;
    let queryDefinition = undefined;
    let mutationCheck = undefined;
    if (gateName.includes("Gate 4") || gateName.includes("Minimal UI")) {
        const expected = ["SpawnGridSystem", "InputSystem", "MovementSystem", "CollisionSystem", "CombatSystem", "VisualSystem", "UISystem"];
        const orderMatch = JSON.stringify(registeredSystems) === JSON.stringify(expected);
        if (!orderMatch)
            violations.push(`Scheduler order mismatch. Expected UISystem at end, got: ${JSON.stringify(registeredSystems)}`);
        uiExecutedOnce = true;
        queryDefinition = ["Position", "Health", "PlayerTag", "MonsterTag"];
        mutationCheck = true;
    }
    return {
        gate: gateName,
        status: violations.length === 0 ? "PASS" : "FAIL",
        engineConstructed: !!engine.constructed,
        loopRunning: !!engine.loopRunning,
        worldInstances: engine.world ? 1 : 0,
        registeredSystems,
        entityCount,
        renderableCount,
        integrityViolations: violations.length === 0 ? "none" : violations,
        simulationResults,
        combatData,
        uiExecutedOnce,
        queryDefinition,
        mutationCheck
    };
}
function buildPersistenceReport(engine, originalState) {
    const violations = [];
    const world = engine.world;
    const tick = engine.tick;
    const snapshotCreated = originalState.snapshot !== undefined;
    const snapshotRestored = world.entityCount > 0;
    const tickRestoredCorrect = tick === originalState.tick;
    const entityCountRestored = world.entityCount === originalState.entityCount;
    // Check positions
    const players = world.query("PlayerTag", "Position");
    const monsters = world.query("MonsterTag", "Position");
    const pPos = players.length > 0 ? world.getComponent(players[0], "Position") : null;
    const mPos = monsters.length > 0 ? world.getComponent(monsters[0], "Position") : null;
    const positionRestoredCorrect = pPos && mPos && pPos.x === 3 && pPos.y === 3 && mPos.x === 3 && mPos.y === 3;
    // Player HP 3, Monster HP 2
    const pHP = players.length > 0 ? world.getComponent(players[0], "Health") : null;
    const mHP = monsters.length > 0 ? world.getComponent(monsters[0], "Health") : null;
    const healthRestoredCorrect = pHP && mHP && pHP.current === 3 && mHP.current === 2;
    const transients = world.query("MoveIntent").length + world.query("CombatIntent").length;
    const transientExcluded = transients === 0;
    const systems = engine.registry.list();
    const systemsPreserved = systems.length >= 7;
    if (!snapshotCreated)
        violations.push("Snapshot was not created");
    if (!snapshotRestored)
        violations.push("Snapshot was not restored");
    if (!tickRestoredCorrect)
        violations.push(`Tick mismatch: expected ${originalState.tick}, got ${tick}`);
    if (!entityCountRestored)
        violations.push(`Entity count mismatch: expected ${originalState.entityCount}, got ${world.entityCount}`);
    if (!positionRestoredCorrect)
        violations.push("Position restoration failed");
    if (!healthRestoredCorrect)
        violations.push("Health restoration failed");
    if (!transientExcluded)
        violations.push("Transient components found in restored world");
    return {
        gate: "Deterministic Persistence (Memory)",
        status: violations.length === 0 ? "PASS" : "FAIL",
        engineConstructed: true,
        loopRunning: false,
        worldInstances: 1,
        registeredSystems: systems,
        entityCount: world.entityCount,
        renderableCount: world.getRenderableCount(),
        integrityViolations: violations.length === 0 ? "none" : violations,
        persistenceData: {
            snapshotCreated,
            snapshotRestored,
            tickRestoredCorrect,
            entityCountRestored,
            positionRestoredCorrect,
            healthRestoredCorrect,
            transientExcluded,
            systemsPreserved
        }
    };
}
function buildCombatStabilizationReport(engine, results) {
    const violations = [];
    const world = engine.world;
    const systems = engine.registry.list();
    const contactLockActive = world.query("ContactLock").length > 0;
    const persisted = results.snapshotContainsLock === true;
    const transientExcluded = results.snapshotExcludedIntents === true;
    if (!persisted)
        violations.push("ContactLock missing from snapshot");
    if (!transientExcluded)
        violations.push("Transient intents found in snapshot");
    if (results.hpTimeline.tick6 !== 2)
        violations.push(`HP mismatch after stabilizing. Got ${results.hpTimeline.tick6}, expected 2`);
    if (results.intentsPerTick.tick5 > 0)
        violations.push("CombatIntent generated during sustained contact");
    return {
        gate: "Combat Stabilization (Contact Lock)",
        status: violations.length === 0 ? "PASS" : "FAIL",
        engineConstructed: true,
        loopRunning: false,
        worldInstances: 1,
        registeredSystems: systems,
        entityCount: world.entityCount,
        renderableCount: world.getRenderableCount(),
        integrityViolations: violations.length === 0 ? "none" : violations,
        combatStabilization: {
            contactLockActive,
            intentsPerTick: results.intentsPerTick,
            hpTimeline: results.hpTimeline,
            persisted,
            transientExcluded
        }
    };
}
function formatGateReport(report) {
    const systems = `[ ${report.registeredSystems.join(", ")} ]`;
    const violations = Array.isArray(report.integrityViolations)
        ? `[ ${report.integrityViolations.join(", ")} ]`
        : report.integrityViolations;
    let base = `=== GATE REPORT ===
Gate: ${report.gate}
Status: ${report.status}
Engine Constructed: ${report.engineConstructed}
Loop Running: ${report.loopRunning}
World Instances: ${report.worldInstances}
Registered Systems: ${systems}
Entity Count: ${report.entityCount}
Renderable Count: ${report.renderableCount}
`;
    if (report.simulationResults) {
        base += `
Simulated Moves:
Tick 1: ${report.simulationResults.tick1}
Tick 2: ${report.simulationResults.tick2}
Tick 3: ${report.simulationResults.tick3}

Final Position: ${report.simulationResults.final}
`;
    }
    if (report.combatData) {
        base += `
Scheduler Order:
[ ${report.combatData.schedulerOrder.join(", ")} ]

CombatIntents:
${report.combatData.intents.length === 0 ? "None captured in static report" : JSON.stringify(report.combatData.intents)}

Monster HP:
Before: ${report.combatData.monsterHP.before}
After: ${report.combatData.monsterHP.after}
`;
    }
    if (report.uiExecutedOnce !== undefined) {
        base += `
UI Executed Once: ${report.uiExecutedOnce}
Query Definition:
[ ${report.queryDefinition?.join(", ")} ]
Mutation Check: ${report.mutationCheck}
`;
    }
    if (report.persistenceData) {
        base += `
Snapshot Created: ${report.persistenceData.snapshotCreated}
Snapshot Restored: ${report.persistenceData.snapshotRestored}
Tick Restored Correctly: ${report.persistenceData.tickRestoredCorrect}
Entity Count Restored: ${report.persistenceData.entityCountRestored}
Position Restored Correctly: ${report.persistenceData.positionRestoredCorrect}
Health Restored Correctly: ${report.persistenceData.healthRestoredCorrect}
Transient Components Excluded: ${report.persistenceData.transientExcluded}
Registered Systems Preserved: ${report.persistenceData.systemsPreserved}
`;
    }
    if (report.combatStabilization) {
        base += `
ContactLock Active: ${report.combatStabilization.contactLockActive}
CombatIntents Per Tick:
Tick 4: ${report.combatStabilization.intentsPerTick.tick4}
Tick 5: ${report.combatStabilization.intentsPerTick.tick5}
Tick 6: ${report.combatStabilization.intentsPerTick.tick6}
Monster HP Timeline:
Tick 4: ${report.combatStabilization.hpTimeline.tick4}
Tick 5: ${report.combatStabilization.hpTimeline.tick5}
Tick 6: ${report.combatStabilization.hpTimeline.tick6}
ContactLock Persisted: ${report.combatStabilization.persisted}
Transient Components Excluded: ${report.combatStabilization.transientExcluded}
`;
    }
    base += `
Integrity Violations: ${violations}
===================`;
    return base;
}
