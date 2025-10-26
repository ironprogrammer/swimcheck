#!/usr/bin/env node

/**
 * Validates swim time progression: A < B+ < B (faster to slower)
 * - Flags times where progression is invalid
 * - Appends ⚠️ emoji to times with invalid progression
 *
 * Returns modified JSON with warnings appended
 */

const fs = require('fs');
const path = require('path');

const WARNING_EMOJI = '⚠️';

/**
 * Remove warning emoji if present for validation
 */
function stripWarning(timeStr) {
  if (!timeStr) return timeStr;
  return timeStr.replace(WARNING_EMOJI, '');
}

/**
 * Convert time string to total centiseconds for comparison
 * Handles MM:SS.MS or SS.MS format
 * Ignores warning emoji if present
 *
 * @returns {number|null} Total centiseconds, or null if invalid/null
 */
function timeTocentiseconds(timeStr) {
  if (!timeStr) return null;

  // Strip any warning emoji before parsing
  const cleanTime = stripWarning(timeStr);

  // Try MM:SS.MS format
  let match = cleanTime.match(/^(\d+):(\d{2})\.(\d{2})$/);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const centiseconds = parseInt(match[3]);
    return (minutes * 60 * 100) + (seconds * 100) + centiseconds;
  }

  // Try SS.MS format
  match = cleanTime.match(/^(\d{1,2})\.(\d{2})$/);
  if (match) {
    const seconds = parseInt(match[1]);
    const centiseconds = parseInt(match[2]);
    return (seconds * 100) + centiseconds;
  }

  // Invalid format
  return null;
}

/**
 * Check if time progression is valid (A < B+ < B)
 *
 * @returns {object} { valid: boolean, issue: string|null }
 */
function validateProgression(timeA, timeBPlus, timeB) {
  const csA = timeTocentiseconds(timeA);
  const csBPlus = timeTocentiseconds(timeBPlus);
  const csB = timeTocentiseconds(timeB);

  // If any time is null or invalid format, skip progression check
  if (csA === null || csBPlus === null || csB === null) {
    return { valid: true, issue: null };
  }

  // A should be fastest (smallest), then B+, then B
  if (csA >= csBPlus) {
    return { valid: false, issue: 'Invalid progression' };
  }

  if (csBPlus >= csB) {
    return { valid: false, issue: 'Invalid progression' };
  }

  return { valid: true, issue: null };
}

/**
 * Process JSON data and flag invalid progressions
 */
function processTimeStandards(data) {
  const issues = [];

  if (!data.ageGroups || !Array.isArray(data.ageGroups)) {
    throw new Error('Invalid JSON structure: ageGroups array not found');
  }

  data.ageGroups.forEach(ageGroup => {
    const age = ageGroup.age;

    ['Girls', 'Boys'].forEach(gender => {
      if (!ageGroup.genders || !ageGroup.genders[gender]) return;

      const events = ageGroup.genders[gender].events;
      if (!events || !Array.isArray(events)) return;

      events.forEach(event => {
        const eventName = event.name;

        ['SCY', 'SCM', 'LCM'].forEach(course => {
          if (!event[course]) return;

          const timeA = event[course]['A'];
          const timeBPlus = event[course]['B+'];
          const timeB = event[course]['B'];

          const validation = validateProgression(timeA, timeBPlus, timeB);

          if (!validation.valid) {
            // Flag the B time as the issue (it's the slowest and should be largest)
            // But we need to identify which specific time(s) break the progression
            const csA = timeTocentiseconds(timeA);
            const csBPlus = timeTocentiseconds(timeBPlus);
            const csB = timeTocentiseconds(timeB);

            // Determine which time(s) to flag
            // If A >= B+, flag both A and B+
            // If B+ >= B, flag B (the one that's out of order)
            if (csA !== null && csBPlus !== null && csA >= csBPlus) {
              // Flag B+ as it should be slower than A but isn't
              if (timeBPlus && !timeBPlus.includes(WARNING_EMOJI)) {
                event[course]['B+'] = timeBPlus + WARNING_EMOJI;
              }
              issues.push({
                age,
                gender,
                event: eventName,
                course,
                standard: 'B+',
                value: event[course]['B+'],
                issue: validation.issue
              });
            }

            if (csBPlus !== null && csB !== null && csBPlus >= csB) {
              // Flag B as it should be slower than B+ but isn't
              if (timeB && !timeB.includes(WARNING_EMOJI)) {
                event[course]['B'] = timeB + WARNING_EMOJI;
              }
              issues.push({
                age,
                gender,
                event: eventName,
                course,
                standard: 'B',
                value: event[course]['B'],
                issue: validation.issue
              });
            }
          }
        });
      });
    });
  });

  return { data, issues };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: validate-time-progression.js <json-file>');
    process.exit(1);
  }

  const jsonFile = path.resolve(args[0]);

  try {
    // Read JSON file
    const jsonContent = fs.readFileSync(jsonFile, 'utf8');
    const data = JSON.parse(jsonContent);

    // Process and validate
    const { data: modifiedData, issues } = processTimeStandards(data);

    // Write back to file
    fs.writeFileSync(jsonFile, JSON.stringify(modifiedData, null, 2) + '\n', 'utf8');

    // Report results
    if (issues.length > 0) {
      console.log(`Found ${issues.length} time progression issue(s):`);
      issues.forEach(issue => {
        console.log(`  - ${issue.gender} ${issue.age}, ${issue.event} ${issue.course} ${issue.standard}: ${issue.value} (${issue.issue})`);
      });

      // Output JSON for other scripts to consume
      console.log('\nJSON_ISSUES=' + JSON.stringify(issues));
    } else {
      console.log('✓ All time progressions are valid');
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
  module.exports = { validateProgression, timeTocentiseconds, processTimeStandards, stripWarning };
}
