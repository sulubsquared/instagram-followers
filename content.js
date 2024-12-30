// hey this is my instagram follower tracker personal project!
// made by sulubsq
console.log('is this thing on?');

// this gets all the follower data
async function extractFollowerData() {
    console.log('ok lets get the data...');
    let followers = new Set();  
    let following = new Set();

    try {
        // first gotta get the user id
        let userId = await getUserId();
        if (!userId) {
            throw new Error('couldnt find user id');
        }
        console.log('got the user id:', userId);

        // now get followers
        console.log('getting followers...');
        let followerUsers = await fetchFollowers(userId);
        followerUsers.forEach(user => followers.add(user));
        console.log('got ' + followers.size + ' followers!');

        // and following
        console.log('getting following...');
        let followingUsers = await fetchFollowing(userId);
        followingUsers.forEach(user => following.add(user));
        console.log('got ' + following.size + ' following!');

        // send everything back
        let data = {
            type: 'FOLLOWER_DATA',
            data: {
                timestamp: new Date().toISOString(), 
                username: window.location.pathname.split('/')[1],
                followers: Array.from(followers),
                following: Array.from(following)
            }
        };
        
        console.log('sending all the data back!');
        chrome.runtime.sendMessage(data);

    } catch (error) {
        console.log('uh oh something went wrong:', error);
        chrome.runtime.sendMessage({
            type: 'ERROR',
            error: error.message
        });
    }
}

// this gets the instagram user id
async function getUserId() {
    // try to find it in the meta tags first
    let idFromMeta = document.querySelector('meta[property="instapp:owner_user_id"]');
    if (idFromMeta) {
        return idFromMeta.content;
    }

    // maybe check the page data?
    let pageData = window._sharedData || {};
    let userData = pageData.entry_data?.ProfilePage?.[0]?.graphql?.user;
    if (userData?.id) {
        return userData.id;
    }

    // ok now lets try the api
    let username = window.location.pathname.split('/')[1];
    let response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
            'x-ig-app-id': '936619743392459',  // network tab thing
            'x-requested-with': 'XMLHttpRequest'
        }
    });
    
    if (!response.ok) {
        throw new Error('couldnt get user id from api :(');
    }

    let data = await response.json();
    return data.data?.user?.id;
}

// this gets all the followers
async function fetchFollowers(userId, after = null) {
    let users = [];
    let howMany = 50;
    
    try {
        let vars = {
            id: userId,
            first: howMany,
            after: after
        };

        let response = await fetch(
            `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=${encodeURIComponent(JSON.stringify(vars))}`,
            {
                headers: {
                    'x-requested-with': 'XMLHttpRequest'
                }
            }
        );

        if (!response.ok) {
            throw new Error('couldnt get followers');
        }

        let data = await response.json();
        let edges = data.data?.user?.edge_followed_by?.edges || [];
        let pageInfo = data.data?.user?.edge_followed_by?.page_info;

        // add all the usernames we got
        users.push(...edges.map(edge => edge.node.username));

        // if theres more, get those too
        if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
            let moreUsers = await fetchFollowers(userId, pageInfo.end_cursor);
            users.push(...moreUsers);
        }

    } catch (error) {
        console.log('uh oh error getting followers:', error);
    }

    return users;
}

// this gets all the following
async function fetchFollowing(userId, after = null) {
    let users = [];
    let howMany = 50;
    
    try {
        let vars = {
            id: userId,
            first: howMany,
            after: after
        };

        let response = await fetch(
            `https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=${encodeURIComponent(JSON.stringify(vars))}`,
            {
                headers: {
                    'x-requested-with': 'XMLHttpRequest'
                }
            }
        );

        if (!response.ok) {
            throw new Error('couldnt get following');
        }

        let data = await response.json();
        let edges = data.data?.user?.edge_follow?.edges || [];
        let pageInfo = data.data?.user?.edge_follow?.page_info;

        users.push(...edges.map(edge => edge.node.username));

        if (pageInfo?.has_next_page && pageInfo?.end_cursor) {
            let moreUsers = await fetchFollowing(userId, pageInfo.end_cursor);
            users.push(...moreUsers);
        }

    } catch (error) {
        console.log('oops error getting following:', error);
    }

    return users;
}

// listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('got a message:', request);
    if (request.action === 'EXTRACT_DATA') {
        console.log('time to get the data!');
        extractFollowerData();
        sendResponse({status: 'started'});
    } else if (request.action === 'CHECK_LOGIN') {
        console.log('checking if logged in');
        // check if we can see dm icon or profile stuff
        let isLoggedIn = !!(
            document.querySelector('a[href="/direct/inbox/"]') ||
            document.querySelector('span[class*="_aaav"]') ||
            document.querySelector('a[href*="/following"]') ||
            document.querySelector('a[href*="/followers"]') ||
            document.querySelector('svg[aria-label="Settings"]')
        );
        console.log('logged in?', isLoggedIn);
        sendResponse({loggedIn: isLoggedIn});
    }
    return true;
});
