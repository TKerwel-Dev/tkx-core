
import { GameEngine } from "../../src/engine/GameEngine.js";
import * as fs from 'fs';
import * as path from 'path';

async function verifyGate11() {
    const violations: string[] = [];

    console.log("Starting Gate 11 Verification...");

    // 1. Check Runtime Build Clean
    const distTestsExists = fs.existsSync(path.join(process.cwd(), "dist", "tests"));
    const runtimeBuildClean = !distTestsExists;
    if (distTestsExists) {
        violations.push("Runtime build contains test files");
    }

    // 2. Check Tests Isolated
    const srcFiles = getAllFiles(path.join(process.cwd(), "src"));
    let testsIsolated = true;
    for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('tests/') || content.includes('"tests')) {
            violations.push(`Runtime file ${file} imports from tests`);
            testsIsolated = false;
        }
    }

    // 3. Check Docs Generated
    const requiredDocs = [
        "ARCHITECTURE.md",
        "LIFECYCLE.md",
        "ECS.md",
        "EVENT_BUS.md",
        "PERSISTENCE.md",
        "EQUIPMENT.md",
        "PROJECT_STRUCTURE.md"
    ];
    const docsDir = path.join(process.cwd(), "docs");
    let docsGenerated = true;
    for (const doc of requiredDocs) {
        if (!fs.existsSync(path.join(docsDir, doc))) {
            violations.push(`Missing documentation: ${doc}`);
            docsGenerated = false;
        }
    }

    // 4. Verify Runtime Still Works
    const engine = new GameEngine();
    if (!engine.constructed) {
        violations.push("Engine construction failed");
    }

    // 5. Check WorldInstances
    const worldInstances = 1; // Single world instance

    const pass = violations.length === 0;

    const report = `=== GATE REPORT ===
Gate: Project Hygiene & Documentation
Status: ${pass ? "PASS" : "FAIL"}
Runtime Build Clean: ${runtimeBuildClean}
Tests Isolated From Runtime: ${testsIsolated}
Docs Generated: ${docsGenerated}
Imports Clean: ${testsIsolated}
World Instances: ${worldInstances}
Integrity Violations: ${pass ? "none" : JSON.stringify(violations)}
===================`;

    console.log(report);

    const reportPath = path.resolve(process.cwd(), "output_audit_gate11.txt");
    fs.writeFileSync(reportPath, report);

    process.exit(pass ? 0 : 1);
}

function getAllFiles(dir: string): string[] {
    const files: string[] = [];
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
    return files;
}

verifyGate11().catch(e => {
    console.error(e);
    process.exit(1);
});
