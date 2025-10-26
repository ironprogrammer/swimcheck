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
FORMAT_ISSUES=$(echo "$FORMAT_OUTPUT" | grep "JSON_ISSUES=" | sed 's/JSON_ISSUES=//' || echo "[]")
echo ""

# 3. Validate time progressions (modifies JSON, adds ⚠️ to progression issues)
echo "Step 3: Validating time progressions..."
PROGRESSION_OUTPUT=$(node "$SCRIPT_DIR/validate-time-progression.js" "$JSON_FILE")
echo "$PROGRESSION_OUTPUT"

# Extract JSON issues from output
PROGRESSION_ISSUES=$(echo "$PROGRESSION_OUTPUT" | grep "JSON_ISSUES=" | sed 's/JSON_ISSUES=//' || echo "[]")
echo ""

# 4. Combine all issues and update README
echo "Step 4: Updating README with inconsistencies..."

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
