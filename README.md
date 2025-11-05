# Swim Check 🏊

A mobile-first single-page app for tracking swim times against [Oregon Swimming (OSI)](https://www.oregonswimming.org) motivational time standards.

Not in Oregon and want to see your state's motivational data? [Start a discussion](https://github.com/ironprogrammer/swimcheck/discussions/6) or [drop me a line](https://brianalexander.com) and let's talk!

## Do you find this app useful?

Please consider helping me cover my kid's swim meet fees!

<a href="https://www.buymeacoffee.com/ironprogrammer" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event      | Course | Standard | Value       | Issue              |
| ---------- | ---------- | ------ | -------- | ----------- | ------------------- |
| Girls 11 | 1500 Free | LCM | B+ | `23:12.09⚠️` | B+ should be 23:22.09 ((A + B) / 2, rounded to 1 decimal + 0.09) |
| Girls 11 | 1500 Free | LCM | B | `24:38.39⚠️` | B should be 24:18.39 (A × 1.1, rounded to 1 decimal + 0.09) |
| Girls 12 | 1500 Free | LCM | B+ | `23:12.09⚠️` | B+ should be 23:22.09 ((A + B) / 2, rounded to 1 decimal + 0.09) |
| Girls 12 | 1500 Free | LCM | B | `24:38.39⚠️` | B should be 24:18.39 (A × 1.1, rounded to 1 decimal + 0.09) |
| Girls 13 | 1500 Free | LCM | B+ | `23:12.09⚠️` | B+ should be 23:22.09 ((A + B) / 2, rounded to 1 decimal + 0.09) |
| Girls 13 | 1500 Free | LCM | B | `24:38.39⚠️` | B should be 24:18.39 (A × 1.1, rounded to 1 decimal + 0.09) |
| Boys 14 | 200 Free | SCY | B+ | `2:05.49⚠️` | B+ should be 2:11.79 ((A + B) / 2, rounded to 1 decimal + 0.09) |
| Boys 15 & Over* | 1500 Free | SCM | B | `21:59.09⚠️` | B should be 21:58.99 (A × 1.1, rounded to 1 decimal + 0.09) |

### Issue Key
- **Invalid format**: The time does not match the pattern `MM:SS.MS` or `SS.MS`, or exceed 60-second increment notation (e.g. `96.99` seconds).
- **Invalid progression**: The time does not fit in the expected "faster to slower" time progression for standards: `A < B+ < B`.

> 🪲 Encounter any other issues? Head over to the [Issues tab](https://github.com/ironprogrammer/swimcheck/issues) and let me know!

\* *Note that the OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections related to time standards.*

## Features

- **Mobile-First Design**: Optimized for use at swim meets on mobile devices
- **Time Comparison**: Compare swimmer times against A, B+, and B motivational standards
- **Visual Feedback**: Color-coded qualification levels for easy tracking
- **Persistent Storage**: All times and settings saved locally between sessions
- **Multi-Day Support**: Track times across multi-day swim meets
- **Course Support**: SCY (Short Course Yards), SCM (Short Course Meters), LCM (Long Course Meters)

## Usage

1. Select your **Age Group** from the dropdown
2. Choose **Gender** (Girls/Boys)
3. Select **Course Type** (SCY/SCM/LCM)
4. Enter your swim times in the "Your Time" column
5. Times are automatically evaluated and color-coded:
   - **Green**: A time qualified
   - **Blue**: B+ time qualified
   - **Yellow**: B time qualified
   - **Gray**: Did not qualify

All entered data is automatically saved to your browser's local storage.

## Time Format

Enter times in the format:
- `MM:SS.MS` for times over 1 minute (e.g., `1:28.19`)
- `SS.MS` for times under 1 minute (e.g., `28.45`)

## Data Source

Time standards are sourced from the [Oregon Swimming Time Standards](https://www.oregonswimming.org/page/competition/time-standards), which are typically updated 1-2 times per year.

## Development

Built with:
- Vanilla JavaScript (no framework dependencies)
- [Pico CSS](https://picocss.com/) for styling
- Local Storage API for data persistence

## Deployment

The app is automatically deployed to GitHub Pages on push to the main branch via GitHub Actions.

## License

MIT
