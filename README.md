# ESPN Fantasy Trade Evaluator

A Chrome extension that helps you evaluate fantasy football trades on ESPN Fantasy Football by analyzing player values directly from the page.

## Features

- **Automatic Player Detection**: Extracts player information from ESPN Fantasy Football pages
- **Trade Value Calculation**: Calculates trade values based on projected points, recent performance, and ADP
- **Position-Based Analysis**: Organizes players by position (QB, RB, WR, TE, FLEX, D/ST, K)
- **Easy Player Selection**: Choose players from dropdowns to see their calculated trade values

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The ESPN Trade Evaluator icon should appear in your Chrome toolbar

## How to Use

1. Navigate to any ESPN Fantasy Football page (e.g., your team roster, trade proposals, player lists)
2. Click the extension icon in your Chrome toolbar
3. The popup will display fantasy positions with available players
4. For positions with multiple players, select a player from the dropdown
5. View the calculated trade value for each player

## Trade Value Calculation

The extension calculates trade values using the following formula:

- **Projected Points**: 2.0x weight
- **Recent Points**: 1.5x weight  
- **ADP (Average Draft Position)**: Bonus factor based on draft position
- **Position Adjustments**: QB (0.95x), TE (0.9x)

Values are normalized to a 0-200 scale for easy comparison.

## Files

- `manifest.json` - Chrome extension configuration
- `background.js` - Background service worker
- `content.js` - Content script that extracts player data from ESPN pages
- `popup.html` - Extension popup interface
- `popup.js` - Popup logic for displaying players and trade values
- `styles.css` - Styling for the extension UI

## Compatibility

- **Platform**: Chrome/Chromium-based browsers (Manifest V3)
- **Website**: ESPN Fantasy Football (`https://fantasy.espn.com/*`)

## Limitations

- Only works on ESPN Fantasy Football pages
- Trade values are heuristic estimates based on available data
- Accuracy depends on the data visible on the current page

## Contributing

Feel free to submit issues or pull requests to improve the extension!

## License

This project is open source and available for personal use.

---

**Note**: This extension is not affiliated with or endorsed by ESPN.