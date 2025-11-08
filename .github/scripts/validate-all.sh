#!/bin/bash

# Runs all validation scripts in sequence
# Usage: validate-all.sh <json-file> <readme-path>

set -e  # Exit on error

if [ $# -lt 2 ]; then
  echo "Usage: validate-all.sh <json-file> <readme-path>"
  exit 1
fi

JSON_FILE="$1"
README_PATH="$2"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "Running Validation Suite"
echo "========================================"
echo "JSON file: $JSON_FILE"
echo "README: $README_PATH"
echo ""

# 1. Validate structure (doesn't modify JSON)
echo "Step 1: Validating JSON structure..."
node "$SCRIPT_DIR/validate-json-structure.js" "$JSON_FILE"
echo ""

# 2. Validate time formats (modifies JSON, adds ⚠️ to invalid times)
echo "Step 2: Validating time formats..."
FORMAT_OUTPUT=$(node "$SCRIPT_DIR/validate-time-format.js" "$JSON_FILE")
echo "$FORMAT_OUTPUT"

# Extract JSON issues from output
FORMAT_ISSUES=$(echo "$FORMAT_OUTPUT" | grep "JSON_ISSUES=" | sed 's/JSON_ISSUES=//')
if [ -z "$FORMAT_ISSUES" ]; then
  FORMAT_ISSUES="[]"
fi
echo ""

# 3. Validate time progressions (modifies JSON, adds ⚠️ to progression issues)
echo "Step 3: Validating time progressions..."
PROGRESSION_OUTPUT=$(node "$SCRIPT_DIR/validate-time-progression.js" "$JSON_FILE")
echo "$PROGRESSION_OUTPUT"

# Extract JSON issues from output
PROGRESSION_ISSUES=$(echo "$PROGRESSION_OUTPUT" | grep "JSON_ISSUES=" | sed 's/JSON_ISSUES=//')
if [ -z "$PROGRESSION_ISSUES" ]; then
  PROGRESSION_ISSUES="[]"
fi
echo ""

# 4. Extract title and sourceUrl from JSON
echo "Step 4: Extracting title and sourceUrl from JSON..."
JSON_METADATA=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$JSON_FILE', 'utf8'));
console.log(JSON.stringify({ title: data.title || '', sourceUrl: data.sourceUrl || '' }));
")
TITLE=$(echo "$JSON_METADATA" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log(data.title);")
SOURCE_URL=$(echo "$JSON_METADATA" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log(data.sourceUrl);")
echo "Title: $TITLE"
echo "Source URL: $SOURCE_URL"
echo ""

# 5. Update README Data Source section
echo "Step 5: Updating README Data Source section..."
node "$SCRIPT_DIR/update-readme-data-source.js" "$README_PATH" "$TITLE" "$SOURCE_URL"
echo ""

# 6. Combine all issues and update README inconsistencies
echo "Step 6: Updating README inconsistencies table..."

# Merge the two issue arrays using Node.js
COMBINED_ISSUES=$(node -e "
const format = $FORMAT_ISSUES;
const progression = $PROGRESSION_ISSUES;
const combined = [...format, ...progression];
console.log(JSON.stringify(combined));
")

node "$SCRIPT_DIR/update-readme-inconsistencies.js" "$README_PATH" "$COMBINED_ISSUES"
echo ""

echo "========================================"
echo "Validation Complete"
echo "========================================"
