#!/usr/bin/env node

/**
 * Updates the README.md "Data Inconsistencies" section with current issues
 * - Takes issues from validation scripts (via JSON input)
 * - Replaces the existing table with current issues
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
 * Generate markdown table from issues
 */
function generateTable(issues) {
  if (issues.length === 0) {
    return '*(No inconsistencies found in current data)*';
  }

  // Sort issues by age, gender, event, course, standard
  const sortedIssues = issues.sort((a, b) => {
    if (a.age !== b.age) return a.age.localeCompare(b.age);
    if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
    if (a.event !== b.event) return a.event.localeCompare(b.event);
    if (a.course !== b.course) return a.course.localeCompare(b.course);
    return a.standard.localeCompare(b.standard);
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
 * Update README with new inconsistencies section
 */
function updateReadme(readmePath, issues) {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Find the Data Inconsistencies section
  const sectionRegex = /## Data Inconsistencies ⚠️\n\n([\s\S]*?)\n\n(?=##|\\\*|$)/;

  const match = readmeContent.match(sectionRegex);
  if (!match) {
    throw new Error('Could not find "## Data Inconsistencies ⚠️" section in README.md');
  }

  // Extract the part after the section header and before the table
  // This includes the intro text
  const beforeTable = 'The following issues were observed in the source data from the OSI site, and are highlighted in the app:\n\n';

  // Generate new table
  const newTable = generateTable(issues);

  // Construct the new section content
  const newSection = `## Data Inconsistencies ⚠️\n\n${beforeTable}${newTable}\n\n`;

  // Replace the old section with the new one
  const newReadme = readmeContent.replace(sectionRegex, newSection);

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
