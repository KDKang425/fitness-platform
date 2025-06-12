# Database Migrations

## Migration Strategy

This project uses TypeORM migrations to manage database schema changes.

## Current Migration Order

1. **1748415297408-AddRoutineSubscription.ts** - Adds routine subscription functionality
2. **1748449991045-AddPersonalRecordsTable.ts** - Adds personal records tracking
3. **1748500000000-AddIndexes.ts** - Adds performance indexes
4. **1748600000000-AddAuthAndNotification.ts** - Adds authentication and notification features
5. **1748700000000-AddWorkoutSessionPauseFields.ts** - Adds pause tracking to workouts
6. **1748770000000-AddRefreshTokenTable.ts** - Adds refresh token management
7. **1748771000000-AddPostComments.ts** - Adds commenting feature to posts
8. **1748800000000-AddPerformanceIndexes.ts** - Additional performance indexes
9. **1748900000000-AddMissingIndexes.ts** - More index optimizations
10. **1749000000000-AddMissingFeatures.ts** - Additional features
11. **1750000000000-InitialSchema.ts** - Complete schema snapshot (can be used for fresh installs)
12. **1750100000000-AddPushTokensTable.ts** - Adds push notification token management
13. **1750200000000-CleanupAndAddMissingTables.ts** - Ensures all tables exist and adds missing ones

## Running Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration based on entity changes
npm run migration:generate -- -n MigrationName

# Create an empty migration
npm run migration:create -- -n MigrationName
```

## Important Notes

1. **Double .ts Extensions**: Fixed in the cleanup process
2. **InitialSchema Migration**: Can be used for fresh database installations instead of running all incremental migrations
3. **Push Notifications**: Added in migration 1750100000000
4. **Post Comments**: While implemented in backend, not used in frontend as per specification

## Fresh Installation

For a fresh database, you have two options:

1. Run all migrations in order:
   ```bash
   npm run migration:run
   ```

2. Or run only the InitialSchema and subsequent migrations:
   - Delete or skip migrations before 1750000000000
   - Run migrations starting from InitialSchema

## Entity Changes

When making changes to entities:

1. Make your entity changes
2. Generate a migration: `npm run migration:generate -- -n DescriptiveNameOfChange`
3. Review the generated migration
4. Run the migration: `npm run migration:run`