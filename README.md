# Follower Tracker for Instagram

Track your Instagram followers and see who unfollowed you. This Chrome extension helps you keep track of your Instagram followers and following.

## Features

- Track followers and following
- See who unfollowed you
- See who doesn't follow you back
- See who you don't follow back
- Historical tracking of follower changes
- Local data storage using SQLite

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Start the local server:
```bash
node server/server.js
```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Usage

1. Make sure the local server is running
2. Go to any Instagram profile
3. Click the extension icon
4. Click "Track Followers"
5. Wait for the data to be collected
6. View the results in the new tab

## Dependencies

- Node.js
- Express
- SQLite3
- CORS

## Development

The extension uses a local SQLite database to store follower data. The database file will be created automatically when you first run the server.

### Project Structure

```
├── manifest.json           # Extension manifest
├── popup.html             # Extension popup
├── popup.js               # Popup logic
├── content.js             # Content script for Instagram
├── background.js          # Background script
├── results.html           # Results page
├── results.js             # Results page logic
└── server/
    └── server.js         # Local server with SQLite
```

## Notes

- The extension needs to be connected to the local server to work
- Make sure you're logged into Instagram before using the extension
- The data is stored locally in a SQLite database
