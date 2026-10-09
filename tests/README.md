# Tests

## Running Tests

```bash
./tests/test-pdf-checker.sh
./tests/test-validation.sh
./tests/test-readme-updater.sh
```

All three run offline and need no setup beyond Node.

## Test Fixtures

`fixtures/osi-time-standards-page.html` is a trimmed copy of the OSI Time
Standards page, used in place of the live site. `fixtures/osi-page-no-links.html`
is a page with no OSI links (expects an error).

Minimal JSON fixtures in `fixtures/` test different scenarios against it:
- `current-version.json` - Up-to-date version (expects no changes)
- `old-version.json` - Older year (expects newer year detection)
- `url-changed.json` - Same year, different URL (expects data correction detection)
- `test-issues-sorting.json` - Inconsistency list covering the README table's sort order
