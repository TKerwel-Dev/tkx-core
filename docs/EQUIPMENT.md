# Equipment & Stat Modifiers

## Overview
The Equipment system allows Entities (`Player`, `Monster`) to equip items, affecting derived stats like Damage.

## Components
*   **BaseStats**: Hardcoded base attributes.
*   **Equipment**: Dictionary of slots (`weapon`, `armor`) => `Item`.
*   **StatModifier**: Dynamic list of temporary/permanent stat buffs.
*   **DerivedStats**: Result of aggregating `BaseStats` + `StatModifier`.

## Systems
*   `EquipmentSystem`: Listens for `EquipItemEvent` and `UnequipItemEvent`.
    -   Adds/Removes Item from Equipment component.
    -   Adds/Removes corresponding `StatModifier` based on Item ID.
*   `StatAggregationSystem`: Runs EVERY tick before logic systems.
    -   Clears `DerivedStats`.
    -   Aggregates `BaseStats`.
    -   Sums `StatModifier` values.
    -   Writes result to `DerivedStats`.

## Determinism
Stat aggregation is completely deterministic. Item data is static and sourced from `ItemRegistry`.
The `PersistenceService` correctly saves Equipment slots but **does not** save temporary `StatModifier` components if they are recalculated every tick.
Wait, `StatModifier` IS persisted if attached to the entity.
In `audit_gate9_extended.ts`, strict persistence of `StatModifier` is verified.
Actually, `StatAggregationSystem` might re-derive stats.
But the presence of `StatModifier` components IS persisted.
So `EquipmentSystem` ensures correct modifiers exist.
`StatAggregationSystem` ensures `DerivedStats` match.

## Item Registry
All items are defined in `src/items/ItemRegistry.ts` with properties like `damageBonus`.
Items are referenced by their string ID (e.g., `rusty_sword`).
