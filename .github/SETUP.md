# PDF Extraction Workflow Setup

This document describes how to set up the automated PDF extraction workflow that uses Claude API to extract swim time standards from PDF files.

## Overview

The workflow automatically:
1. Checks daily for new OSI Time Standards PDFs
2. When detected, extracts data using Claude API
3. Validates the extracted data
4. Creates a pull request for review

## Prerequisites

- GitHub repository with Actions enabled
- Anthropic Claude Pro subscription (or API access)
- GitHub CLI (`gh`) configured in the repository

## Required Secrets

You need to configure one secret in your GitHub repository:

### `ANTHROPIC_API_KEY`

Your Anthropic API key for accessing Claude.

**To get your API key:**

1. Go to https://console.anthropic.com/
2. Sign in with your Anthropic account (Claude Pro subscription)
3. Navigate to "API Keys" section
4. Create a new API key or use an existing one
5. Copy the API key (it starts with `sk-ant-`)

**To add the secret to GitHub:**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Paste your API key
6. Click **Add secret**

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

### 2. PDF Extraction (`.github/scripts/extract-pdf-with-claude.js`)

Uses Claude API to:
- Download the PDF
- Extract time standards data
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
export ANTHROPIC_API_KEY="your-api-key-here"

node .github/scripts/extract-pdf-with-claude.js \
  "https://example.com/path/to/standards.pdf" \
  "2024-2025 OSI Time Standards" \
  "output.json"

# Then validate
bash .github/scripts/validate-all.sh output.json README.md
```

## Cost Considerations

**Claude API Usage:**
- Model: `claude-sonnet-4-5-20250929`
- Each extraction uses ~50K max tokens (output JSON is ~37K tokens)
- Cost depends on PDF size and complexity
- Typical cost per extraction: $1.00-$3.00

**Recommendations:**
- Keep daily checks enabled (doesn't use API unless changes detected)
- Review PRs promptly to avoid duplicate processing
- Monitor API usage in Anthropic Console

## Troubleshooting

### Workflow fails with "ANTHROPIC_API_KEY not found"

**Solution:** Verify the secret is configured correctly in GitHub Settings → Secrets and variables → Actions.

### Extraction produces invalid JSON

**Solution:**
1. Check the extracted JSON structure
2. Review Claude's output in workflow logs
3. May need to adjust prompt in `extract-pdf-with-claude.js`

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
│   ├── check-for-new-pdf.js         # Detects new PDFs
│   ├── extract-pdf-with-claude.js   # Claude API extraction
│   ├── validate-json-structure.js   # Structure validator
│   ├── validate-time-format.js      # Time format validator
│   ├── validate-time-progression.js # Progression validator
│   ├── validate-all.sh              # Runs all validators
│   ├── update-readme-inconsistencies.js # Updates README
│   └── process-new-pdf.sh           # Main orchestration
└── workflows/
    └── check-pdf.yml                # GitHub Actions workflow

tests/
├── test-validation.sh               # Validation test suite
└── test-pdf-checker.sh              # PDF checker tests
```

## Support

For issues with the workflow:
1. Check workflow logs in GitHub Actions
2. Review error messages from validation scripts
3. Open an issue in the repository

For Claude API issues:
- Check Anthropic Console: https://console.anthropic.com/
- Review API documentation: https://docs.anthropic.com/
