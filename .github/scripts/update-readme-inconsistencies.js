#!/usr/bin/env node

/**
 * Updates the README.md "Data Inconsistencies" section with current issues
 * - Uses HTML comment markers to identify auto-generated content
 * - Only replaces content between <!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:START --> and END markers
 * - Leaves manually maintained intro paragraph and Issue Key untouched
 * - Takes issues from validation scripts (via JSON input)
 * - Only shows issues from the most recent validation run
 *
 * Usage:
 *   update-readme-inconsistencies.js <readme-path> <issues-json>
 *
 * Issues JSON format:
 *   [
 *     {
 *       "age": "Girls 9",
 *       "gender": "Girls",
 *       "event": "100 Breast",
 *       "course": "LCM",
 *       "standard": "A",
 *       "value": "1:96.99⚠️",
 *       "issue": "Invalid format"
 *     },
 *     ...
 *   ]
 */

const fs = require('fs');
const path = require('path');

/**
 * Format age/gender for display
 */
function formatAgeGender(age, gender) {
  return `${gender} ${age}`;
}

/**
 * Extract numeric value from age string for sorting
 * Examples: "9" -> 9, "8 & Under" -> 8, "11-12" -> 11, "15 & Over*" -> 15
 */
function getAgeNumericValue(age) {
  const match = age.match(/(\d+)/);
  return match ? parseInt(match[1]) : 999;
}

/**
 * Check if age is a range (contains hyphen)
 * Ranges should sort after single ages with the same starting number
 */
function isAgeRange(age) {
  return age.includes('-');
}

/**
 * Get the ending number for a range, or the starting number for non-ranges
 * Used as secondary sort key to properly order: 11, 12, 11-12
 */
function getAgeEndValue(age) {
  if (isAgeRange(age)) {
    const matches = age.match(/(\d+)-(\d+)/);
    return matches ? parseInt(matches[2]) : 999;
  }
  return getAgeNumericValue(age);
}

/**
 * Get sort order for course (SCY, SCM, LCM)
 */
function getCourseSortOrder(course) {
  const courseOrder = ['SCY', 'SCM', 'LCM'];
  const index = courseOrder.indexOf(course);
  return index === -1 ? 999 : index;
}

/**
 * Get sort order for standards (A, B+, B)
 */
function getStandardSortOrder(standard) {
  const standardOrder = ['A', 'B+', 'B'];
  const index = standardOrder.indexOf(standard);
  return index === -1 ? 999 : index;
}

/**
 * Generate markdown table from issues
 */
function generateTable(issues) {
  if (issues.length === 0) {
    return '*(No inconsistencies found in current data)*';
  }

  // Sort issues by age (numeric), gender (Girls before Boys), event, course, standard
  const sortedIssues = issues.sort((a, b) => {
    // For ranges, sort by end value; for singles, sort by start value
    // This ensures: 11, 12, 11-12 (not 11, 11-12, 12)
    const aSortValue = isAgeRange(a.age) ? getAgeEndValue(a.age) : getAgeNumericValue(a.age);
    const bSortValue = isAgeRange(b.age) ? getAgeEndValue(b.age) : getAgeNumericValue(b.age);
    const ageCompare = aSortValue - bSortValue;
    if (ageCompare !== 0) return ageCompare;

    // If ages have same sort value, single ages come before ranges
    // Example: 12 (single) comes before 11-12 (range, also sorts at 12)
    if (isAgeRange(a.age) !== isAgeRange(b.age)) {
      return isAgeRange(a.age) ? 1 : -1;
    }

    // Sort by gender (Girls before Boys)
    if (a.gender !== b.gender) {
      return a.gender === 'Girls' ? -1 : 1;
    }

    // Sort by event name
    if (a.event !== b.event) return a.event.localeCompare(b.event);

    // Sort by course (SCY, SCM, LCM)
    const courseCompare = getCourseSortOrder(a.course) - getCourseSortOrder(b.course);
    if (courseCompare !== 0) return courseCompare;

    // Sort by standard (A, B+, B)
    return getStandardSortOrder(a.standard) - getStandardSortOrder(b.standard);
  });

  const lines = [];
  lines.push('| Age/Gender | Event      | Course | Standard | Value       | Issue              |');
  lines.push('| ---------- | ---------- | ------ | -------- | ----------- | ------------------- |');

  sortedIssues.forEach(issue => {
    const ageGender = formatAgeGender(issue.age, issue.gender);
    const event = issue.event;
    const course = issue.course;
    const standard = issue.standard;
    const value = `\`${issue.value}\``;
    const issueDesc = issue.issue;

    lines.push(`| ${ageGender} | ${event} | ${course} | ${standard} | ${value} | ${issueDesc} |`);
  });

  return lines.join('\n');
}

/**
 * Update README with new inconsistencies table using HTML comment markers
 */
function updateReadme(readmePath, issues) {
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Look for the HTML comment markers
  const markerRegex = /<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:START -->\n([\s\S]*?)\n<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:END -->/;

  const match = readmeContent.match(markerRegex);
  if (!match) {
    throw new Error(
      'Could not find AUTO-GENERATED-INCONSISTENCIES-TABLE markers in README.md.\n' +
      'Please add the following markers around the inconsistencies table:\n' +
      '<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:START -->\n' +
      '<table content here>\n' +
      '<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:END -->'
    );
  }

  // Generate new table
  const newTable = generateTable(issues);

  // Replace only the content between the markers
  const newReadme = readmeContent.replace(
    markerRegex,
    `<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:START -->\n${newTable}\n<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:END -->`
  );

  // Write back to file
  fs.writeFileSync(readmePath, newReadme, 'utf8');

  return issues.length;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: update-readme-inconsistencies.js <readme-path> <issues-json>');
    console.error('');
    console.error('  readme-path: Path to README.md file');
    console.error('  issues-json: JSON string or file path containing issues array');
    process.exit(1);
  }

  const readmePath = path.resolve(args[0]);
  const issuesInput = args[1];

  try {
    // Parse issues - could be JSON string or file path
    let issues;
    try {
      // Try parsing as JSON first
      issues = JSON.parse(issuesInput);
    } catch (e) {
      // Try reading as file
      const issuesContent = fs.readFileSync(path.resolve(issuesInput), 'utf8');
      issues = JSON.parse(issuesContent);
    }

    if (!Array.isArray(issues)) {
      throw new Error('Issues must be an array');
    }

    // Update README
    const count = updateReadme(readmePath, issues);

    if (count > 0) {
      console.log(`✓ Updated README.md with ${count} inconsistency/inconsistencies`);
    } else {
      console.log('✓ Updated README.md - no inconsistencies found');
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
  module.exports = { updateReadme, generateTable, formatAgeGender };
}
