#!/usr/bin/env node

/**
 * Validates swim time format and sensibility
 * - Accepts MM:SS.MS or SS.MS format
 * - Flags invalid seconds (e.g., 96 in 1:96.28)
 * - Flags invalid format times
 * - Appends ⚠️ emoji to invalid times
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
 * Check if time string has valid format (MM:SS.MS or SS.MS)
 * and sensible values (seconds < 60, etc.)
 *
 * @returns {object} { valid: boolean, issue: string|null }
 */
function validateTimeFormat(timeStr) {
  if (!timeStr) return { valid: true, issue: null }; // null is valid (not all events have all standards)

  // Strip any existing warning emoji before validation
  const cleanTime = stripWarning(timeStr);

  // Match MM:SS.MS or SS.MS format
  const withMinutes = /^(\d+):(\d{2})\.(\d{2})$/;
  const withoutMinutes = /^(\d{1,2})\.(\d{2})$/;

  let match = cleanTime.match(withMinutes);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const centiseconds = parseInt(match[3]);

    // Check for invalid seconds (must be 0-59)
    if (seconds >= 60) {
      return { valid: false, issue: 'Invalid format' };
    }

    // Centiseconds should be 0-99 (implied by regex)
    if (centiseconds >= 100) {
      return { valid: false, issue: 'Invalid format' };
    }

    return { valid: true, issue: null };
  }

  match = cleanTime.match(withoutMinutes);
  if (match) {
    const seconds = parseInt(match[1]);
    const centiseconds = parseInt(match[2]);

    // For times without minutes, seconds can be 0-59
    // (times >= 60 seconds should use minute format)
    if (seconds >= 60) {
      return { valid: false, issue: 'Invalid format' };
    }

    if (centiseconds >= 100) {
      return { valid: false, issue: 'Invalid format' };
    }

    return { valid: true, issue: null };
  }

  // Doesn't match either format
  return { valid: false, issue: 'Invalid format' };
}

/**
 * Process JSON data and flag invalid times
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

          ['A', 'B+', 'B'].forEach(standard => {
            const timeValue = event[course][standard];
            if (timeValue === null) return;

            const validation = validateTimeFormat(timeValue);
            if (!validation.valid) {
              // Append warning emoji if not already present
              if (!timeValue.includes(WARNING_EMOJI)) {
                event[course][standard] = timeValue + WARNING_EMOJI;
              }

              issues.push({
                age,
                gender,
                event: eventName,
                course,
                standard,
                value: timeValue.includes(WARNING_EMOJI) ? timeValue : timeValue + WARNING_EMOJI,
                issue: validation.issue
              });
            }
          });
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
    console.error('Usage: validate-time-format.js <json-file>');
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
      console.log(`Found ${issues.length} time format issue(s):`);
      issues.forEach(issue => {
        console.log(`  - ${issue.gender} ${issue.age}, ${issue.event} ${issue.course} ${issue.standard}: ${issue.value} (${issue.issue})`);
      });

      // Output JSON for other scripts to consume
      console.log('\nJSON_ISSUES=' + JSON.stringify(issues));
    } else {
      console.log('✓ All times have valid format');
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
  module.exports = { validateTimeFormat, processTimeStandards, stripWarning };
}
