# PDF Extraction Workflow Setup

This document describes how to set up the automated PDF extraction workflow that uses pdfplumber to extract swim time standards from PDF files.

## Overview

The workflow automatically:
1. Checks daily for new OSI Time Standards PDFs
2. When detected, extracts data using pdfplumber
3. Validates the extracted data
4. Creates a pull request for review

## Prerequisites

- GitHub repository with Actions enabled
- GitHub CLI (`gh`) configured in the repository
- Python 3.x with pdfplumber library (automatically installed in workflow)

## Required Repository Settings

For the workflow to create pull requests, you must enable the following setting:

1. Go to: **Settings → Actions → General → Workflow permissions**
2. Enable: **"Allow GitHub Actions to create and approve pull requests"**

This allows the workflow's `GH_TOKEN` to create PRs when new PDFs are detected.

## Workflow Configuration

The workflow is configured in `.github/workflows/check-pdf.yml` and runs:
- **Daily at 9 AM Pacific Time (5 PM UTC)**
- **Manually via workflow_dispatch**

### Manual Trigger

To manually trigger the workflow:

1. Go to **Actions** tab in your GitHub repository
2. Select "Check for New OSI Time Standards PDF" workflow
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Click **Run workflow**

## How It Works

### 1. PDF Detection (`.github/scripts/check-for-new-pdf.js`)

Checks the OSI website for:
- Newer year ranges (e.g., 2025-2026)
- URL changes for the same year (data corrections)

If changes detected, outputs `PDF_URL` and `LINK_TEXT` for next steps.

### 2. PDF Extraction (`.github/scripts/extract-pdf-with-pdfplumber.py`)

Uses pdfplumber library to:
- Download the PDF
- Extract table data from each page
- Parse time standards data
- Convert to JSON matching `swim_time_standards.json` structure

### 3. Validation (`.github/scripts/validate-all.sh`)

Runs three validators:
- **Structure**: Verifies required fields and hierarchy
- **Time Format**: Checks MM:SS.MS or SS.MS format, flags invalid seconds (e.g., 96)
- **Time Progression**: Ensures A < B+ < B (faster to slower)

Any issues are flagged with ⚠️ emoji in the JSON.

### 4. README Update (`.github/scripts/update-readme-inconsistencies.js`)

Updates the "Data Inconsistencies" section in README.md with any flagged issues.

### 5. PR Creation (`.github/scripts/process-new-pdf.sh`)

Creates a feature branch and pull request with:
- Updated `swim_time_standards.json`
- Updated `README.md` (if inconsistencies found)
- Detailed description of changes

## Testing

### Test Validation Scripts

Run the test suite to verify validation logic:

```bash
./tests/test-validation.sh
```

### Test PDF Extraction Locally

To test extraction with a PDF URL:

```bash
# Install pdfplumber if not already installed
pip install pdfplumber

# Run extraction
python3 .github/scripts/extract-pdf-with-pdfplumber.py \
  "https://example.com/path/to/standards.pdf" \
  "2024-2025 OSI Time Standards" \
  "output.json"

# Then validate
bash .github/scripts/validate-all.sh output.json README.md
```

## Cost Considerations

**pdfplumber Extraction:**
- No API costs - completely free
- Runs locally in GitHub Actions
- Fast execution (typically under 10 seconds)

**Recommendations:**
- Keep daily checks enabled (only processes when changes detected)
- Review PRs promptly to avoid duplicate processing

## Troubleshooting

### Workflow fails with "pdfplumber not found" or import error

**Solution:** This should not happen as pdfplumber is installed in the workflow. Check that the `pip install pdfplumber` step completed successfully in the workflow logs.

### Extraction produces invalid JSON

**Solution:**
1. Check the extracted JSON structure
2. Review pdfplumber's output in workflow logs
3. The PDF structure may have changed - may need to adjust parsing logic in `extract-pdf-with-pdfplumber.py`

### Validation flags too many issues

**Solution:**
1. Review the PDF source data - it may have legitimate errors
2. Check validation logic in `.github/scripts/validate-*.js`
3. Issues are flagged but data is still committed for your review

### PR creation fails

**Solution:**
1. Ensure `gh` CLI is working in GitHub Actions
2. Verify repository permissions for GitHub Actions
3. Check if a PR already exists for that branch

## File Structure

```
.github/
├── scripts/
│   ├── check-for-new-pdf.js              # Detects new PDFs
│   ├── extract-pdf-with-pdfplumber.py    # pdfplumber extraction
│   ├── validate-json-structure.js        # Structure validator
│   ├── validate-time-format.js           # Time format validator
│   ├── validate-time-progression.js      # Progression validator
│   ├── validate-all.sh                   # Runs all validators
│   ├── update-readme-inconsistencies.js  # Updates README
│   └── process-new-pdf.sh                # Main orchestration
└── workflows/
    └── check-pdf.yml                     # GitHub Actions workflow

tests/
├── test-validation.sh                    # Validation test suite
└── test-pdf-checker.sh                   # PDF checker tests
```

## Support

For issues with the workflow:
1. Check workflow logs in GitHub Actions
2. Review error messages from validation scripts
3. Open an issue in the repository

For pdfplumber library issues:
- Check pdfplumber documentation: https://github.com/jsvine/pdfplumber
- Review Python error messages in workflow logs
