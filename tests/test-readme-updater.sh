#!/bin/bash

# Test suite for README inconsistencies updater
# Tests the sorting logic for age groups, genders, events, courses, and standards

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UPDATER_SCRIPT="$PROJECT_ROOT/.github/scripts/update-readme-inconsistencies.js"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

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

# Test 1: Age sorting - numeric order
test_age_numeric_sorting() {
  info "Test: Age groups sort numerically (not alphabetically)"

  # Create temp README
  cat > "$SCRIPT_DIR/test-readme-temp.md" <<'EOF'
## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event | Course | Standard | Value | Issue |
| ---------- | ----- | ------ | -------- | ----- | ----- |

\* *The OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections.*
EOF

  # Run updater with test fixture
  node "$UPDATER_SCRIPT" "$SCRIPT_DIR/test-readme-temp.md" "$FIXTURES_DIR/test-issues-sorting.json" >/dev/null 2>&1

  # Extract just the age numbers from the table
  AGES=$(grep "^| Girls\|^| Boys" "$SCRIPT_DIR/test-readme-temp.md" | grep -o "Girls [^|]*\|Boys [^|]*" | sed 's/Girls //' | sed 's/Boys //' | awk '{print $1}')

  # Expected order: 8, 9, 10, 10, 11, 12, 11-12, 13, 14, 14, 14, 13-14, 15
  # Note: 13-14 appears after 14 because ranges sort by END value (14),
  #       and single ages come before ranges at the same value
  EXPECTED="8
9
10
10
11
12
11-12
13
14
14
14
13-14
15"

  if [ "$AGES" = "$EXPECTED" ]; then
    pass "Ages sorted numerically (8, 9, 10, ..., 15)"
  else
    fail "Ages not in correct order"
    echo "Expected:"
    echo "$EXPECTED"
    echo "Got:"
    echo "$AGES"
  fi

  rm -f "$SCRIPT_DIR/test-readme-temp.md"
}

# Test 2: Range sorting - comes after singles
test_range_after_singles() {
  info "Test: Age ranges come after single ages (11, 12, 11-12)"

  cat > "$SCRIPT_DIR/test-readme-temp.md" <<'EOF'
## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event | Course | Standard | Value | Issue |
| ---------- | ----- | ------ | -------- | ----- | ----- |

\* *The OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections.*
EOF

  node "$UPDATER_SCRIPT" "$SCRIPT_DIR/test-readme-temp.md" "$FIXTURES_DIR/test-issues-sorting.json" >/dev/null 2>&1

  # Check that 11 and 12 appear before 11-12
  AGES_11_12=$(grep "^| Girls\|^| Boys" "$SCRIPT_DIR/test-readme-temp.md" | grep -o "Girls [^|]*\|Boys [^|]*" | sed 's/Girls //' | sed 's/Boys //' | awk '{print $1}' | grep -E "^11$|^12$|^11-12$")

  EXPECTED_11_12="11
12
11-12"

  if [ "$AGES_11_12" = "$EXPECTED_11_12" ]; then
    pass "Range 11-12 appears after singles 11 and 12"
  else
    fail "Range 11-12 not in correct position"
    echo "Expected: 11, 12, 11-12"
    echo "Got: $AGES_11_12"
  fi

  rm -f "$SCRIPT_DIR/test-readme-temp.md"
}

# Test 3: Gender sorting - Girls before Boys
test_gender_sorting() {
  info "Test: Girls appear before Boys for same age"

  cat > "$SCRIPT_DIR/test-readme-temp.md" <<'EOF'
## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event | Course | Standard | Value | Issue |
| ---------- | ----- | ------ | -------- | ----- | ----- |

\* *The OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections.*
EOF

  node "$UPDATER_SCRIPT" "$SCRIPT_DIR/test-readme-temp.md" "$FIXTURES_DIR/test-issues-sorting.json" >/dev/null 2>&1

  # Find age 14 entries and check Girls comes before Boys
  AGE_14_GENDERS=$(grep "^| Girls 14\|^| Boys 14" "$SCRIPT_DIR/test-readme-temp.md" | grep -o "^| Girls\|^| Boys" | sed 's/^| //')

  # First should be Girls, then Boys
  FIRST_GENDER=$(echo "$AGE_14_GENDERS" | head -1)
  LAST_GENDER=$(echo "$AGE_14_GENDERS" | tail -1)

  if [ "$FIRST_GENDER" = "Girls" ] && [ "$LAST_GENDER" = "Boys" ]; then
    pass "Girls 14 appears before Boys 14"
  else
    fail "Gender sorting incorrect for age 14"
  fi

  rm -f "$SCRIPT_DIR/test-readme-temp.md"
}

