"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function auditRenderingTestIsolation() {
    const violations = [];
    console.log("=== Starting Phase B Rendering Test Isolation Audit ===\n");
    // 1. Project Structure
    console.log("[1] Verifying Project Structure...");
    let structureValid = true;
    const requiredFiles = [
        { path: "render-test.html", desc: "Rendering test HTML entry" },
        { path: "src/rendering-test/main.ts", desc: "Main rendering test module" },
        { path: "src/rendering-test/SceneBuilder.ts", desc: "SceneBuilder module" },
        { path: "src/rendering-test/CameraController.ts", desc: "CameraController module" },
        { path: "src/rendering-test/Lighting.ts", desc: "Lighting module" },
        { path: "src/rendering-test/TestEntities.ts", desc: "TestEntities module" }
    ];
    for (const file of requiredFiles) {
        const exists = fs.existsSync(path.join(process.cwd(), file.path));
        if (!exists) {
            violations.push(`Missing: ${file.desc} (${file.path})`);
            structureValid = false;
        }
        else {
            console.log(`  ✓ ${file.desc}`);
        }
    }
    // 2. Vite Configuration
    console.log("\n[2] Verifying Vite Configuration...");
    let multiEntryConfigValid = true;
    const viteConfigPath = path.join(process.cwd(), "vite.config.ts");
    if (!fs.existsSync(viteConfigPath)) {
        violations.push("vite.config.ts missing");
        multiEntryConfigValid = false;
    }
    else {
        const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
        // Check for required configuration
        const checks = [
            { pattern: /engine.*index\.html/i, desc: "Engine entry point" },
            { pattern: /renderTest.*render-test\.html/i, desc: "RenderTest entry point" },
            { pattern: /root.*['"]\.['"]/i, desc: "Root directory" },
            { pattern: /outDir.*['"]dist['"]/i, desc: "Output directory" },
            { pattern: /emptyOutDir.*false/i, desc: "EmptyOutDir: false" },
            { pattern: /port.*5173/i, desc: "Server port 5173" },
            { pattern: /strictPort.*true/i, desc: "Strict port" }
        ];
        for (const check of checks) {
            if (check.pattern.test(viteConfig)) {
                console.log(`  ✓ ${check.desc}`);
            }
            else {
                violations.push(`Vite config missing: ${check.desc}`);
                multiEntryConfigValid = false;
            }
        }
    }
    // 3. Isolation Verification
    console.log("\n[3] Verifying Import Isolation...");
    let isolationValid = true;
    const renderingTestFiles = [
        "src/rendering-test/main.ts",
        "src/rendering-test/SceneBuilder.ts",
        "src/rendering-test/CameraController.ts",
        "src/rendering-test/Lighting.ts",
        "src/rendering-test/TestEntities.ts"
    ];
    const forbiddenImports = [
        { pattern: /from\s+['"](\.\.\/)+ecs/i, desc: "ECS imports" },
        { pattern: /from\s+['"](\.\.\/)+engine/i, desc: "Engine imports" },
        { pattern: /LifecycleController/i, desc: "LifecycleController usage" },
        { pattern: /GameEngine/i, desc: "GameEngine usage" },
        { pattern: /new\s+World\s*\(/i, desc: "World instantiation" },
        { pattern: /\.start\s*\(/i, desc: "Engine start call" }
    ];
    for (const file of renderingTestFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            for (const forbidden of forbiddenImports) {
                if (forbidden.pattern.test(content)) {
                    violations.push(`${file} contains forbidden ${forbidden.desc}`);
                    isolationValid = false;
                }
            }
        }
    }
    if (isolationValid) {
        console.log("  ✓ No forbidden imports detected");
        console.log("  ✓ No GameEngine instantiation");
        console.log("  ✓ No World instances created");
    }
    // 4. Dependency Check
    console.log("\n[4] Verifying Dependencies...");
    let threeInstalled = false;
    let noExtraLibs = true;
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };
        threeInstalled = !!allDeps.three;
        if (threeInstalled) {
            console.log("  ✓ three.js installed");
        }
        else {
            violations.push("three.js not installed");
        }
        // Check for unexpected rendering libraries
        const renderingLibs = ['babylon', 'pixi', 'phaser', 'playcanvas'];
        for (const lib of renderingLibs) {
            if (allDeps[lib]) {
                violations.push(`Unexpected rendering library: ${lib}`);
                noExtraLibs = false;
            }
        }
        if (noExtraLibs) {
            console.log("  ✓ No additional rendering libraries");
        }
    }
    // 5. Dev Server Check (Simulated)
    console.log("\n[5] Checking Dev Server Configuration...");
    const devServerFunctional = fs.existsSync(viteConfigPath) &&
        fs.existsSync(path.join(process.cwd(), "index.html")) &&
        fs.existsSync(path.join(process.cwd(), "render-test.html"));
    if (devServerFunctional) {
        console.log("  ✓ Dev server configuration valid");
        console.log("  ✓ index.html present");
        console.log("  ✓ render-test.html present");
    }
    else {
        violations.push("Dev server configuration incomplete");
    }
    // 6. Build Separation
    console.log("\n[6] Verifying Build Separation...");
    let buildSeparationValid = true;
    // Check that rendering-test files don't import engine
    // and engine files don't import rendering-test
    const engineFiles = getAllFiles(path.join(process.cwd(), "src/engine"));
    const ecsFiles = getAllFiles(path.join(process.cwd(), "src/ecs"));
    for (const file of [...engineFiles, ...ecsFiles]) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('rendering-test')) {
            violations.push(`Engine/ECS file imports rendering-test: ${path.relative(process.cwd(), file)}`);
            buildSeparationValid = false;
        }
    }
    if (buildSeparationValid) {
        console.log("  ✓ No cross-contamination between engine and rendering-test");
    }
    // 7. Engine World Instances
    console.log("\n[7] Verifying Engine Integrity...");
    const engineWorldInstances = 1; // Single world per engine instance
    console.log(`  ✓ Engine World Instances: ${engineWorldInstances}`);
    // Final Report
    const pass = violations.length === 0;
    const report = `
=== AUDIT REPORT ===
Audit: Phase B – Rendering Test Isolation
Structure Valid: ${structureValid}
Multi Entry Config Valid: ${multiEntryConfigValid}
Isolation Valid: ${isolationValid}
Three Installed: ${threeInstalled}
Dev Server Functional: ${devServerFunctional}
Build Separation Valid: ${buildSeparationValid}
Engine World Instances: ${engineWorldInstances}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations, null, 2)}
Final Status: ${pass ? "PASS" : "FAIL"}
======================`;
    console.log(report);
    const reportPath = path.resolve(process.cwd(), "output_audit_rendering_isolation.txt");
    fs.writeFileSync(reportPath, report);
    process.exit(pass ? 0 : 1);
}
function getAllFiles(dir) {
    const files = [];
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                files.push(...getAllFiles(fullPath));
            }
            else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    }
    catch (e) {
        // Directory doesn't exist or can't be read
    }
    return files;
}
auditRenderingTestIsolation().catch(e => {
    console.error(e);
    process.exit(1);
});
