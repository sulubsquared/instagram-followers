// this shows all the instagram data we got!
const SERVER_URL = 'http://localhost:3000';

// get the username from the url
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

if (!username) {
    showError('hey you need to give me a username!');
} else {
    fetchData();
    updateProfileInfo();
}

// update the profile section with basic info
function updateProfileInfo() {
    // update username
    document.getElementById('profileUsername').textContent = `@${username}`;
}

// get all the data from the server
async function fetchData() {
    try {
        let response = await fetch(
            `${SERVER_URL}/api/follower-data/${encodeURIComponent(username)}`
        );
        
        if (!response.ok) {
            throw new Error('couldnt get the data :(');
        }
        
        let { data, changes } = await response.json();
        
        if (!data || data.length === 0) {
            showError('no data for this person yet');
            return;
        }

        // get the newest data
        let newest = data[0];
        let currentFollowers = new Set(newest.followers);
        let currentFollowing = new Set(newest.following);
        
        // update follower and following counts in profile section
        document.getElementById('followerCount').textContent = 
            formatNumber(currentFollowers.size);
        document.getElementById('followingCount').textContent = 
            formatNumber(currentFollowing.size);
        
        // show when we got the data
        document.getElementById('timestamp').textContent = 
            `last checked: ${new Date(newest.timestamp).toLocaleString()}`;
        
        // find who doesnt follow back
        let meanPeople = Array.from(currentFollowing)
            .filter(user => !currentFollowers.has(user));
        updateList('notFollowingBack', meanPeople);
        
        // find who we dont follow back
        let peopleWeDontFollow = Array.from(currentFollowers)
            .filter(user => !currentFollowing.has(user));
        updateList('youDontFollowBack', peopleWeDontFollow);
        
        // show what changed since last time
        if (changes) {
            // who unfollowed us
            updateList('recentUnfollowers', changes.lostFollowers, true);
            
            // who followed us
            updateList('recentNewFollowers', changes.newFollowers, true);
            
            // add times to show when stuff changed
            if (data.length > 1) {
                let oldTime = new Date(data[1].timestamp).toLocaleString();
                let newTime = new Date(newest.timestamp).toLocaleString();
                
                addTimeToSection('recentUnfollowers', oldTime, newTime);
                addTimeToSection('recentNewFollowers', oldTime, newTime);
            }
        } else {
            updateList('recentUnfollowers', []);
            updateList('recentNewFollowers', []);
        }

        // show everything
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        
        // update all the numbers
        updateStats({
            totalFollowers: currentFollowers.size,
            totalFollowing: currentFollowing.size,
            notFollowingBack: meanPeople.length,
            dontFollowBack: peopleWeDontFollow.length,
            recentUnfollowers: changes?.lostFollowers?.length || 0,
            recentNewFollowers: changes?.newFollowers?.length || 0
        });

    } catch (error) {
        console.log('uh oh something went wrong:', error);
        showError('failed to get data: ' + error.message);
    }
}

// format numbers to be more readable (e.g., 1.2k)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// show a list of users
function updateList(elementId, users, showTime = false) {
    let element = document.getElementById(elementId);
    element.innerHTML = users.length > 0 
        ? users.map(user => `
            <div class="user-item">
                <a href="https://instagram.com/${encodeURIComponent(user)}" target="_blank" class="instagram-link">@${user}</a>
            </div>
        `).join('')
        : '<div class="user-item">none</div>';
}

// add times to show when changes happened
function addTimeToSection(elementId, fromTime, toTime) {
    let element = document.getElementById(elementId).parentElement;
    let timeDiv = document.createElement('div');
    timeDiv.className = 'timestamp-range';
    timeDiv.textContent = `changes from ${fromTime} to ${toTime}`;
    element.insertBefore(timeDiv, element.firstChild.nextSibling);
}

// update all the numbers at the top
function updateStats(stats) {
    let statsHtml = `
        <div class="stats-summary">
            <div class="stat-item">
                <span class="stat-label">total followers:</span>
                <span class="stat-value">${stats.totalFollowers}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">total following:</span>
                <span class="stat-value">${stats.totalFollowing}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">not following back:</span>
                <span class="stat-value">${stats.notFollowingBack}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">you dont follow back:</span>
                <span class="stat-value">${stats.dontFollowBack}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">recent unfollowers:</span>
                <span class="stat-value">${stats.recentUnfollowers}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">recent new followers:</span>
                <span class="stat-value">${stats.recentNewFollowers}</span>
            </div>
        </div>
    `;
    
    let statsElement = document.createElement('div');
    statsElement.innerHTML = statsHtml;
    document.getElementById('content').insertBefore(statsElement, document.querySelector('.stats-container'));
}

// show error messages
function showError(message) {
    let errorBox = document.getElementById('error');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}
