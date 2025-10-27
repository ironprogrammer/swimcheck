#!/usr/bin/env python3

"""
Extract swim time standards from PDF using pdfplumber

Uses pdfplumber library to extract structured table data from PDF
and convert it to the swim_time_standards.json format

Usage:
  extract-pdf-with-pdfplumber.py <pdf-url> <link-text> <output-file>

Arguments:
  pdf-url: URL to the PDF file to extract
  link-text: The link text from the OSI website (e.g., "2024-2025 OSI Time Standards")
  output-file: Path where the extracted JSON should be written
"""

import sys
import json
import urllib.request
import pdfplumber
from datetime import date
from io import BytesIO


def download_pdf(url):
    """Download PDF from URL"""
    print(f"Downloading from {url}...")
    
    # Create request with browser headers to avoid 403 errors
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    request = urllib.request.Request(url, headers=headers)
    
    # Handle redirects automatically
    with urllib.request.urlopen(request) as response:
        pdf_data = response.read()
    
    print(f"✓ Downloaded {len(pdf_data)} bytes")
    return pdf_data


def extract_age_from_header(row):
    """Extract age group from header row (e.g., '8 & Under', '9', '11-12')"""
    # Age group rows have 'Girls' at the start and 'Boys' somewhere in the middle/end
    # The age appears in column 9 (the Event column position)
    
    if len(row) < 19:
        return None
    
    # Check if this looks like an age group header row
    # Should have 'Girls' in first column and 'Boys' in column 10
    if row[0] and 'Girls' in row[0] and row[10] and 'Boys' in row[10]:
        # Age is in column 9
        if row[9] and row[9].strip():
            return row[9].strip()
    
    return None


def parse_time(time_str):
    """Parse time string, return None for empty/invalid times"""
    if not time_str or time_str.strip() == '':
        return None
    return time_str.strip()


def extract_event_data(table_rows, start_idx, age_group):
    """Extract all event data for a given age group"""
    
    events_girls = []
    events_boys = []
    
    i = start_idx
    while i < len(table_rows):
        row = table_rows[i]
        
        # Check if we've hit the next age group or end
        next_age = extract_age_from_header(row)
        if next_age and next_age != age_group:
            break
            
        # Skip header rows and empty rows
        if not row[9] or row[9].strip() in ['', 'Event', 'Girls', 'Boys', 'SCY A']:
            i += 1
            continue
        
        event_name = row[9].strip()
        
        # Extract Girls times (columns 0-8)
        girls_event = {
            "name": event_name,
            "SCY": {
                "A": parse_time(row[0]),
                "B+": parse_time(row[1]),
                "B": parse_time(row[2])
            },
            "SCM": {
                "A": parse_time(row[3]),
                "B+": parse_time(row[4]),
                "B": parse_time(row[5])
            },
            "LCM": {
                "A": parse_time(row[6]),
                "B+": parse_time(row[7]),
                "B": parse_time(row[8])
            }
        }
        
        # Extract Boys times (columns 10-18)
        boys_event = {
            "name": event_name,
            "SCY": {
                "A": parse_time(row[10]),
                "B+": parse_time(row[11]),
                "B": parse_time(row[12])
            },
            "SCM": {
                "A": parse_time(row[13]),
                "B+": parse_time(row[14]),
                "B": parse_time(row[15])
            },
            "LCM": {
                "A": parse_time(row[16]),
                "B+": parse_time(row[17]),
                "B": parse_time(row[18])
            }
        }
        
        events_girls.append(girls_event)
        events_boys.append(boys_event)
        
        i += 1
    
    return events_girls, events_boys, i


def extract_tables_from_pdf(pdf_data):
    """Extract all tables from PDF and parse into JSON structure"""
    
    age_groups = []
    
    with pdfplumber.open(BytesIO(pdf_data)) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            print(f"Processing page {page_num}...")
            
            tables = page.extract_tables()
            
            for table in tables:
                i = 0
                while i < len(table):
                    row = table[i]
                    
                    # Look for age group header
                    age = extract_age_from_header(row)
                    
                    if age:
                        print(f"  Found age group: {age}")
                        
                        # Extract events for this age group
                        events_girls, events_boys, next_i = extract_event_data(table, i + 2, age)
                        
                        if events_girls:  # Only add if we found events
                            age_group = {
                                "age": age,
                                "genders": {
                                    "Girls": {
                                        "events": events_girls
                                    },
                                    "Boys": {
                                        "events": events_boys
                                    }
                                }
                            }
                            age_groups.append(age_group)
                            print(f"    Extracted {len(events_girls)} events")
                        
                        i = next_i
                    else:
                        i += 1
    
    return age_groups


def main():
    if len(sys.argv) < 4:
        print("Usage: extract-pdf-with-pdfplumber.py <pdf-url> <link-text> <output-file>")
        print("")
        sys.exit(1)
    
    pdf_url = sys.argv[1]
    link_text = sys.argv[2]
    output_file = sys.argv[3]
    
    try:
        print("========================================")
        print("pdfplumber PDF Extraction")
        print("========================================")
        print(f"PDF URL: {pdf_url}")
        print(f"Link text: {link_text}")
        print(f"Output: {output_file}")
        print("")
        
        # Step 1: Download PDF
        print("Step 1: Downloading PDF...")
        pdf_data = download_pdf(pdf_url)
        print("")
        
        # Step 2: Extract tables
        print("Step 2: Extracting tables with pdfplumber...")
        age_groups = extract_tables_from_pdf(pdf_data)
        print(f"✓ Extracted {len(age_groups)} age groups")
        print("")
        
        # Step 3: Build final JSON structure
        print("Step 3: Building JSON structure...")
        today = date.today().isoformat()
        
        output_data = {
            "title": link_text,
            "sourceUrl": pdf_url,
            "generatedOn": today,
            "ageGroups": age_groups
        }
        
        print("✓ JSON structure built")
        print("")
        
        # Step 4: Write to file
        print("Step 4: Writing JSON to file...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
            f.write('\n')
        
        print(f"✓ Written to {output_file}")
        print("")
        
        print("========================================")
        print("Extraction Complete")
        print("========================================")
        print("Next steps:")
        print("  1. Run validation scripts")
        print("  2. Review changes")
        print("  3. Commit and create PR")
        print("========================================")
        
        sys.exit(0)
        
    except Exception as error:
        print("========================================")
        print("ERROR: Extraction failed")
        print("========================================")
        print(str(error))
        print("========================================")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
