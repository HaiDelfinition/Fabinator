# Fabinator - Fab.com Auto-Licensing Script

## Overview

Fabinator is an automated script designed to streamline the process of licensing free assets from the Fab library. The script automatically detects free items on the current page, opens license modals, selects the appropriate license type, and adds items to your library.

## Features

- **Automatic Free Item Detection**: Intelligently identifies items marked as "Free" on the page
- **Smart License Selection**: Automatically selects Professional licenses when available, with optional Personal license fallback
- **Robust Modal Handling**: Waits for all modal elements to load completely before interaction, preventing timing-related errors
- **Real-time Statistics**: Live tracking of processed items, including Professional, Personal, and skipped items
- **Pause/Resume Functionality**: Control the automation process with start, pause, and stop controls
- **Activity Logging**: Detailed logging system with color-coded entries for easy monitoring
- **Minimizable GUI**: Clean, modern interface that can be toggled on/off as needed

## Installation

1. **Install a Userscript Manager**:
   - For Chrome/Edge: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - For Firefox: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or [Code Injector](https://addons.mozilla.org/en-US/firefox/addon/codeinjector/)
   - For Safari: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

2. **Install the Script**:
   - Open your userscript manager
   - Create a new script
   - Copy and paste the entire contents of `Fabinator.js`
   - Save the script

3. **Navigate to Quixel Megascans**:
   - Go to [fab.com](https://www.fab.com) (formerly Quixel Megascans)
   - The Fabinator GUI will appear automatically in the top-right corner as an arrow to click on, to open

## Usage

### Basic Operation

1. **Navigate to a Megascans Collection Page**: Make sure you're on a page that displays multiple asset items

2. **Open the GUI**: Click the toggle button (chevron icon) in the top-right corner to expand the control panel

3. **Configure Settings** (Optional):
   - Check "Allow Personal License as Alternative" if you want the script to fall back to Personal licenses when Professional licenses aren't free

4. **Start Processing**:
   - Click the **Start** button
   - The script will automatically process all free items on the page
   - Watch the real-time statistics and activity log for progress

5. **Control the Process**:
   - **Pause**: Temporarily halt processing (can be resumed)
   - **Stop**: Completely stop the automation
   - **Reset**: Clear all counters and start fresh

### GUI Elements

#### Statistics Panel
- **Professional**: Count of items licensed with Professional license
- **Personal**: Count of items licensed with Personal license
- **Skipped**: Count of items that were skipped (not free or unavailable)
- **Total Processed**: Total number of items examined

#### Control Buttons
- **Start**: Begin automated processing
- **Pause/Resume**: Toggle pause state during processing
- **Stop**: Halt processing completely
- **Reset**: Clear all statistics counters

#### Activity Log
- Real-time logging of all script actions
- Color-coded entries:
  - **Green**: Informational messages
  - **Yellow**: Warnings
  - **Red**: Errors
- Auto-scrolls to show latest entries
- Maintains last 100 log entries

## How It Works

### Detection Process

1. **Item Scanning**: The script scans all items on the page matching the configured selector
2. **Free Item Check**: Each item is examined for "From Free" pricing indicators
3. **Cart Button Location**: Finds the shopping cart button for free items
4. **Modal Interaction**: Clicks the cart button to open the license selection modal

### License Selection Logic

The script follows this decision tree:

```
Is Professional License Free?
├─ Yes → Select Professional → Add to Library
└─ No → Is "Personal Alternative" enabled?
    ├─ Yes → Is Personal License Free?
    │   ├─ Yes → Select Personal → Add to Library
    │   └─ No → Skip item
    └─ No → Skip item
```

### Modal Handling (Improved in Latest Version)

The script now includes robust waiting mechanisms:

1. **Wait for Modal Appearance**: Detects when the license modal opens
2. **Wait for Radio Buttons**: Ensures both Professional and Personal radio buttons are loaded
3. **Wait for Close Button**: Confirms the close button is available
4. **Additional Interaction Delay**: 500ms buffer to ensure elements are fully interactive
5. **Wait for Confirm Button**: Verifies the "Add" button is loaded and enabled before clicking

This multi-layer waiting system prevents timing-related failures that can occur with slower connections or delayed element rendering.

## Configuration

The script includes several configurable parameters at the top of the file:

```javascript
const config = {
  processingDelay: 500,        // Delay between processing items (ms)
  modalOpenDelay: 800,         // Delay after opening modal (ms)
  scrollDelay: 300,            // Delay for scroll animations (ms)
  highlightColor: "#d542b2",   // Color for highlighting current item
  // ... additional settings
};
```

### Advanced Configuration

You can modify these values to adjust script behavior:

- **processingDelay**: Increase if items are being processed too quickly
- **modalOpenDelay**: Increase if modals don't fully load before interaction
- **Selector Values**: Update if Fab.com changes their HTML structure

## Troubleshooting

### Script Doesn't Start
- Ensure you're on a valid Fab.com page with asset items
- Check browser console for error messages
- Verify the userscript manager is enabled

### Items Are Skipped
- Verify items are actually marked as "Free"
- Check if Professional license is required but not free
- Enable "Personal License as Alternative" option

### Modal Interaction Fails
- The improved version includes automatic waiting - this should now be resolved
- If issues persist, increase `modalOpenDelay` in config
- Check browser console for specific error messages

### GUI Doesn't Appear
- Refresh the page
- Check if userscript manager shows the script as active
- Look for JavaScript errors in browser console

## Safety Features

- **Visual Feedback**: Currently processing item is highlighted with cyan outline
- **Non-Destructive**: Script only adds free items to your library
- **Pausable**: Can be paused at any time without losing progress
- **Logging**: Complete activity log for reviewing actions taken

## Compatibility

- **Browsers**: Chrome, Firefox, Edge, Safari (with appropriate userscript manager)
- **Website**: Fab.com (formerly Quixel Megascans)
- **Last Updated**: January 2026

## Changelog

### Version 2.0 (Latest)
- **Improved Modal Handling**: Added robust waiting for all modal elements (radio buttons, close button, confirm button)
- **Better Error Recovery**: Enhanced error handling in modal interactions
- **More Detailed Logging**: Added logs for element loading status
- **Increased Reliability**: Prevents timing-related failures on slow connections

### Version 1.0
- Initial release with basic automation features

## Legal & Ethical Considerations

- This script automates interactions with Fab.com's website
- Only use this script for licensing **legitimately free** assets
- Respect Fab.com's terms of service
- The script does not bypass payment or licensing restrictions
- Use responsibly and at your own risk

## Support

For issues, questions, or contributions:
- Check the troubleshooting section above
- Review browser console for error messages
- Ensure you're using the latest version of the script

## License

This script is provided as-is for personal use. Modify and distribute freely with attribution.

---

**Note**: This is an unofficial community tool and is not affiliated with, endorsed by, or connected to Fab.com or Epic Games.
