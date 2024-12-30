// local server configuration
const SERVER_URL = 'http://localhost:3000';

// listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FOLLOWER_DATA') {
        saveFollowerData(message.data);
    } else if (message.type === 'ERROR') {
        console.error('Error from content script:', message.error);
    }
});

async function saveFollowerData(data) {
    try {
        const response = await fetch(`${SERVER_URL}/api/follower-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: data.username,
                timestamp: data.timestamp,
                followers: data.followers,
                following: data.following
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save data');
        }

        // open results page in new tab
        chrome.tabs.create({
            url: chrome.runtime.getURL('results.html') + `?username=${encodeURIComponent(data.username)}`
        });
    } catch (error) {
        console.error('Error saving data:', error);
        // notify popup about the error
        chrome.runtime.sendMessage({
            type: 'ERROR',
            error: 'Failed to save data: ' + error.message
        });
    }
}
