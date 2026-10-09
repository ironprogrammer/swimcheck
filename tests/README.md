# Tests

## Running Tests

```bash
./tests/test-pdf-checker.sh
./tests/test-validation.sh
./tests/test-readme-updater.sh
./tests/test-pdf-extractor.sh   # requires Python and pdfplumber
```

All four run offline. The first three need only Node.

## Test Fixtures

`fixtures/osi-time-standards-page.html` is a trimmed copy of the OSI Time
Standards page, used in place of the live site. `fixtures/osi-page-no-links.html`
is a page with no OSI links (expects an error).

Minimal JSON fixtures in `fixtures/` test different scenarios against it:
- `current-version.json` - Up-to-date version (expects no changes)
- `old-version.json` - Older year (expects newer year detection)
- `url-changed.json` - Same year, different URL (expects data correction detection)
- `test-issues-sorting.json` - Inconsistency list covering the README table's sort order

PDF fixtures for the extractor:
- `2024-2025-osi-time-standards-full_040221.pdf` - PDF in the expected layout (expects extraction)
- `not-time-standards.pdf` - PDF with no standards tables (expects an unexpected-format error)
