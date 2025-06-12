# Migration and Seed Strategy

## Overview
This document outlines the best practices and strategies for managing database migrations and seeds in the fitness platform backend.

## Migration Best Practices

### 1. Idempotency
All migrations should be idempotent - they should be safe to run multiple times without causing errors.

#### Creating Types
```sql
DO $$ BEGIN
    CREATE TYPE "public"."type_name" AS ENUM('value1', 'value2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

#### Creating Tables
```sql
CREATE TABLE IF NOT EXISTS "table_name" (
    "id" SERIAL NOT NULL,
    -- columns...
);
```

#### Creating Indexes
```sql
CREATE INDEX IF NOT EXISTS "index_name" ON "table_name" ("column_name");
```

#### Adding Foreign Keys
```sql
DO $$ BEGIN
    ALTER TABLE "table_name" ADD CONSTRAINT "constraint_name" 
    FOREIGN KEY ("column") REFERENCES "other_table"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
```

### 2. Migration Naming Convention
- Format: `{timestamp}-{DescriptiveName}.ts`
- Example: `1748000000000-InitialSchema.ts`
- Class name: `{DescriptiveName}{timestamp}`
- Example: `InitialSchema1748000000000`

### 3. Migration Order
1. Create types (enums)
2. Create tables
3. Create indexes
4. Add foreign key constraints

### 4. Down Migrations
- Always use `IF EXISTS` clauses
- Drop in reverse order: constraints → indexes → tables → types

## Seed Best Practices

### 1. Idempotency
Always check if data exists before inserting:

```typescript
const existingCount = await repository.count();
if (existingCount > 0) {
    console.log('Data already exists, skipping seed');
    return;
}
```

### 2. Never Delete Production Data
- Seeds should NEVER delete existing data
- Use unique identifiers for test/demo data
- Add clear markers (e.g., "(Demo)" suffix) to identify seeded data

### 3. Error Handling
```typescript
try {
    await repository.save(entities);
    console.log(`Created ${entities.length} records`);
} catch (error) {
    console.error('Error seeding data:', error.message);
    // Handle specific constraint violations
}
```

### 4. Seed Organization
```
seeds/
├── 01-seed-exercises.ts      # Core data
├── 02-seed-test-users.ts     # Test users
├── 03-seed-demo-data.ts      # Demo content
└── run-all-seeds.ts          # Orchestrator
```

### 5. Environment-Specific Seeds
```typescript
if (process.env.NODE_ENV === 'production') {
    console.log('Skipping demo seeds in production');
    return;
}
```

## Common Issues and Solutions

### Issue 1: Type Already Exists
**Problem**: `CREATE TYPE` fails if type exists
**Solution**: Use `DO $$ BEGIN ... EXCEPTION` block

### Issue 2: Migration Order Mismatch
**Problem**: Database has different migration history
**Solution**: Make migrations defensive with existence checks

### Issue 3: Foreign Key Violations
**Problem**: Seeding fails due to missing references
**Solution**: Run seeds in correct order, check dependencies

### Issue 4: Duplicate Key Violations
**Problem**: Seeds try to insert duplicate data
**Solution**: Check existence before insert, use upsert patterns

## Windows Compatibility

All migration and seed scripts should use Node.js wrappers instead of shell-specific syntax:

```javascript
// run-migrations.js
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const { spawn } = require('child_process');
// ... rest of script
```

## Recommended Workflow

1. **Development**:
   ```bash
   npm run migration:generate -- NewFeatureName
   npm run migration:run
   npm run seed:dev
   ```

2. **Testing**:
   ```bash
   npm run migration:run
   npm run seed:test
   ```

3. **Production**:
   ```bash
   npm run migration:run
   # No demo seeds in production
   ```

## Checklist for New Migrations

- [ ] Uses `IF NOT EXISTS` for all CREATE statements
- [ ] Uses exception handling for types and constraints
- [ ] Has proper down() method with `IF EXISTS`
- [ ] Follows naming convention
- [ ] Tested on fresh database
- [ ] Tested on existing database
- [ ] Works on Windows (no inline env vars)

## Checklist for New Seeds

- [ ] Checks for existing data before insert
- [ ] Never deletes existing data
- [ ] Has proper error handling
- [ ] Uses consistent naming
- [ ] Marks demo/test data clearly
- [ ] Respects environment settings
- [ ] Dependencies are documented