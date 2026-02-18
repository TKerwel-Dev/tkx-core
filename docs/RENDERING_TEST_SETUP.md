# Rendering Test Setup - Phase B

## Overview
An isolated Three.js rendering test environment has been created alongside the existing game engine without modifying any core engine code.

## Project Structure
```
/home/thomas/Rune/
├── index.html              # Main engine entry point
├── render-test.html        # NEW: Rendering test entry point
├── vite.config.ts          # NEW: Multi-entry configuration
├── src/
│   ├── engine/             # Unchanged - Core engine
│   ├── ecs/                # Unchanged - ECS systems
│   ├── persistence/        # Unchanged - Persistence layer
│   ├── items/              # Unchanged - Item registry
│   ├── main.ts             # Unchanged - Engine entry
│   └── rendering-test/     # NEW: Isolated rendering test
│       ├── main.ts
│       ├── SceneBuilder.ts
│       ├── CameraController.ts
│       ├── Lighting.ts
│       └── TestEntities.ts
└── tests/                  # Test suite
```

## Configuration

### Vite Multi-Entry Setup
- **Engine Entry**: `http://localhost:5173/` → `index.html` → `src/main.ts`
- **Rendering Test**: `http://localhost:5173/render-test.html` → `src/rendering-test/main.ts`

### Isolation Guarantees
- ✅ No imports from `/src/engine`
- ✅ No imports from `/src/ecs`
- ✅ No `GameEngine` instantiation
- ✅ No `World` instances
- ✅ No `LifecycleController` usage

### Dependencies
- **three.js**: Installed for 3D rendering
- No additional libraries added

## Usage

### Development Server
```bash
npm run dev
```

### Access Points
- Main Engine: `http://localhost:5173/`
- Rendering Test: `http://localhost:5173/render-test.html`

### Build
```bash
npm run build
```
Outputs both entry points to `dist/` directory.

## Verification
All checks passed:
- ✅ Engine Unmodified
- ✅ Rendering Folder Created
- ✅ Multi Entry Config Active
- ✅ Three.js Installed
- ✅ Isolation Valid
- ✅ Dev Server Functional

## Next Steps
The rendering test modules are currently placeholders. They can now be populated with Three.js scene setup, camera controls, lighting, and test entities without affecting the core engine.
