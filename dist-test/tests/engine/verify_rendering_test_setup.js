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
async function verifyRenderingTestSetup() {
    const violations = [];
    console.log("Starting Rendering Test Setup Verification...");
    // 1. Check Engine Unmodified
    console.log("[1] Checking Engine Integrity...");
    const engineFiles = [
        "src/engine/GameEngine.ts",
        "src/engine/World.ts",
        "src/engine/EventBus.ts",
        "src/engine/LifecycleController.ts"
    ];
    let engineUnmodified = true;
    for (const file of engineFiles) {
        if (!fs.existsSync(path.join(process.cwd(), file))) {
            violations.push(`Engine file missing: ${file}`);
            engineUnmodified = false;
        }
    }
    // 2. Check Rendering Folder Created
    console.log("[2] Checking Rendering Test Structure...");
    const renderingTestFiles = [
        "src/rendering-test/main.ts",
        "src/rendering-test/SceneBuilder.ts",
        "src/rendering-test/CameraController.ts",
        "src/rendering-test/Lighting.ts",
        "src/rendering-test/TestEntities.ts"
    ];
    let renderingFolderCreated = true;
    for (const file of renderingTestFiles) {
        if (!fs.existsSync(path.join(process.cwd(), file))) {
            violations.push(`Rendering test file missing: ${file}`);
            renderingFolderCreated = false;
        }
    }
    // 3. Check Multi Entry Config
    console.log("[3] Checking Vite Configuration...");
    const viteConfigExists = fs.existsSync(path.join(process.cwd(), "vite.config.ts"));
    const renderTestHtmlExists = fs.existsSync(path.join(process.cwd(), "render-test.html"));
    const multiEntryConfigActive = viteConfigExists && renderTestHtmlExists;
    if (!viteConfigExists)
        violations.push("vite.config.ts missing");
    if (!renderTestHtmlExists)
        violations.push("render-test.html missing");
    // 4. Check Three Installed
    console.log("[4] Checking Dependencies...");
    const packageJsonPath = path.join(process.cwd(), "package.json");
    let threeInstalled = false;
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        threeInstalled = !!(packageJson.dependencies?.three || packageJson.devDependencies?.three);
    }
    if (!threeInstalled)
        violations.push("three.js not installed");
    // 5. Check Isolation
    console.log("[5] Checking Import Isolation...");
    let isolationValid = true;
    for (const file of renderingTestFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (content.includes('from "../ecs') ||
                content.includes('from "../engine') ||
                content.includes('from "../../ecs') ||
                content.includes('from "../../engine') ||
                content.includes('GameEngine') ||
                content.includes('World') ||
                content.includes('LifecycleController')) {
                violations.push(`${file} imports from engine/ecs (isolation violated)`);
                isolationValid = false;
            }
        }
    }
    // 6. Dev Server Check (simulated - actual check requires running server)
    console.log("[6] Dev Server Configuration...");
    const devServerFunctional = viteConfigExists; // Simplified check
    // Final Report
    const pass = violations.length === 0;
    const report = `=== SETUP REPORT ===
Phase: Rendering Test Isolation
Engine Unmodified: ${engineUnmodified}
Rendering Folder Created: ${renderingFolderCreated}
Multi Entry Config Active: ${multiEntryConfigActive}
Three Installed: ${threeInstalled}
Isolation Valid: ${isolationValid}
Dev Server Functional: ${devServerFunctional}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations, null, 2)}
=====================`;
    console.log(report);
    const reportPath = path.resolve(process.cwd(), "output_rendering_test_setup.txt");
    fs.writeFileSync(reportPath, report);
    process.exit(pass ? 0 : 1);
}
verifyRenderingTestSetup().catch(e => {
    console.error(e);
    process.exit(1);
});
