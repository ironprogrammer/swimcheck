# Tests

## Running Tests

```bash
./tests/test-pdf-checker.sh
```

## Test Fixtures

Minimal JSON fixtures in `fixtures/` test different scenarios:
- `current-version.json` - Up-to-date version (expects no changes)
- `old-version.json` - Older year (expects newer year detection)
- `url-changed.json` - Same year, different URL (expects data correction detection)
