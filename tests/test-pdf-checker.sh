#!/bin/bash

# Test script for check-for-new-pdf.js
# Runs against a local copy of the OSI page so results do not drift when the
# live site is updated, and so the suite works offline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CHECK_SCRIPT="$PROJECT_ROOT/.github/scripts/check-for-new-pdf.js"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"
PAGE_FIXTURE="$FIXTURES_DIR/osi-time-standards-page.html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Testing PDF Checker Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to run test
run_test() {
    local test_name="$1"
    local fixture_file="$2"
    local expected_exit_code="$3"

    echo -e "${BLUE}------------------------------------------------${NC}"
    echo -e "${BLUE}Test: $test_name${NC}"
    echo -e "${BLUE}Fixture: $(basename "$fixture_file")${NC}"
    echo -e "${BLUE}------------------------------------------------${NC}"

    # Run the script against the local page fixture and capture exit code
    set +e
    node "$CHECK_SCRIPT" "$fixture_file" "$PAGE_FIXTURE"
    actual_exit_code=$?
    set -e

    echo ""

    # Verify exit code
    if [ $actual_exit_code -eq $expected_exit_code ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Exit code: $actual_exit_code (expected: $expected_exit_code)"
    else
        echo -e "${RED}✗ FAILED${NC} - Exit code: $actual_exit_code (expected: $expected_exit_code)"
        exit 1
    fi

    echo ""
}

# Test 1: No changes (current version is up to date)
run_test "No changes - Current version up to date" \
    "$FIXTURES_DIR/current-version.json" \
    1

# Test 2: Newer year detected
run_test "Newer year detected (2024-2025 → 2025-2026)" \
    "$FIXTURES_DIR/old-version.json" \
    0

# Test 3: URL changed for same year
run_test "URL changed for same year (data correction)" \
    "$FIXTURES_DIR/url-changed.json" \
    0

# Test 4: An unreadable input is an error (exit 2), not a quiet "no change" (exit 1)
run_test "Unreadable input reports an error" \
    "$FIXTURES_DIR/does-not-exist.json" \
    2

# Summary
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}All tests passed!${NC}"
echo -e "${GREEN}================================================${NC}"
