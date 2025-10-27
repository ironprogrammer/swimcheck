#!/bin/bash

# Test suite for validation scripts
# Tests the validation logic with sample data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATORS_DIR="$PROJECT_ROOT/.github/scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

# Create test JSON files
setup_test_data() {
  # Test 1: Valid data
  cat > "$SCRIPT_DIR/test-valid.json" <<'EOF'
{
  "title": "2024-2025 Test Standards",
  "sourceUrl": "https://example.com/test.pdf",
  "generatedOn": "2025-10-26",
  "ageGroups": [
    {
      "age": "10",
      "genders": {
        "Girls": {
          "events": [
            {
              "name": "50 Free",
              "SCY": { "A": "30.00", "B+": "31.00", "B": "32.00" },
              "SCM": { "A": "33.00", "B+": "34.00", "B": "35.00" },
              "LCM": { "A": null, "B+": null, "B": null }
            }
          ]
        },
        "Boys": {
          "events": [
            {
              "name": "50 Free",
              "SCY": { "A": "29.00", "B+": "30.00", "B": "31.00" },
              "SCM": { "A": "32.00", "B+": "33.00", "B": "34.00" },
              "LCM": { "A": null, "B+": null, "B": null }
            }
          ]
        }
      }
    }
  ]
}
EOF

  # Test 2: Invalid time format (invalid seconds)
  cat > "$SCRIPT_DIR/test-invalid-format.json" <<'EOF'
{
  "title": "2024-2025 Test Standards",
  "sourceUrl": "https://example.com/test.pdf",
  "generatedOn": "2025-10-26",
  "ageGroups": [
    {
      "age": "10",
      "genders": {
        "Girls": {
          "events": [
            {
              "name": "100 Free",
              "SCY": { "A": "1:96.00", "B+": "1:10.00", "B": "1:12.00" },
              "SCM": { "A": null, "B+": null, "B": null },
              "LCM": { "A": null, "B+": null, "B": null }
            }
          ]
        },
        "Boys": {
          "events": []
        }
      }
    }
  ]
}
EOF

  # Test 3: Invalid progression
  cat > "$SCRIPT_DIR/test-invalid-progression.json" <<'EOF'
{
  "title": "2024-2025 Test Standards",
  "sourceUrl": "https://example.com/test.pdf",
  "generatedOn": "2025-10-26",
  "ageGroups": [
    {
      "age": "10",
      "genders": {
        "Girls": {
          "events": [
            {
              "name": "50 Free",
              "SCY": { "A": "35.00", "B+": "31.00", "B": "32.00" },
              "SCM": { "A": null, "B+": null, "B": null },
              "LCM": { "A": null, "B+": null, "B": null }
            }
          ]
        },
        "Boys": {
          "events": []
        }
      }
    }
  ]
}
EOF

  # Test 4: Missing required fields
  cat > "$SCRIPT_DIR/test-missing-fields.json" <<'EOF'
{
  "title": "2024-2025 Test Standards",
  "ageGroups": []
}
EOF
}

cleanup_test_data() {
  rm -f "$SCRIPT_DIR/test-valid.json"
  rm -f "$SCRIPT_DIR/test-invalid-format.json"
  rm -f "$SCRIPT_DIR/test-invalid-progression.json"
  rm -f "$SCRIPT_DIR/test-missing-fields.json"
}

# Test 1: Structure validation - valid data
test_structure_valid() {
  info "Test: Structure validation with valid data"
  if node "$VALIDATORS_DIR/validate-json-structure.js" "$SCRIPT_DIR/test-valid.json" >/dev/null 2>&1; then
    pass "Valid structure accepted"
  else
    fail "Valid structure rejected"
  fi
}

# Test 2: Structure validation - missing fields
test_structure_invalid() {
  info "Test: Structure validation with missing fields"
  if node "$VALIDATORS_DIR/validate-json-structure.js" "$SCRIPT_DIR/test-missing-fields.json" >/dev/null 2>&1; then
    fail "Invalid structure accepted"
  else
    pass "Invalid structure rejected"
  fi
}

# Test 3: Time format validation - invalid seconds
test_time_format_invalid() {
  info "Test: Time format validation with invalid seconds"
  cp "$SCRIPT_DIR/test-invalid-format.json" "$SCRIPT_DIR/test-invalid-format-temp.json"

  OUTPUT=$(node "$VALIDATORS_DIR/validate-time-format.js" "$SCRIPT_DIR/test-invalid-format-temp.json" 2>&1)

  if echo "$OUTPUT" | grep -q "Invalid format"; then
    pass "Invalid time format detected"
  else
    fail "Invalid time format not detected"
  fi

  # Check if warning emoji was added
  if grep -q "1:96.00⚠️" "$SCRIPT_DIR/test-invalid-format-temp.json"; then
    pass "Warning emoji added to invalid time"
  else
    fail "Warning emoji not added to invalid time"
  fi

  rm -f "$SCRIPT_DIR/test-invalid-format-temp.json"
}

# Test 4: Time format validation - valid times
test_time_format_valid() {
  info "Test: Time format validation with valid times"
  cp "$SCRIPT_DIR/test-valid.json" "$SCRIPT_DIR/test-valid-temp.json"

  OUTPUT=$(node "$VALIDATORS_DIR/validate-time-format.js" "$SCRIPT_DIR/test-valid-temp.json" 2>&1)

  if echo "$OUTPUT" | grep -q "All times have valid format"; then
    pass "Valid times accepted"
  else
    fail "Valid times rejected"
  fi

  rm -f "$SCRIPT_DIR/test-valid-temp.json"
}

# Test 5: Progression validation - invalid progression
test_progression_invalid() {
  info "Test: Progression validation with invalid progression"
  cp "$SCRIPT_DIR/test-invalid-progression.json" "$SCRIPT_DIR/test-invalid-progression-temp.json"

  OUTPUT=$(node "$VALIDATORS_DIR/validate-time-progression.js" "$SCRIPT_DIR/test-invalid-progression-temp.json" 2>&1)

  if echo "$OUTPUT" | grep -q "Invalid progression"; then
    pass "Invalid progression detected"
  else
    fail "Invalid progression not detected"
  fi

  # Check if warning emoji was added
  if grep -q "⚠️" "$SCRIPT_DIR/test-invalid-progression-temp.json"; then
    pass "Warning emoji added to progression issue"
  else
    fail "Warning emoji not added to progression issue"
  fi

  rm -f "$SCRIPT_DIR/test-invalid-progression-temp.json"
}

# Test 6: Progression validation - valid progression
test_progression_valid() {
  info "Test: Progression validation with valid progression"
  cp "$SCRIPT_DIR/test-valid.json" "$SCRIPT_DIR/test-valid-temp.json"

  OUTPUT=$(node "$VALIDATORS_DIR/validate-time-progression.js" "$SCRIPT_DIR/test-valid-temp.json" 2>&1)

  if echo "$OUTPUT" | grep -q "All time progressions are valid"; then
    pass "Valid progression accepted"
  else
    fail "Valid progression rejected"
  fi

  rm -f "$SCRIPT_DIR/test-valid-temp.json"
}

# Main test runner
echo "========================================"
echo "Validation Scripts Test Suite"
echo "========================================"
echo ""

setup_test_data

test_structure_valid
test_structure_invalid
test_time_format_invalid
test_time_format_valid
test_progression_invalid
test_progression_valid

cleanup_test_data

echo ""
echo "========================================"
echo "Test Results"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed${NC}"
  exit 1
fi
