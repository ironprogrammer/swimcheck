# Swim Check 🏊

A mobile-first single-page app for tracking swim times against [Oregon Swimming (OSI)](https://www.oregonswimming.org) motivational time standards.

Not in Oregon and want to see your state's motivational data? [Start a discussion](https://github.com/ironprogrammer/swimcheck/discussions/6) or [drop me a line](https://brianalexander.com) and let's talk!

## Do you find this app useful?

Please consider helping me cover my kid's swim meet fees!

<a href="https://www.buymeacoffee.com/ironprogrammer" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Data Source

Time standards are sourced from the [Oregon Swimming Time Standards](https://www.oregonswimming.org/page/competition/time-standards), which are typically updated 1-2 times per year.

<!-- AUTO-GENERATED-CURRENT-STANDARDS:START -->
**Current standards:** [2026-2027 OSI Time Standards A/B+/B](https://www.oregonswimming.org/wzorlsc/UserFiles/Image/QuickUpload/2026-2027-time-standards_056854.pdf)
<!-- AUTO-GENERATED-CURRENT-STANDARDS:END -->

## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site\*, and are highlighted in the app:

<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:START -->
| Age/Gender | Event      | Course | Standard | Value       | Issue              |
| ---------- | ---------- | ------ | -------- | ----------- | ------------------- |
| Boys 11 | 1500 Free | SCM | B | `23:42.79⚠️` | Invalid progression: B should be 23:42.89 |
| Boys 12 | 1500 Free | SCM | B | `23:42.79⚠️` | Invalid progression: B should be 23:42.89 |
| Boys 12 | 200 Breast | SCY | B+ | `2:98.79⚠️` | Invalid format |
| Boys 13 | 1500 Free | SCM | B | `23:42.79⚠️` | Invalid progression: B should be 23:42.89 |
| Boys 13 | 400 Free | SCM | B | `5:98.99⚠️` | Invalid format |
| Girls 14 | 800 Free | SCM | B+ | `11:48.69⚠️` | Invalid progression: B+ should be 11:48.79 |
| Girls 14 | 800 Free | SCM | B | `12:22.39⚠️` | Invalid progression: B should be 12:22.49 |
| Boys 14 | 200 Free | SCY | B+ | `2:05.49⚠️` | Invalid progression: B+ should be 2:09.89 |
| Boys 15 & Over* | 1500 Free | SCM | B | `21:59.09⚠️` | Invalid progression: B should be 21:58.99 |
<!-- AUTO-GENERATED-INCONSISTENCIES-TABLE:END -->

### Issue Key
- **Invalid format**: The time does not match the pattern `MM:SS.MS` or `SS.MS`, or exceed 60-second increment notation (e.g. `96.99` seconds).
- **Invalid progression**: The time does not fit in the expected "faster to slower" time progression calculation for standards: `A < B+ < B`.

> 🪲 Encounter any other issues? Head over to the [Issues tab](https://github.com/ironprogrammer/swimcheck/issues) and let me know!

\* *Note that the OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections related to time standards.*

## Features

- **Mobile-First Design**: Optimized for use at swim meets on mobile devices
- **Time Comparison**: Compare swimmer times against A, B+, and B motivational standards
- **Visual Feedback**: Color-coded qualification levels for easy tracking
- **Persistent Storage**: All times and settings saved locally between sessions
- **Multi-Day Support**: Track times across multi-day swim meets

## Usage

Here are the basics. See the [wiki](https://github.com/ironprogrammer/swimcheck/wiki) for more detailed instructions.

1. Select your **Age Group** from the dropdown
2. Choose **Gender** (Girls/Boys)
3. Select **Course Type** (SCY/SCM/LCM)
4. Enter your swim times in the "Your Time" column
   - Format: `MM:SS.MS` for times over 1 minute (e.g., `1:28.19`)
   - Format: `SS.MS` for times under 1 minute (e.g., `28.45`)
5. Times are automatically evaluated and color-coded:
   - **Green**: A time qualified
   - **Blue**: B+ time qualified
   - **Yellow**: B time qualified
   - **Gray**: Did not qualify

All entered data is automatically saved to your browser's local storage.

## Development

Built with:
- Vanilla JavaScript (no framework dependencies)
- [Pico CSS](https://picocss.com/) for styling
- Local Storage API for data persistence

## Deployment

The app is automatically deployed to GitHub Pages on push to the main branch via GitHub Actions.

## License

MIT
