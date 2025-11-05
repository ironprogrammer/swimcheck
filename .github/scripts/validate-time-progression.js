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
 * Convert time string to total seconds (as decimal)
 * Handles MM:SS.MS or SS.MS format
 *
 * @returns {number|null} Total seconds as decimal, or null if invalid/null
 */
function timeToSeconds(timeStr) {
  if (!timeStr) return null;

  // Strip any warning emoji before parsing
  const cleanTime = stripWarning(timeStr);

  // Try MM:SS.MS format
  let match = cleanTime.match(/^(\d+):(\d{2})\.(\d{2})$/);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const centiseconds = parseInt(match[3]);
    return minutes * 60 + seconds + centiseconds / 100;
  }

  // Try SS.MS format
  match = cleanTime.match(/^(\d{1,2})\.(\d{2})$/);
  if (match) {
    const seconds = parseInt(match[1]);
    const centiseconds = parseInt(match[2]);
    return seconds + centiseconds / 100;
  }

  // Invalid format
  return null;
}

/**
 * Format seconds back to time string
 * @returns {string} Formatted time as MM:SS.MS or SS.MS
 */
function secondsToTimeString(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Round to 2 decimal places to avoid floating point issues
  const secondsRounded = Math.round(seconds * 100) / 100;
  const wholeSeconds = Math.floor(secondsRounded);
  const centiseconds = Math.round((secondsRounded - wholeSeconds) * 100);

  if (minutes > 0) {
    return `${minutes}:${wholeSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  } else {
    return `${wholeSeconds}.${centiseconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Calculate expected B time from A time using OSI formula:
 * B = round(A * 1.1, 1 decimal) + 0.09
 *
 * @param {number} timeA - A time in seconds
 * @returns {number} Expected B time in seconds
 */
function calculateExpectedB(timeA) {
  const bCalculated = timeA * 1.1;
  // Drop all but first decimal, then add 0.09
  const bRounded = Math.floor(bCalculated * 10) / 10;
  return bRounded + 0.09;
}

/**
 * Calculate expected B+ time from A and B times using OSI formula:
 * B+ = round((A + B) / 2, 1 decimal) + 0.09
 *
 * @param {number} timeA - A time in seconds
 * @param {number} timeB - B time in seconds
 * @returns {number} Expected B+ time in seconds
 */
function calculateExpectedBPlus(timeA, timeB) {
  const bPlusCalculated = (timeA + timeB) / 2;
  // Drop all but first decimal, then add 0.09
  const bPlusRounded = Math.floor(bPlusCalculated * 10) / 10;
  return bPlusRounded + 0.09;
}

/**
 * Check if time progression is valid using OSI formula
 * A times are set each year
 * B = round(A * 1.1, 1 decimal) + 0.09
 * B+ = round((A + B) / 2, 1 decimal) + 0.09
 *
 * @returns {object} { valid: boolean, invalidStandards: string[], issues: string[] }
 */
function validateProgression(timeA, timeBPlus, timeB) {
  // If any time has a warning emoji (from format validation), skip progression check
  // This avoids false positives when comparing against invalid times
  if ((timeA && timeA.includes(WARNING_EMOJI)) ||
      (timeBPlus && timeBPlus.includes(WARNING_EMOJI)) ||
      (timeB && timeB.includes(WARNING_EMOJI))) {
    return { valid: true, invalidStandards: [], issues: [] };
  }

  const secA = timeToSeconds(timeA);
  const secBPlus = timeToSeconds(timeBPlus);
  const secB = timeToSeconds(timeB);

  // If any time is null or invalid format, skip progression check
  if (secA === null || secBPlus === null || secB === null) {
    return { valid: true, invalidStandards: [], issues: [] };
  }

  const invalidStandards = [];
  const issues = [];

  // Calculate expected B from A
  const expectedB = calculateExpectedB(secA);
  const expectedBStr = secondsToTimeString(expectedB);

  // Allow tiny floating point tolerance (0.005 seconds = 0.5 centiseconds)
  const bIsIncorrect = Math.abs(secB - expectedB) > 0.005;
  if (bIsIncorrect) {
    invalidStandards.push('B');
    issues.push(`B should be ${expectedBStr} (A × 1.1, rounded to 1 decimal + 0.09)`);
  }

  // Calculate expected B+ from A and corrected B (not the actual B from PDF)
  // This way, if B is wrong but B+ is correct relative to what B should be,
  // we won't flag B+ as an error
  const bTimeForBPlusCalculation = bIsIncorrect ? expectedB : secB;
  const expectedBPlus = calculateExpectedBPlus(secA, bTimeForBPlusCalculation);
  const expectedBPlusStr = secondsToTimeString(expectedBPlus);

  if (Math.abs(secBPlus - expectedBPlus) > 0.005) {
    invalidStandards.push('B+');
    issues.push(`B+ should be ${expectedBPlusStr} ((A + B) / 2, rounded to 1 decimal + 0.09)`);
  }

  return {
    valid: invalidStandards.length === 0,
    invalidStandards,
    issues
  };
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
            // Flag each invalid standard
            validation.invalidStandards.forEach((standard, idx) => {
              const currentTime = event[course][standard];
              if (currentTime && !currentTime.includes(WARNING_EMOJI)) {
                event[course][standard] = currentTime + WARNING_EMOJI;
              }

              issues.push({
                age,
                gender,
                event: eventName,
                course,
                standard,
                value: event[course][standard],
                issue: validation.issues[idx]
              });
            });
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
  module.exports = {
    validateProgression,
    timeTocentiseconds,
    timeToSeconds,
    secondsToTimeString,
    calculateExpectedB,
    calculateExpectedBPlus,
    processTimeStandards,
    stripWarning
  };
}
