#!/usr/bin/env ts-node
/**
 * Database Schema Freeze Validation Script
 * 
 * Purpose: Detects breaking changes to the frozen Month 2 database schema
 * Usage: npx ts-node scripts/check-schema-freeze.ts
 * Exit Codes:
 *   0 - Schema unchanged or only approved additions
 *   1 - Breaking change detected
 */

import * as fs from 'fs';
import * as path from 'path';

// Frozen schema snapshot (Month 2 Final - 2026-02-13)
const FROZEN_SCHEMA = {
    models: [
        'User',
        'SavedTrip',
        'TransportSession',
        'DriverLocation',
        'RideRequest',
        'embeddings',
        'PlannerMetadata',
        'SystemMetadata',
        'spatial_ref_sys',
    ],
    fields: {
        User: ['id', 'phoneNumber', 'name', 'email', 'birthday', 'gender', 'preferences', 'createdAt', 'updatedAt'],
        SavedTrip: ['id', 'userId', 'name', 'destination', 'startDate', 'endDate', 'itinerary', 'preferences', 'createdAt', 'updatedAt'],
        TransportSession: ['id', 'passengerId', 'driverId', 'status', 'pickupLocation', 'destination', 'fare', 'startTime', 'endTime', 'statusUpdates'],
        DriverLocation: ['id', 'driverId', 'location', 'updatedAt'],
        RideRequest: ['id', 'passengerId', 'pickupLocation', 'destination', 'status', 'createdAt'],
        embeddings: ['id', 'embedding', 'created_at', 'content', 'title'],
        PlannerMetadata: ['id', 'key', 'value', 'updatedAt'],
        SystemMetadata: ['key', 'value', 'updatedAt'],
        spatial_ref_sys: ['srid', 'auth_name', 'auth_srid', 'srtext', 'proj4text'],
    },
};

interface ValidationResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Parse prisma schema file and extract model/field information
 */
function parseSchema(schemaPath: string): { models: string[]; fields: Record<string, string[]> } {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const lines = content.split('\n');

    const models: string[] = [];
    const fields: Record<string, string[]> = {};
    let currentModel: string | null = null;

    for (const line of lines) {
        const trimmed = line.trim();

        // Detect model declaration
        const modelMatch = trimmed.match(/^model\s+(\w+)\s*{/);
        if (modelMatch) {
            currentModel = modelMatch[1];
            models.push(currentModel);
            fields[currentModel] = [];
            continue;
        }

        // End of model
        if (trimmed === '}' && currentModel) {
            currentModel = null;
            continue;
        }

        // Detect field
        if (currentModel && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@')) {
            const fieldMatch = trimmed.match(/^(\w+)\s+/);
            if (fieldMatch) {
                fields[currentModel].push(fieldMatch[1]);
            }
        }
    }

    return { models, fields };
}

/**
 * Validate current schema against frozen snapshot
 */
function validateSchema(current: { models: string[]; fields: Record<string, string[]> }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for removed models
    for (const frozenModel of FROZEN_SCHEMA.models) {
        if (!current.models.includes(frozenModel)) {
            errors.push(`❌ BREAKING: Model '${frozenModel}' has been removed`);
        }
    }

    // Check for removed fields
    for (const [modelName, frozenFields] of Object.entries(FROZEN_SCHEMA.fields)) {
        if (!current.fields[modelName]) {
            continue; // Model already flagged as removed
        }

        for (const frozenField of frozenFields) {
            if (!current.fields[modelName].includes(frozenField)) {
                errors.push(`❌ BREAKING: Field '${modelName}.${frozenField}' has been removed or renamed`);
            }
        }
    }

    // Check for new models (allowed but warn)
    for (const currentModel of current.models) {
        if (!FROZEN_SCHEMA.models.includes(currentModel)) {
            warnings.push(`⚠️  New model added: '${currentModel}' (ensure documented in DB_SCHEMA_FREEZE.md)`);
        }
    }

    // Check for new fields (allowed but warn)
    for (const [modelName, currentFields] of Object.entries(current.fields)) {
        if (!FROZEN_SCHEMA.fields[modelName]) {
            continue; // New model, already warned
        }

        for (const currentField of currentFields) {
            if (!FROZEN_SCHEMA.fields[modelName].includes(currentField)) {
                warnings.push(`⚠️  New field added: '${modelName}.${currentField}' (ensure optional or has default)`);
            }
        }
    }

    return {
        ok: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Main execution
 */
function main() {
    console.log('🔒 Database Schema Freeze Validator');
    console.log('=====================================\n');

    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
        console.error(`❌ Schema file not found: ${schemaPath}`);
        process.exit(1);
    }

    console.log(`📄 Reading schema: ${schemaPath}\n`);

    const currentSchema = parseSchema(schemaPath);
    const result = validateSchema(currentSchema);

    // Print errors
    if (result.errors.length > 0) {
        console.log('BREAKING CHANGES DETECTED:\n');
        result.errors.forEach((error) => console.log(error));
        console.log();
    }

    // Print warnings
    if (result.warnings.length > 0) {
        console.log('WARNINGS (Non-Breaking):\n');
        result.warnings.forEach((warning) => console.log(warning));
        console.log();
    }

    // Summary
    if (result.ok) {
        if (result.warnings.length > 0) {
            console.log('✅ Schema validation passed with warnings');
            console.log('   Review warnings and ensure DB_SCHEMA_FREEZE.md is updated\n');
        } else {
            console.log('✅ Schema validation passed - no changes detected\n');
        }
        process.exit(0);
    } else {
        console.log('❌ Schema validation FAILED - breaking changes detected');
        console.log('   Month 3 approval required. See DB_SCHEMA_FREEZE.md for process\n');
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { parseSchema, validateSchema, FROZEN_SCHEMA };
