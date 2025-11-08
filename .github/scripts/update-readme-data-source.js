#!/usr/bin/env node

/**
 * Updates the README.md "Data Source" section with current time standards info
 * - Uses HTML comment markers to identify auto-generated content
 * - Only replaces content between <!-- AUTO-GENERATED-CURRENT-STANDARDS:START --> and END markers
 * - Leaves manually maintained content untouched
 *
 * Usage:
 *   update-readme-data-source.js <readme-path> <title> [sourceUrl]
 *
 * Arguments:
 *   readme-path: Path to README.md file
 *   title:       Title of the time standards (e.g., "2025-2026 OSI Time Standards A/B+/B")
 *   sourceUrl:   Optional URL to the source PDF for hyperlinking the title
 */

const fs = require('fs');
const path = require('path');

/**
 * Create the current standards line content
 */
function createCurrentStandardsLine(title, sourceUrl) {
  if (sourceUrl) {
    return `**Current standards:** [${title}](${sourceUrl})`;
  } else {
    return `**Current standards:** ${title}`;
  }
}

/**
 * Update README Data Source section using HTML comment markers
 */
function updateReadmeDataSource(readmePath, title, sourceUrl) {
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Look for the HTML comment markers
  const markerRegex = /<!-- AUTO-GENERATED-CURRENT-STANDARDS:START -->\n([\s\S]*?)\n<!-- AUTO-GENERATED-CURRENT-STANDARDS:END -->/;

  const match = readmeContent.match(markerRegex);
  if (!match) {
    throw new Error(
      'Could not find AUTO-GENERATED-CURRENT-STANDARDS markers in README.md.\n' +
      'Please add the following markers around the "Current standards" line:\n' +
      '<!-- AUTO-GENERATED-CURRENT-STANDARDS:START -->\n' +
      '**Current standards:** ...\n' +
      '<!-- AUTO-GENERATED-CURRENT-STANDARDS:END -->'
    );
  }

  // Create the new current standards line
  const newContent = createCurrentStandardsLine(title, sourceUrl);

  // Replace only the content between the markers
  const newReadme = readmeContent.replace(
    markerRegex,
    `<!-- AUTO-GENERATED-CURRENT-STANDARDS:START -->\n${newContent}\n<!-- AUTO-GENERATED-CURRENT-STANDARDS:END -->`
  );

  // Write back to file
  fs.writeFileSync(readmePath, newReadme, 'utf8');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: update-readme-data-source.js <readme-path> <title> [sourceUrl]');
    console.error('');
    console.error('  readme-path: Path to README.md file');
    console.error('  title:       Title of the time standards');
    console.error('  sourceUrl:   Optional source URL to hyperlink the title');
    process.exit(1);
  }

  const readmePath = path.resolve(args[0]);
  const title = args[1];
  const sourceUrl = args[2] || null;

  if (!title) {
    console.error('Error: Title is required');
    process.exit(1);
  }

  try {
    updateReadmeDataSource(readmePath, title, sourceUrl);

    if (sourceUrl) {
      console.log(`✓ Updated Data Source section with hyperlinked title: ${title}`);
    } else {
      console.log(`✓ Updated Data Source section with: ${title}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for testing
if (require.main === module) {
  main();
} else {
  module.exports = { updateReadmeDataSource, createCurrentStandardsLine };
}