# Test 4: Course sorting - SCY, SCM, LCM order
test_course_sorting() {
  info "Test: Courses sort in order SCY, SCM, LCM"

  # Create test data with same age/gender/event but different courses
  cat > "$SCRIPT_DIR/test-courses.json" <<'EOF'
[
  {"age":"10","gender":"Girls","event":"100 Free","course":"LCM","standard":"A","value":"1:10.00⚠️","issue":"Invalid format"},
  {"age":"10","gender":"Girls","event":"100 Free","course":"SCY","standard":"A","value":"1:00.00⚠️","issue":"Invalid format"},
  {"age":"10","gender":"Girls","event":"100 Free","course":"SCM","standard":"A","value":"1:05.00⚠️","issue":"Invalid format"}
]
EOF

  cat > "$SCRIPT_DIR/test-readme-temp.md" <<'EOF'
## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event | Course | Standard | Value | Issue |
| ---------- | ----- | ------ | -------- | ----- | ----- |

\* *The OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections.*
EOF

  node "$UPDATER_SCRIPT" "$SCRIPT_DIR/test-readme-temp.md" "$SCRIPT_DIR/test-courses.json" >/dev/null 2>&1

  COURSES=$(grep "^| Girls 10" "$SCRIPT_DIR/test-readme-temp.md" | awk -F'|' '{print $4}' | awk '{$1=$1};1')

  EXPECTED_COURSES="SCY
SCM
LCM"

  if [ "$COURSES" = "$EXPECTED_COURSES" ]; then
    pass "Courses sorted in order SCY, SCM, LCM"
  else
    fail "Courses not in correct order"
  fi

  rm -f "$SCRIPT_DIR/test-readme-temp.md" "$SCRIPT_DIR/test-courses.json"
}

# Test 5: Standard sorting - A, B+, B order
test_standard_sorting() {
  info "Test: Standards sort in order A, B+, B"

  # Create test data with same age/gender/event/course but different standards
  cat > "$SCRIPT_DIR/test-standards.json" <<'EOF'
[
  {"age":"10","gender":"Girls","event":"100 Free","course":"SCY","standard":"B","value":"1:10.00⚠️","issue":"Invalid format"},
  {"age":"10","gender":"Girls","event":"100 Free","course":"SCY","standard":"B+","value":"1:05.00⚠️","issue":"Invalid format"},
  {"age":"10","gender":"Girls","event":"100 Free","course":"SCY","standard":"A","value":"1:00.00⚠️","issue":"Invalid format"}
]
EOF

  cat > "$SCRIPT_DIR/test-readme-temp.md" <<'EOF'
## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event | Course | Standard | Value | Issue |
| ---------- | ----- | ------ | -------- | ----- | ----- |

\* *The OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections.*
EOF

  node "$UPDATER_SCRIPT" "$SCRIPT_DIR/test-readme-temp.md" "$SCRIPT_DIR/test-standards.json" >/dev/null 2>&1

  STANDARDS=$(grep "^| Girls 10" "$SCRIPT_DIR/test-readme-temp.md" | awk -F'|' '{print $5}' | awk '{$1=$1};1')

  EXPECTED_STANDARDS="A
B+
B"

  if [ "$STANDARDS" = "$EXPECTED_STANDARDS" ]; then
    pass "Standards sorted in order A, B+, B"
  else
    fail "Standards not in correct order"
  fi

  rm -f "$SCRIPT_DIR/test-readme-temp.md" "$SCRIPT_DIR/test-standards.json"
}

# Main test runner
echo "========================================"
echo "README Updater Test Suite"
echo "========================================"
echo ""

test_age_numeric_sorting
test_range_after_singles
test_gender_sorting
test_course_sorting
test_standard_sorting

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
