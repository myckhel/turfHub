# Stage Promotion API - Postman Collection Updates

## Summary of Changes

The promotion rule functionality has been separated from Stage management into a standalone StagePromotion model with its own API endpoints. This document outlines the necessary updates to the Postman collection.

## Backend Changes Completed

### 1. New Files Created
- `app/Http/Requests/Tournament/CreateStagePromotionRequest.php`
- `app/Http/Requests/Tournament/UpdateStagePromotionRequest.php`
- `app/Http/Controllers/Api/StagePromotionController.php`
- `app/Http/Resources/StagePromotionResource.php`

### 2. Updated Files
- `app/Http/Requests/Tournament/CreateStageRequest.php` - Removed promotion_rule and next_stage_id validation
- `app/Services/StageService.php` - Removed next_stage_id handling
- `routes/api.php` - Added 4 new StagePromotion routes

### 3. New API Routes
```
GET    /api/stages/{stage}/promotion         - Get promotion rule
POST   /api/stages/{stage}/promotion         - Create promotion rule
PATCH  /api/stages/{stage}/promotion         - Update promotion rule  
DELETE /api/stages/{stage}/promotion         - Delete promotion rule
```

## Postman Collection Updates Required

### Step 1: Remove Promotion Fields from Stage Creation Endpoints

Remove these fields from ALL stage creation endpoints (League, Group, Knockout, Swiss):

```json
{
  "key": "next_stage_id",
  "value": "",
  "description": "...",
  "type": "text",
  "disabled": true
},
{
  "key": "promotion_rule[rule_type]",
  "value": "",
  "description": "...",
  "type": "text",
  "disabled": true
},
{
  "key": "promotion_rule[rule_config][n]",
  "value": "",
  "description": "...",
  "type": "text",
  "disabled": true
},
{
  "key": "promotion_rule[rule_config][threshold]",
  "value": "",
  "description": "...",
  "type": "text",
  "disabled": true
}
```

### Step 2: Update Stage Endpoint Descriptions

Replace the **Optional Promotion** section in all stage creation descriptions with:

```
**Note:** Promotion rules are now managed separately via the Stage Promotion endpoints. After creating a stage, use POST /api/stages/{stage}/promotion to configure promotion rules.
```

New description template:
```
Create a [stage-type] stage.

**Required Fields:**
- name: Stage name (max 255 chars)
- stage_type: league, group, knockout, swiss, king_of_hill, custom
- order: Stage order in tournament (integer, min:1)

**Optional Settings:**
- settings[match_duration]: Match duration in minutes (integer, 1-120)
- settings[match_interval]: Minutes between matches (integer, 0-60)
- settings[rounds]: Number of rounds (integer, min:1)
- settings[groups_count]: Number of groups (integer, 2-8, for group stage)
- settings[teams_per_group]: Teams per group (integer, min:2, for group stage)

**Note:** Promotion rules are now managed separately via the Stage Promotion endpoints.
```

### Step 3: Remove Promotion Fields from Update Stage Endpoint

Remove these fields from the Update Stage endpoint:
- next_stage_id
- All promotion_rule fields

Update the description to:
```
Update stage details. All fields are optional.

**Updatable Fields:**
- name: Stage name (max 255 chars)
- order: Stage order in tournament (integer, min:1)
- stage_type: league, group, knockout, swiss, king_of_hill, custom
- settings[match_duration]: Match duration in minutes (integer, 1-120)
- settings[match_interval]: Minutes between matches (integer, 0-60)
- settings[rounds]: Number of rounds (integer, min:1)
- settings[groups_count]: Number of groups (integer, 2-8)
- settings[teams_per_group]: Teams per group (integer, min:2)
- status: Stage status

**Note:** Promotion rules are managed via separate Stage Promotion endpoints.
```

### Step 4: Add New Stage Promotion Endpoints

Add a new subfolder under "Stages" called "Stage Promotion" with these 4 endpoints:

#### 4.1 Get Stage Promotion

```json
{
  "name": "Get Stage Promotion",
  "request": {
    "auth": {
      "type": "bearer",
      "bearer": [
        {"key": "token", "value": "{{auth_token}}", "type": "string"}
      ]
    },
    "method": "GET",
    "url": {
      "raw": "{{base_url}}/api/stages/{{test_stage_id}}/promotion",
      "host": ["{{base_url}}"],
      "path": ["api", "stages", "{{test_stage_id}}", "promotion"]
    },
    "description": "Get the promotion rule configured for a stage.\n\n**Returns:**\n- id: Promotion rule ID\n- stage_id: Source stage ID\n- next_stage_id: Destination stage ID\n- rule_type: top_n, top_per_group, points_threshold, custom\n- rule_config: Configuration object\n- next_stage: Next stage details (when included)\n\n**Status Codes:**\n- 200: Promotion rule found\n- 404: No promotion rule configured"
  }
}
```

#### 4.2 Create Stage Promotion

