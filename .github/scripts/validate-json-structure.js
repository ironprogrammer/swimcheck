#!/usr/bin/env node

/**
 * Validates JSON structure for swim time standards
 * - Verifies required top-level fields (title, sourceUrl, generatedOn, ageGroups)
 * - Verifies age group structure (age, genders)
 * - Verifies gender structure (Girls/Boys with events arrays)
 * - Verifies event structure (name, SCY, SCM, LCM with A, B+, B standards)
 *
 * Does NOT modify the JSON, only validates structure
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate top-level structure
 */
function validateTopLevel(data) {
  const errors = [];

  // Required fields
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Missing or invalid "title" field (must be string)');
  }

  if (!data.sourceUrl || typeof data.sourceUrl !== 'string') {
    errors.push('Missing or invalid "sourceUrl" field (must be string)');
  }

  if (!data.generatedOn || typeof data.generatedOn !== 'string') {
    errors.push('Missing or invalid "generatedOn" field (must be string)');
  } else {
    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.generatedOn)) {
      errors.push('Invalid "generatedOn" format (must be YYYY-MM-DD)');
    }
  }

  if (!data.ageGroups || !Array.isArray(data.ageGroups)) {
    errors.push('Missing or invalid "ageGroups" field (must be array)');
    return errors; // Can't continue validation without age groups
  }

  if (data.ageGroups.length === 0) {
    errors.push('"ageGroups" array is empty');
  }

  return errors;
}

/**
 * Validate age group structure
 */
function validateAgeGroups(ageGroups) {
  const errors = [];

  ageGroups.forEach((ageGroup, index) => {
    const prefix = `ageGroups[${index}]`;

    if (!ageGroup.age || typeof ageGroup.age !== 'string') {
      errors.push(`${prefix}: Missing or invalid "age" field`);
    }

    if (!ageGroup.genders || typeof ageGroup.genders !== 'object') {
      errors.push(`${prefix}: Missing or invalid "genders" field`);
      return;
    }

    // Validate Girls and Boys
    ['Girls', 'Boys'].forEach(gender => {
      if (!ageGroup.genders[gender]) {
        errors.push(`${prefix}.genders: Missing "${gender}" field`);
        return;
      }

      if (!ageGroup.genders[gender].events || !Array.isArray(ageGroup.genders[gender].events)) {
        errors.push(`${prefix}.genders.${gender}: Missing or invalid "events" array`);
        return;
      }

      const events = ageGroup.genders[gender].events;
      if (events.length === 0) {
        errors.push(`${prefix}.genders.${gender}.events: Array is empty`);
      }

      // Validate each event
      events.forEach((event, eventIndex) => {
        const eventPrefix = `${prefix}.genders.${gender}.events[${eventIndex}]`;

        if (!event.name || typeof event.name !== 'string') {
          errors.push(`${eventPrefix}: Missing or invalid "name" field`);
        }

        // Validate course types
        ['SCY', 'SCM', 'LCM'].forEach(course => {
          if (!event[course]) {
            errors.push(`${eventPrefix}: Missing "${course}" field`);
            return;
          }

          // Validate standards
          ['A', 'B+', 'B'].forEach(standard => {
            if (!(standard in event[course])) {
              errors.push(`${eventPrefix}.${course}: Missing "${standard}" field`);
            } else {
              const value = event[course][standard];
              // Value must be null or string
              if (value !== null && typeof value !== 'string') {
                errors.push(`${eventPrefix}.${course}.${standard}: Invalid value type (must be null or string)`);
              }
            }
          });
        });
      });
    });
  });

  return errors;
}

/**
 * Main validation function
 */
function validateStructure(data) {
  const errors = [];

  // Validate top-level
  errors.push(...validateTopLevel(data));

  // If we have age groups, validate them
  if (data.ageGroups && Array.isArray(data.ageGroups)) {
    errors.push(...validateAgeGroups(data.ageGroups));
  }

  return errors;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: validate-json-structure.js <json-file>');
    process.exit(1);
  }

  const jsonFile = path.resolve(args[0]);

  try {
    // Read JSON file
    const jsonContent = fs.readFileSync(jsonFile, 'utf8');
    const data = JSON.parse(jsonContent);

    // Validate structure
    const errors = validateStructure(data);

    // Report results
    if (errors.length > 0) {
      console.log(`Found ${errors.length} structure validation error(s):`);
      errors.forEach(error => {
        console.log(`  - ${error}`);
      });
      process.exit(1);
    } else {
      console.log('✓ JSON structure is valid');
      process.exit(0);
    }

  } catch (error) {
    if (error.name === 'SyntaxError') {
      console.error('Error: Invalid JSON syntax');
      console.error(error.message);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Export for testing
if (require.main === module) {
  main();
} else {
  module.exports = { validateStructure, validateTopLevel, validateAgeGroups };
}
