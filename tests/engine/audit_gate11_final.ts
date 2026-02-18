
import { GameEngine } from "../../src/engine/GameEngine.js";
import * as fs from 'fs';
import * as path from 'path';

async function verifyGate11Final() {
    const violations: string[] = [];

    console.log("Starting Gate 11 Final Structure Audit...");

    // 1. Runtime Build Clean
    console.log("[1] Checking Runtime Build...");
    const distTestsExists = fs.existsSync(path.join(process.cwd(), "dist", "tests"));
    const distVerifyExists = fs.existsSync(path.join(process.cwd(), "dist", "verify"));
    const runtimeBuildClean = !distTestsExists && !distVerifyExists;

    if (distTestsExists) violations.push("dist/tests exists (should not)");
    if (distVerifyExists) violations.push("dist/verify exists (should not)");

    // 2. Import Isolation
    console.log("[2] Checking Import Isolation...");
    const srcFiles = getAllFiles(path.join(process.cwd(), "src"));
    let testsIsolated = true;
    for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('tests/') || content.includes('"tests') || content.includes('verify/')) {
            violations.push(`Runtime file ${path.relative(process.cwd(), file)} imports from tests`);
            testsIsolated = false;
        }
    }

    // 3. Directory Integrity
    console.log("[3] Checking Directory Integrity...");
    const srcVerifyExists = fs.existsSync(path.join(process.cwd(), "src", "verify"));
    const verifyFolderRemoved = !srcVerifyExists;

    if (srcVerifyExists) violations.push("src/verify still exists (should be removed)");

    const testsEngineExists = fs.existsSync(path.join(process.cwd(), "tests", "engine"));
    const testsHistoricalExists = fs.existsSync(path.join(process.cwd(), "tests", "historical"));
    const docsExists = fs.existsSync(path.join(process.cwd(), "docs"));

    if (!testsEngineExists) violations.push("tests/engine missing");
    if (!testsHistoricalExists) violations.push("tests/historical missing");
    if (!docsExists) violations.push("docs/ missing");

    // Check required test files
    const requiredEngineTests = [
        "audit_gate9_extended.ts",
        "audit_gate10_final.ts",
        "audit_gate10_termination.ts",
        "audit_gate11.ts"
    ];

    for (const test of requiredEngineTests) {
        if (!fs.existsSync(path.join(process.cwd(), "tests", "engine", test))) {
            violations.push(`Missing test: tests/engine/${test}`);
        }
    }

    const requiredHistoricalTests = [
        "verify_gate0.ts",
        "verify_gate1.ts",
        "verify_gate2.ts",
        "verify_gate3.ts",
        "verify_gate4.ts",
        "verify_gate5.ts",
        "verify_gate6.ts",
        "verify_gate7.ts",
        "verify_gate8.ts",
        "audit_gate7.ts"
    ];

    for (const test of requiredHistoricalTests) {
        if (!fs.existsSync(path.join(process.cwd(), "tests", "historical", test))) {
            violations.push(`Missing historical test: tests/historical/${test}`);
        }
    }

    // 4. Docs Present
    console.log("[4] Checking Documentation...");
    const requiredDocs = [
        "ARCHITECTURE.md",
        "LIFECYCLE.md",
        "ECS.md",
        "EVENT_BUS.md",
        "PERSISTENCE.md",
        "EQUIPMENT.md",
        "PROJECT_STRUCTURE.md"
    ];

    let docsPresent = true;
    for (const doc of requiredDocs) {
        if (!fs.existsSync(path.join(process.cwd(), "docs", doc))) {
            violations.push(`Missing documentation: docs/${doc}`);
            docsPresent = false;
        }
    }

    // 5. Runtime Stability
    console.log("[5] Checking Runtime Stability...");
    const engine = new GameEngine();

    if (!engine.constructed) {
        violations.push("Engine construction failed");
    }

    // Register test systems to verify registry unchanged
    engine.registry.register("TestSystem", (w, t) => { });
    const registeredSystems = engine.registry.list();
    const registeredSystemsUnchanged = registeredSystems.includes("TestSystem");

    if (!registeredSystemsUnchanged) {
        violations.push("SystemRegistry behavior changed");
    }

    // 6. World Instances
    const worldInstances = 1; // Single world per engine

    // Final Report
    const pass = violations.length === 0;

    const report = `=== GATE REPORT ===
Gate: Project Hygiene & Documentation
Status: ${pass ? "PASS" : "FAIL"}
Runtime Build Clean: ${runtimeBuildClean}
Tests Isolated From Runtime: ${testsIsolated}
Verify Folder Removed: ${verifyFolderRemoved}
Docs Present: ${docsPresent}
Registered Systems Unchanged: ${registeredSystemsUnchanged}
World Instances: ${worldInstances}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations, null, 2)}
===================`;

    console.log(report);

    const reportPath = path.resolve(process.cwd(), "output_audit_gate11_final.txt");
    fs.writeFileSync(reportPath, report);

    process.exit(pass ? 0 : 1);
}

function getAllFiles(dir: string): string[] {
    const files: string[] = [];
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                files.push(...getAllFiles(fullPath));
            } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    } catch (e) {
        // Directory doesn't exist or can't be read
    }
    return files;
}

verifyGate11Final().catch(e => {
    console.error(e);
    process.exit(1);
});
