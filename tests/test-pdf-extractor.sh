#!/bin/bash

# Test script for extract-pdf-with-pdfplumber.py
# Requires pdfplumber (pip install pdfplumber)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXTRACT_SCRIPT="$PROJECT_ROOT/.github/scripts/extract-pdf-with-pdfplumber.py"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"
OUTPUT_FILE="$SCRIPT_DIR/test-extract-output.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Testing PDF Extractor Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if ! python3 -c "import pdfplumber" 2>/dev/null; then
    echo -e "${RED}✗ pdfplumber is not installed (pip install pdfplumber)${NC}"
    exit 1
fi

# Runs the extractor on a fixture PDF and checks the exit code
run_extract() {
    local test_name="$1"
    local pdf_file="$2"
    local expected_exit_code="$3"

    echo -e "${BLUE}Test: $test_name${NC}"
    rm -f "$OUTPUT_FILE"

    set +e
    OUTPUT=$(python3 "$EXTRACT_SCRIPT" "file://$pdf_file" "Test Standards" "$OUTPUT_FILE" 2>&1)
    actual_exit_code=$?
    set -e

    if [ $actual_exit_code -ne $expected_exit_code ]; then
        echo "$OUTPUT"
        echo -e "${RED}✗ FAILED${NC} - Exit code: $actual_exit_code (expected: $expected_exit_code)"
        rm -f "$OUTPUT_FILE"
        exit 1
    fi
}

# Test 1: A PDF in the expected layout extracts and writes JSON
run_extract "Expected layout extracts" \
    "$FIXTURES_DIR/2024-2025-osi-time-standards-full_040221.pdf" \
    0
if [ -s "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Exit code 0, JSON written"
else
    echo -e "${RED}✗ FAILED${NC} - Exit code 0 but no JSON written"
    exit 1
fi
echo ""

# Test 2: A PDF in any other layout fails loudly and writes nothing
run_extract "Unexpected layout is rejected" \
    "$FIXTURES_DIR/not-time-standards.pdf" \
    1
if ! echo "$OUTPUT" | grep -q "Unexpected PDF format"; then
    echo "$OUTPUT"
    echo -e "${RED}✗ FAILED${NC} - Exit code 1 but not for an unexpected format"
    exit 1
elif [ -e "$OUTPUT_FILE" ]; then
    echo -e "${RED}✗ FAILED${NC} - JSON was written for an unexpected format"
    rm -f "$OUTPUT_FILE"
    exit 1
else
    echo -e "${GREEN}✓ PASSED${NC} - Exit code 1, unexpected format reported, no JSON written"
fi
echo ""

rm -f "$OUTPUT_FILE"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}All tests passed!${NC}"
echo -e "${GREEN}================================================${NC}"
