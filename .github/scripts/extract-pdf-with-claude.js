#!/usr/bin/env node

/**
 * Extract swim time standards from PDF using Claude API
 *
 * Uses Anthropic's Claude API to extract structured data from PDF
 * and convert it to the swim_time_standards.json format
 *
 * Usage:
 *   extract-pdf-with-claude.js <pdf-url> <link-text> <output-file>
 *
 * Environment Variables:
 *   ANTHROPIC_API_KEY - Required. Your Anthropic API key
 *
 * Arguments:
 *   pdf-url: URL to the PDF file to extract
 *   link-text: The link text from the OSI website (e.g., "2024-2025 OSI Time Standards")
 *   output-file: Path where the extracted JSON should be written
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_VERSION = '2023-06-01';

// Claude model to use for extraction
const MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Download PDF from URL
 */
function downloadPDF(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirects
        downloadPDF(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

/**
 * Call Claude API to extract data from PDF
 */
async function extractWithClaude(pdfBuffer, linkText, sourceUrl) {
  const base64PDF = pdfBuffer.toString('base64');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are a data extraction specialist. I need you to extract swim time standards from this PDF and convert them to JSON format.

CRITICAL REQUIREMENTS:

1. **Output Format**: The JSON must follow this EXACT structure:

\`\`\`json
{
  "title": "${linkText}",
  "sourceUrl": "${sourceUrl}",
  "generatedOn": "${today}",
  "ageGroups": [
    {
      "age": "8 & Under",
      "genders": {
        "Girls": {
          "events": [
            {
              "name": "25 Free",
              "SCY": { "A": "18.89", "B+": "19.79", "B": "20.69" },
              "SCM": { "A": "20.69", "B+": "21.79", "B": "22.79" },
              "LCM": { "A": null, "B+": null, "B": null }
            }
          ]
        },
        "Boys": {
          "events": [...]
        }
      }
    }
  ]
}
\`\`\`

2. **Data Extraction Rules**:
   - Extract ALL age groups (e.g., "8 & Under", "9", "10", "11", "12", "13", "14", "15", "16", "17-18")
   - For EACH age group, extract data for BOTH Girls and Boys
   - For EACH event, include ALL three course types: SCY, SCM, LCM
   - For EACH course type, include ALL three standards: A, B+, B
   - If a cell is empty or has no time, use null (not an empty string, not "N/A")
   - Preserve ALL events exactly as they appear in the PDF

3. **Time Format**:
   - Keep times as strings in format MM:SS.MS (e.g., "1:28.19") or SS.MS (e.g., "28.45")
   - DO NOT convert to numbers or change format
   - If a time appears invalid (e.g., seconds > 59), STILL extract it as-is - validation will handle it later

4. **Event Names**:
   - Use exact event names from PDF (e.g., "25 Free", "50 Free", "100 Free", "100 Breast", "100 IM", "100 F.R.", "100 M.R.")
   - Common abbreviations: "Free" (Freestyle), "Back" (Backstroke), "Breast" (Breaststroke), "Fly" (Butterfly), "IM" (Individual Medley), "F.R." (Free Relay), "M.R." (Medley Relay)

5. **Age Group Names**:
   - Extract exactly as shown in PDF (e.g., "8 & Under", "9", "10", etc.)
   - For ranges, use format like "17-18"

6. **IMPORTANT**:
   - DO NOT skip any age groups, genders, events, course types, or standards
   - The structure must be complete and consistent
   - Return ONLY the JSON object, no explanations or markdown formatting
   - The JSON must be valid and parseable

Extract the data now and return the complete JSON object:`;

  const requestBody = {
    model: MODEL,
    max_tokens: 32000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64PDF
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_API_VERSION
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const response = JSON.parse(data);

          if (!response.content || !response.content[0] || !response.content[0].text) {
            reject(new Error('Unexpected API response format'));
            return;
          }

          const extractedText = response.content[0].text;

          // Try to parse the extracted text as JSON
          // Claude might wrap it in markdown code blocks, so handle that
          let jsonText = extractedText.trim();

          // Remove markdown code blocks if present
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          try {
            const extractedData = JSON.parse(jsonText);
            resolve(extractedData);
          } catch (parseError) {
            // If JSON parsing fails, save the raw response for debugging
            const debugFile = 'claude-response-debug.txt';
            fs.writeFileSync(debugFile, extractedText, 'utf8');
            reject(new Error(
              `Failed to parse JSON: ${parseError.message}\n` +
              `Raw response saved to ${debugFile} for debugging.\n` +
              `Response length: ${extractedText.length} characters`
            ));
          }

        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: extract-pdf-with-claude.js <pdf-url> <link-text> <output-file>');
    console.error('');
    console.error('Environment Variables:');
    console.error('  ANTHROPIC_API_KEY - Required');
    process.exit(1);
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const pdfUrl = args[0];
  const linkText = args[1];
  const outputFile = args[2];

  try {
    console.log('========================================');
    console.log('Claude PDF Extraction');
    console.log('========================================');
    console.log(`PDF URL: ${pdfUrl}`);
    console.log(`Link text: ${linkText}`);
    console.log(`Output: ${outputFile}`);
    console.log('');

    // Download PDF
    console.log('Step 1: Downloading PDF...');
    const pdfBuffer = await downloadPDF(pdfUrl);
    console.log(`✓ Downloaded ${pdfBuffer.length} bytes`);
    console.log('');

    // Extract with Claude
    console.log('Step 2: Extracting data with Claude API...');
    console.log(`Using model: ${MODEL}`);
    const extractedData = await extractWithClaude(pdfBuffer, linkText, pdfUrl);
    console.log('✓ Data extracted successfully');
    console.log('');

    // Write to file
    console.log('Step 3: Writing JSON to file...');
    fs.writeFileSync(outputFile, JSON.stringify(extractedData, null, 2) + '\n', 'utf8');
    console.log(`✓ Written to ${outputFile}`);
    console.log('');

    console.log('========================================');
    console.log('Extraction Complete');
    console.log('========================================');
    console.log('Next steps:');
    console.log('  1. Run validation scripts');
    console.log('  2. Review changes');
    console.log('  3. Commit and create PR');
    console.log('========================================');

    process.exit(0);

  } catch (error) {
    console.error('========================================');
    console.error('ERROR: Extraction failed');
    console.error('========================================');
    console.error(error.message);
    console.error('========================================');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
