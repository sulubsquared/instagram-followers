console.log('Follower Tracker for Instagram: Popup script loaded');

document.getElementById('trackButton').addEventListener('click', async () => {
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Checking current tab...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current tab:', tab);
        
        if (!tab.url.includes('instagram.com')) {
            statusElement.textContent = 'Please navigate to an Instagram profile first';
            return;
        }

        // check if we're on a profile page
        const urlParts = new URL(tab.url).pathname.split('/').filter(Boolean);
        console.log('URL parts:', urlParts);
        
        if (urlParts.length !== 1) {
            statusElement.textContent = 'Please navigate to an Instagram profile page (e.g., instagram.com/username)';
            return;
        }

        // inject content script if not already injected
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // this will throw if content script is not injected
                    chrome.runtime.connect();
                }
            });
        } catch (error) {
            console.log('Content script not injected, refreshing page...');
            await chrome.tabs.reload(tab.id);
            // wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // check if the user is logged in
        statusElement.textContent = 'Checking login status...';
        chrome.tabs.sendMessage(tab.id, { action: 'CHECK_LOGIN' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error checking login:', chrome.runtime.lastError);
                statusElement.textContent = 'Please refresh the page and try again';
                return;
            }

            console.log('Login check response:', response);
            
            if (!response || !response.loggedIn) {
                statusElement.textContent = 'Please log in to Instagram first';
                return;
            }

            statusElement.textContent = 'Starting data extraction... Please wait and do not close any dialogs that appear.';
            
            // send message to content script
            chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_DATA' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error starting extraction:', chrome.runtime.lastError);
                    statusElement.textContent = 'Error: Please refresh the Instagram page and try again';
                    return;
                }
                
                console.log('Extraction response:', response);
                
                if (response && response.status === 'started') {
                    statusElement.textContent = 'Extracting data... This may take a few minutes. Please keep the Instagram tab open.';
                }
            });
        });

    } catch (error) {
        console.error('Error in popup:', error);
        statusElement.textContent = 'Error: ' + error.message;
    }
});

// listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    const statusElement = document.getElementById('status');
    
    if (message.type === 'ERROR') {
        statusElement.textContent = 'Error: ' + message.error;
    } else if (message.type === 'FOLLOWER_DATA') {
        statusElement.textContent = 'Data extracted successfully! Opening results...';
    }
});
