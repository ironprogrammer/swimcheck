# Swim Check - Motiviational Swim Time Tracker


### overview
Swim Check (swimcheck.org) is a single page mobile-first app that allows swimmers to compare their swim times with motivational times that match their age, gender, and course type (short/long and yards/meters). The grid of qualifying times for each level (A, B+, and B) and text fields for the swimmer's times is presented in a streamlined way to allow for ease of use and minimal scrolling. Once a time is entered, the app calculates where the time falls within the motivational ranges, displays visual feedback for which level the swimmer qualifies for, and saves the value to keep track of the swimmer's times for the meet. Once the meet is over, the times can be exported/shared.

Source time data for times comes from JSONified data extracted from the OSI time standards published at https://www.oregonswimming.org/page/competition/time-standards (data is provided in tabular format via PDF file). The extraction is facilitated by an LLM agent, such as Claude Code. The data also controls which dropdown and button options are available in the UI.

This app is intended to be used over the course of a multi-day swim meet, where events will be spread over multiple days, so all entered data should remain in browser storage until purposefully cleared by the user.

### scoping questions
- what we need to collect from user
	- age/group
	- gender
	- course (short/long) and unit (y/m)
	- times entered should follow this format: 1:28.19 (i.e. 1 minute and 28.19 seconds)
- logic for qualifying times
	- for an example SCY (short course yard) meet with these motivational times: A 20.54, B+ 24.07, B 27.87...
	- if the swimmer's time is 23.98, then they qualify for the B+ time
	- lower times are better
	- "motivational" and "qualifying" times can be used interchangeably
- what we should save between sessions/refreshes
	- all selections from buttons and dropdowns
	- data entered (times)
	- ability to save the course+distance combo to name the venue (e.g. MJCC = SCY)
		- can only do this if we can rely on local browser storage; e.g. if safari dumps all site storage after 7 days, then this would be useless
	- user may switch between single age (11) and group (11-12) for rally events -- app should persist all times entered between those selections
- build/deploy workflow
	- jsonify data from pdf grid (1-2 times per year)
	- deploy page to site (html/css/js) and json data
	- on page load first time, store data local to user (local storage, sqlite?)

### ui
- mobile first
- app should clearly indicate the year/season loaded from the json
- select age/group (dropdown), gender (buttons), course/unit type (buttons)
	- course/unit types are: SCY, SCM, LCM
- fields for time entry (mm:ss.hh) on each event
	- all values are to 2 decimal places
	- placeholder text for fields can be "mm:ss.ms" or similar
	- the name listed for each event in the json is adequate (e.g. "50 Free" is understood by the user/swimmer)
- grid-based layout with all events in single table
	- events listed are filtered based on age/group, gender, and course type selected
	- i.e. if SCY is selected, only that type's columns (a/b+/b times per event) should be displayed
- time values in grid should be right-aligned
- monospace font used for all time values and time text fields
- app automatically reflects which time ranking qualified for (a/b+/b) -- no submit button needed
	- use colors to differentiate meeting which qualifying time for that row
	- use similar to red/pink on field cell for times that don't meet lowest b time (i.e. did not qualify for any time level)
	- calculation of qualifying time auto-updates after focus blur or 500ms after typing ends
- for events w/o times, use "n/a"
- add a clear times button at the very bottom (modal confirmation required)
- no color legend needed; columns should explain it all
- no grouping of event types in grid; display in order as presented from data

### features
- display/compare with current motivational times, updated regularly (1-2 times per year)
- persist selected settings between visits/refreshes
- [future] share/export results for the day/meet to text, csv, pdf
- [future] share results with family member who can load the app with previously entered times
- [future] other states' qualifying times, via other datasets
- [future] option to store course/unit combos as "venue name" (might require accts)
- [future] pwa could potentially store app+data on phone to work w/o network :ideal:
- [future] for relay events, allow entry for split times, and highlight related event's time ranking

### implementation
- mobile first
- uses pico.css for minimal css overhead
	- uses pico's built-in automatic light/dark mode detection
	- load directly from existing cdn for mvp (`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" >`)
- load/cache json data on device
- hosted on github pages
	- swimcheck.org (osicheck.org possible backup domain)
- gha to auto-update json from source pdf
	- a weekly action scan for 1-2x per year updates seems like overkill...
	- instead do check on pr merge only? (trigger) -- probable short-term solution
		- fyi, new times coming in nov 2025
	- current data acquisition is to use ai to parse pdf data; automateable with claude?
- gha to deploy to gh pages on pr merge
- put all css/js in page for extra slimness (could add build step to combine, but overkill for now)
	- do we need to be concerned bout versioning the page when there's an update, e.g. the included js/css, or eventually the json data?

### Repository Structure
```
├── index.html               (app)
├── swim_time_standards.json (data)
├── README.md
└── .github/
    └── workflows/
        └── deploy.yml      (auto-deploy on push)
```

### JSON Structure
```json
{
  "title": "2024-2025 Oregon Swimming Time Standards",
  "ageGroups": [
    {
      "age": "8 & Under",
      "note": "Optional notes (e.g., 'Relay events only')",
      "genders": {
        "Girls": {
          "events": [
            {
              "name": "50 Free",
              "SCY": { "A": "42.29", "B+": "44.39", "B": "46.49" },
              "SCM": { "A": "46.49", "B+": "48.89", "B": "51.19" },
              "LCM": { "A": "44.59", "B+": "46.79", "B": "48.99" }
            }
          ]
        },
        "Boys": { ... }
      }
    }
  ]
}
```

### data organization
here is an example of what data might be read from the json data, but i could change over time:
```
### Age Groups
- 8 & Under
- 9
- 10
- 10 & Under (relay events only)
- 11
- 12
- 11-12 (relay events only)
- 13
- 14
- 13-14 (relay events only)
- 15 & Over

### Genders
- Girls
- Boys

### Course Types
- **SCY**: Short Course Yards
- **SCM**: Short Course Meters
- **LCM**: Long Course Meters

### Time Standards
- **A**: Top qualifying time
- **B+**: Middle qualifying time
- **B**: Base qualifying time

### Event Names
Events include:
- Freestyle: 25 Free, 50 Free, 100 Free, 200 Free, 400 Free, 500 Free, 800 Free, 1000 Free, 1500 Free, 1650 Free
- Backstroke: 25 Back, 50 Back, 100 Back, 200 Back
- Breaststroke: 25 Breast, 50 Breast, 100 Breast, 200 Breast
- Butterfly: 25 Fly, 50 Fly, 100 Fly, 200 Fly
- Individual Medley: 100 IM, 200 IM, 400 IM
- Freestyle Relay: 100 F.R., 200 F.R., 400 F.R., 800 F.R.
- Medley Relay: 100 M.R., 200 M.R., 400 M.R.
```

### Notes
1. Some events are not available for all course types (indicated by `null` values)
2. Some age groups (10 & Under, 11-12, 13-14, 15 & Over relay) only have relay events
3. The 15 & Over age group note indicates: "15 & Over Standards for Short Course Championships equal to 14 YO", which should be displayed when the corresponding "SC*" information is displayed

### Time Format Parsing
When parsing times:
- Format with colon (e.g., "1:23.45"): Minutes:Seconds.Milliseconds (`MM:SS.MS`)
- Format without colon (e.g., "23.45"): Seconds.Milliseconds (`SS.MS`)
