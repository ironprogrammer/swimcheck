# Swim Check 🏊

A mobile-first single-page app for tracking swim times against Oregon Swimming (OSI) motivational time standards.

> Encounter an issue? Head over to the [Issues tab](https://github.com/ironprogrammer/swimcheck/issues) and let me know!

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
