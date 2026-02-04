# Database Implementation Guide

## Overview

This document describes the database implementation for the HCS Price Engine application. The system now uses MongoDB to persistently store strategy configurations and global settings.

## Architecture

### Database Models

#### 1. Strategy Model (`src/lib/models.js`)

Stores pricing strategy configurations with flexible band structures:

```javascript
{
  name: String (unique),
  description: String,
  reference_column: String,
  tolerance_type: String,
  tolerance_value: Number,
  stale_days: Number,
  nudge_type: String,
  nudge_value: Number,
  rounding_mode: String,
  weekend_hold: Boolean,
  phase_bands: Mixed (flexible object),
  age_bands: Mixed (flexible array of band objects),
  rating_bands: Mixed (flexible array of band objects),
  target_matrix: Mixed (dynamic matrix based on bands),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features:**
- Uses `mongoose.Schema.Types.Mixed` for flexible band structures
- Allows bands to be modified without schema changes
- Includes timestamps for tracking changes
- Supports multiple strategies with unique names

#### 2. Configuration Model (`src/lib/models.js`)

Stores global application settings:

```javascript
{
  key: String (unique),
  value: Mixed,
  description: String,
  category: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Categories:**
- `tolerance` - Tolerance type and value settings
- `nudge` - Nudge type and value settings
- `system` - System-wide settings (rounding mode, stale days, etc.)

## API Endpoints

### GET `/api/config`

Retrieves configuration data.

**Query Parameters:**
- `type` - Optional: `'strategy'`, `'config'`, or `'all'`
- `id` - Optional: Strategy ID for fetching specific strategy

**Response:**
```json
{
  "success": true,
  "data": [/* array of strategies or configs */]
}
```

### POST `/api/config`

Saves or modifies configurations.

**Actions:**

#### 1. Save Strategy
```json
{
  "action": "save",
  "config": {/* strategy object */}
}
```

**Features:**
- Creates new strategies if name doesn't exist
- Updates existing strategies if name matches
- Validates age bands:
  - First band must start at 0
  - No gaps or overlaps between bands
  - Last band must be open-ended (no max)

#### 2. Delete Strategy
```json
{
  "action": "delete",
  "id": "strategy_id"
}
```

**Protections:**
- Cannot delete "Default Strategy"
- Requires valid strategy ID

#### 3. Save Global Configuration
```json
{
  "action": "saveConfig",
  "configData": {
    "key": "tolerance_type",
    "value": "percent",
    "description": "Tolerance Type",
    "category": "tolerance"
  }
}
```

## UI Components

### Settings Page (`src/app/settings/page.jsx`)

Enhanced settings interface with sections:

1. **Global Settings** (Expandable)
   - Tolerance Type & Value (with individual save buttons)
   - Nudge Type & Value (with individual save buttons)
   - Rounding Mode (with save button)
   - Stale Days Threshold (with save button)

2. **Age Bands** (Expandable)
   - Add/remove bands
   - Edit band properties
   - Validation for proper band ranges

3. **Rating Bands** (Expandable)
   - Add/remove bands
   - Edit band properties
   - Flexible min/max values

**Features:**
- Collapsible sections for better UX
- Individual save buttons for each configuration item
- Success/error messages that auto-dismiss after 4 seconds
- Loading states during data fetches

### Strategy Page (`src/app/strategy/page.jsx`)

Updated to work with database-backed strategies:

- Load all strategies from database
- Create/edit strategies with tab-based interface
- Delete strategies (with protection for default)
- Success/error feedback with auto-dismissing messages

## Database Connection

### MongoDB Setup (`src/lib/mongodb.js`)

- Uses Mongoose for connection management
- Implements connection pooling and caching
- Requires `MONGODB_URI` environment variable

**Environment Variable:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database_name
```

## Features Implemented

### 1. Flexible Schema ✓
- Uses `Mixed` type for bands to allow changes without migrations
- Supports dynamic band structures
- Easy to add new configuration fields

### 2. Data Persistence ✓
- All strategies saved to MongoDB
- Global configurations stored separately
- Automatic timestamp tracking

### 3. User Feedback ✓
- Success messages when saving configurations
- Error messages for validation failures
- Auto-dismissing notifications (4 second timeout)
- Real-time form validation

### 4. Validation ✓
- Age band integrity checks (no gaps/overlaps)
- Required field validation
- Type validation for numeric fields
- Unique strategy name validation

### 5. Default Strategy ✓
- Automatically created on first load
- Protected from deletion
- Loads default config on app initialization

## Usage Examples

### Save a Strategy
```javascript
const response = await fetch("/api/config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "save",
    config: {
      name: "Premium Strategy",
      tolerance_type: "percent",
      tolerance_value: 5,
      // ... other fields
    }
  })
});
```

### Save a Configuration
```javascript
const response = await fetch("/api/config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "saveConfig",
    configData: {
      key: "tolerance_value",
      value: 2.5,
      description: "Tolerance Value",
      category: "tolerance"
    }
  })
});
```

### Load All Strategies
```javascript
const response = await fetch("/api/config");
const data = await response.json();
const strategies = data.data;
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common Errors:**
- `"First age band must start at 0"`
- `"Last age band must be open-ended (no maximum)"`
- `"Gap or overlap between bands"`
- `"Cannot delete default strategy"`
- `"Strategy not found"`

## Future Enhancements

1. **Bulk Operations**
   - Export/import strategies as JSON
   - Bulk band updates

2. **Version Control**
   - Track strategy changes over time
   - Rollback to previous versions

3. **User Management**
   - Track who created/modified each strategy
   - Audit logs

4. **Advanced Validation**
   - Cross-band validation
   - Matrix completeness checks
   - Formula validation

5. **Performance**
   - Caching strategies
   - Pagination for large datasets
   - Indexed queries
