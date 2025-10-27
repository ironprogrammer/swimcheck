# Swim Check 🏊

A mobile-first single-page app for tracking swim times against [Oregon Swimming (OSI)](https://www.oregonswimming.org) motivational time standards.

## Do you find this app useful?

Please consider helping me cover my kid's swim meet fees!

<a href="https://www.buymeacoffee.com/ironprogrammer" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Data Inconsistencies ⚠️

The following issues were observed in the source data from the OSI site, and are highlighted in the app:

| Age/Gender | Event      | Course | Standard | Value       | Issue              |
| ---------- | ---------- | ------ | -------- | ----------- | ------------------- |
| Girls 9 | 100 Breast | LCM | A | `1:96.99⚠️` | Invalid format |
| Girls 10 | 100 Fly | LCM | B+ | `125:79.19⚠️` | Invalid format |
| Girls 13 | 200 Breast | SCM | B | `2:51.89⚠️` | Invalid progression |
| Girls 14 | 200 IM | SCM | B | `2:97.49⚠️` | Invalid format |
| Boys 14 | 1500 Free | LCM | B | `22:62.29⚠️` | Invalid format |
| Boys 14 | 800 Free | LCM | B | `11:82.09⚠️` | Invalid format |

\* *The OSI PDF may contain errors, and so can this app! Refer directly to OSI for questions/corrections.*

> 🪲 Encounter any other issues? Head over to the [Issues tab](https://github.com/ironprogrammer/swimcheck/issues) and let me know!

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