```json
{
  "name": "Create Stage Promotion",
  "request": {
    "auth": {
      "type": "bearer",
      "bearer": [
        {"key": "token", "value": "{{auth_token}}", "type": "string"}
      ]
    },
    "method": "POST",
    "body": {
      "mode": "urlencoded",
      "urlencoded": [
        {
          "key": "next_stage_id",
          "value": "{{next_stage_id}}",
          "description": "ID of the next stage (required, must exist)",
          "type": "text"
        },
        {
          "key": "rule_type",
          "value": "top_n",
          "description": "Promotion rule type: top_n, top_per_group, points_threshold, custom (required)",
          "type": "text"
        },
        {
          "key": "rule_config[n]",
          "value": "8",
          "description": "Number of teams to promote (required for top_n, top_per_group)",
          "type": "text"
        },
        {
          "key": "rule_config[threshold]",
          "value": "",
          "description": "Points threshold (required for points_threshold)",
          "type": "text",
          "disabled": true
        }
      ]
    },
    "url": {
      "raw": "{{base_url}}/api/stages/{{test_stage_id}}/promotion",
      "host": ["{{base_url}}"],
      "path": ["api", "stages", "{{test_stage_id}}", "promotion"]
    },
    "description": "Create a promotion rule for a stage.\n\n**Required Fields:**\n- next_stage_id: ID of the destination stage (must exist)\n- rule_type: top_n, top_per_group, points_threshold, custom\n- rule_config: Configuration object\n\n**Rule Types:**\n- **top_n**: Promote top N teams overall\n  - Requires: rule_config[n] (integer, min:1)\n  - Example: Top 8 teams advance\n\n- **top_per_group**: Promote top N teams from each group\n  - Requires: rule_config[n] (integer, min:1)\n  - Example: Top 2 from each group\n\n- **points_threshold**: Promote teams meeting points requirement\n  - Requires: rule_config[threshold] (integer, min:1)\n  - Example: All teams with 10+ points\n\n- **custom**: Custom promotion logic\n  - Requires: rule_config as needed\n\n**Status Codes:**\n- 201: Promotion rule created\n- 409: Promotion rule already exists (use PATCH to update)\n- 422: Validation error"
  }
}
```

#### 4.3 Update Stage Promotion

```json
{
  "name": "Update Stage Promotion",
  "request": {
    "auth": {
      "type": "bearer",
      "bearer": [
        {"key": "token", "value": "{{auth_token}}", "type": "string"}
      ]
    },
    "method": "PATCH",
    "body": {
      "mode": "urlencoded",
      "urlencoded": [
        {
          "key": "next_stage_id",
          "value": "{{next_stage_id}}",
          "description": "ID of the next stage (optional)",
          "type": "text",
          "disabled": true
        },
        {
          "key": "rule_type",
          "value": "top_per_group",
          "description": "Promotion rule type (optional): top_n, top_per_group, points_threshold, custom",
          "type": "text"
        },
        {
          "key": "rule_config[n]",
          "value": "2",
          "description": "Number of teams to promote (required if changing to top_n or top_per_group)",
          "type": "text"
        }
      ]
    },
    "url": {
      "raw": "{{base_url}}/api/stages/{{test_stage_id}}/promotion",
      "host": ["{{base_url}}"],
      "path": ["api", "stages", "{{test_stage_id}}", "promotion"]
    },
    "description": "Update an existing promotion rule. All fields are optional.\n\n**Updatable Fields:**\n- next_stage_id: Change destination stage\n- rule_type: Change promotion rule type\n- rule_config: Update configuration\n\n**Note:** Only provide fields you want to update.\n\n**Status Codes:**\n- 200: Promotion rule updated\n- 404: No promotion rule found (use POST to create)\n- 422: Validation error"
  }
}
```

#### 4.4 Delete Stage Promotion

```json
{
  "name": "Delete Stage Promotion",
  "request": {
    "auth": {
      "type": "bearer",
      "bearer": [
        {"key": "token", "value": "{{auth_token}}", "type": "string"}
      ]
    },
    "method": "DELETE",
    "url": {
      "raw": "{{base_url}}/api/stages/{{test_stage_id}}/promotion",
      "host": ["{{base_url}}"],
      "path": ["api", "stages", "{{test_stage_id}}", "promotion"]
    },
    "description": "Delete the promotion rule for a stage.\n\n**Status Codes:**\n- 200: Promotion rule deleted\n- 404: No promotion rule found"
  }
}
```

## Testing Workflow

1. Create a tournament
2. Create stage 1 (e.g., Group Stage)
3. Create stage 2 (e.g., Knockout)  
4. Create promotion rule for stage 1 pointing to stage 2
5. Assign teams to stage 1
6. Complete fixtures in stage 1
7. Simulate promotion
8. Execute promotion

## Migration Notes

- Existing stages with promotion data will need migration
- The `next_stage_id` column may still exist in the `stages` table for backward compatibility but should not be used via the API
- All promotion logic now goes through the `stage_promotions` table

## Postman Collection Update Status

✅ **Completed** - All changes have been applied to the Postman collection using the automated script:

- Removed `next_stage_id` and all `promotion_rule` fields from:
  - Create Stage - League
  - Create Stage - Group
  - Create Stage - Knockout
  - Create Stage - Swiss System
  - Update Stage
  
- Updated all Stage endpoint descriptions to mention separate promotion management

- Added new "Stage Promotion" subfolder with 5 endpoints:
  - GET /api/stage-promotions (List all promotions)
  - GET /api/stages/{stage}/promotion (Get stage promotion)
  - POST /api/stages/{stage}/promotion (Create promotion)
  - PATCH /api/stages/{stage}/promotion (Update promotion)
  - DELETE /api/stages/{stage}/promotion (Delete promotion)

The collection is now fully synchronized with the backend implementation.
