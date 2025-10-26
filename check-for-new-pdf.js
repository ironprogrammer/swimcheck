#!/usr/bin/env node

/**
 * Check for new Oregon Swimming Time Standards PDF
 * Dynamically detects newer year ranges or URL changes by comparing
 * against the stored data in swim_time_standards.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://www.oregonswimming.org/page/competition/time-standards';
const JSON_FILE = path.join(__dirname, 'swim_time_standards.json');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function loadCurrentData() {
  try {
    const data = fs.readFileSync(JSON_FILE, 'utf8');
    const json = JSON.parse(data);

    // Extract year range from title (the actual text from the page's link)
    // e.g., "2024-2025 OSI Time Standards"
    const yearMatch = json.title.match(/(\d{4})-(\d{4})/);

    return {
      title: json.title,
      yearRange: yearMatch ? yearMatch[0] : null,
      startYear: yearMatch ? parseInt(yearMatch[1]) : null,
      endYear: yearMatch ? parseInt(yearMatch[2]) : null,
      sourceUrl: json.sourceUrl,
      generatedOn: json.generatedOn
    };
  } catch (error) {
    throw new Error(`Failed to read ${JSON_FILE}: ${error.message}`);
  }
}

function parseYearRange(yearStr) {
  const match = yearStr.match(/(\d{4})-(\d{4})/);
  if (!match) return null;

  return {
    yearRange: match[0],
    startYear: parseInt(match[1]),
    endYear: parseInt(match[2])
  };
}

function isNewerYear(currentStart, currentEnd, newStart, newEnd) {
  // Compare by start year first, then end year if needed
  if (newStart > currentStart) return true;
  if (newStart === currentStart && newEnd > currentEnd) return true;
  return false;
}

function normalizeUrl(url) {
  // Ensure URL is absolute
  if (url.startsWith('http')) return url;
  return `https://www.oregonswimming.org${url}`;
}

function checkForNewPDF(html, currentData) {
  console.log('='.repeat(60));
  console.log('Oregon Swimming Time Standards PDF Check');
  console.log('='.repeat(60));
  console.log(`Target URL: ${TARGET_URL}`);
  console.log(`Current title: "${currentData.title}"`);
  console.log(`Current year range: ${currentData.yearRange}`);
  console.log(`Current URL: ${currentData.sourceUrl}`);
  console.log('-'.repeat(60));

  // Extract all OSI Time Standards links from the page
  const osiLinks = [];
  const anchorRegex = /<a[^>]*href=["']([^"']*)[^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].trim();
    const combined = text + ' ' + href;

    // Check if it's the OSI Time Standards (not Championships)
    const isOSI = /osi.*time.*standards/i.test(combined) ||
                   /time.*standards.*osi/i.test(combined);
    const isNotChampionships = !/championship/i.test(combined);
    const hasYear = /\d{4}-\d{4}/.test(combined);

    if (isOSI && isNotChampionships && hasYear) {
      const yearInfo = parseYearRange(combined);
      if (yearInfo) {
        osiLinks.push({
          text: text,
          href: normalizeUrl(href),
          ...yearInfo
        });
      }
    }
  }

  console.log(`Found ${osiLinks.length} OSI Time Standards link(s) on page\n`);

  // Check for changes
  let changeDetected = false;
  let changeType = null;
  let changeDetails = null;

  for (const link of osiLinks) {
    // Case 1: Newer year detected
    if (isNewerYear(currentData.startYear, currentData.endYear, link.startYear, link.endYear)) {
      changeDetected = true;
      changeType = 'NEWER_YEAR';
      changeDetails = link;
      break;
    }

    // Case 2: Same year but different URL (data correction)
    if (link.startYear === currentData.startYear && link.endYear === currentData.endYear) {
      if (link.href !== currentData.sourceUrl) {
        changeDetected = true;
        changeType = 'URL_CHANGED';
        changeDetails = link;
        break;
      }
    }
  }

  console.log('Search Results:');
  console.log();

  if (changeDetected) {
    if (changeType === 'NEWER_YEAR') {
      console.log(`✓ NEWER YEAR DETECTED!`);
      console.log(`  Previous: ${currentData.yearRange}`);
      console.log(`  New:      ${changeDetails.yearRange}`);
      console.log(`  Link text: "${changeDetails.text}"`);
      console.log(`  URL: ${changeDetails.href}`);
    } else if (changeType === 'URL_CHANGED') {
      console.log(`✓ URL CHANGED (possible data correction)`);
      console.log(`  Year range: ${currentData.yearRange} (unchanged)`);
      console.log(`  Previous URL: ${currentData.sourceUrl}`);
      console.log(`  New URL:      ${changeDetails.href}`);
      console.log(`  Link text: "${changeDetails.text}"`);
    }
    console.log();
    console.log('-'.repeat(60));
    console.log('Status: SUCCESS - Change detected');
    console.log('Action: Continuing to next steps...');
    console.log('='.repeat(60));
    return {
      changed: true,
      type: changeType,
      details: changeDetails
    };
  } else {
    console.log(`✗ NO CHANGES: Current version ${currentData.yearRange} is up to date`);
    console.log(`  URL: ${currentData.sourceUrl}`);
    console.log();
    console.log('-'.repeat(60));
    console.log('Status: NO CHANGES - Already have latest version');
    console.log('Action: Ending workflow');
    console.log('='.repeat(60));
    return {
      changed: false,
      type: null,
      details: null
    };
  }
}

async function main() {
  try {
    // Load current data from JSON file
    console.log(`Reading current data from ${path.basename(JSON_FILE)}...`);
    const currentData = loadCurrentData();
    console.log(`✓ Loaded: "${currentData.title}" (${currentData.yearRange})\n`);

    // Fetch the webpage
    console.log('Fetching webpage...');
    const html = await fetchPage(TARGET_URL);
    console.log(`✓ Successfully fetched ${html.length} bytes\n`);

    // Check for changes
    const result = checkForNewPDF(html, currentData);

    // Exit with code 0 if changes detected (success, can continue)
    // Exit with code 1 if no changes (will end workflow)
    process.exit(result.changed ? 0 : 1);

  } catch (error) {
    console.error('='.repeat(60));
    console.error('ERROR: Failed to check for new PDF');
    console.error('-'.repeat(60));
    console.error(error.message);
    console.error('='.repeat(60));
    process.exit(2); // Exit with error code 2 for unexpected errors
  }
}

main();
