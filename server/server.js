// my first 2nd node.js server!
// trying to get used to commenting more
const express = require('express');
const sqlite3 = require('sqlite3').verbose();  // for database stuff
const cors = require('cors');  // had to add this because of some errors
const path = require('path');

const app = express();
const port = 3000;  // using port 3000 since thats what everyone uses
app.use(cors());
app.use(express.json());

// static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// connect to database
const db = new sqlite3.Database(path.join(__dirname, 'follower_data.db'), (err) => {
    if (err) {
        console.log('oh no database error:', err);
    } else {
        console.log('connected to database!');
        
        // make the table if we dont have it
        db.run(`CREATE TABLE IF NOT EXISTS follower_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            followers TEXT NOT NULL,
            following TEXT NOT NULL,
            UNIQUE(username, timestamp)
        )`, (err) => {
            if (err) {
                console.log('couldnt create table:', err);
            } else {
                console.log('table is ready!');
            }
        });
    }
});

// save new data
app.post('/api/follower-data', (req, res) => {
    let { username, timestamp, followers, following } = req.body;
    
    // first check what we had before
    db.get(
        'SELECT followers, following FROM follower_data WHERE username = ? ORDER BY timestamp DESC LIMIT 1',
        [username],
        (err, lastRow) => {
            if (err) {
                console.log('error getting old data:', err);
            }
            
            // save the new stuff
            db.run(
                'INSERT OR REPLACE INTO follower_data (username, timestamp, followers, following) VALUES (?, ?, ?, ?)',
                [username, timestamp, JSON.stringify(followers), JSON.stringify(following)],
                function(err) {
                    if (err) {
                        console.log('couldnt save data:', err);
                        res.status(500).json({ error: 'failed to save :(' });
                    } else {
                        // if we had old data, lets see what changed
                        if (lastRow) {
                            let oldFollowers = new Set(JSON.parse(lastRow.followers));
                            let oldFollowing = new Set(JSON.parse(lastRow.following));
                            let newFollowers = new Set(followers);
                            let newFollowing = new Set(following);
                            
                            // figure out who followed and unfollowed
                            let newPeople = followers.filter(f => !oldFollowers.has(f));
                            let leftPeople = Array.from(oldFollowers).filter(f => !newFollowers.has(f));
                            let startedFollowing = following.filter(f => !oldFollowing.has(f));
                            let stoppedFollowing = Array.from(oldFollowing).filter(f => !newFollowing.has(f));
                            
                            res.json({
                                id: this.lastID,
                                changes: {
                                    newFollowers: newPeople,
                                    lostFollowers: leftPeople,
                                    newFollowing: startedFollowing,
                                    unfollowed: stoppedFollowing
                                }
                            });
                        } else {
                            res.json({ id: this.lastID });
                        }
                    }
                }
            );
        }
    );
});

// get all the data for someone
app.get('/api/follower-data/:username', (req, res) => {
    let username = req.params.username;
    let limit = req.query.limit;
    
    let howMany = limit ? parseInt(limit) : 10;  // default to last 10
    
    db.all(
        'SELECT * FROM follower_data WHERE username = ? ORDER BY timestamp DESC LIMIT ?',
        [username, howMany],
        (err, rows) => {
            if (err) {
                console.log('error getting data:', err);
                res.status(500).json({ error: 'couldnt get the data' });
            } else {
                // turn the json strings back into arrays
                let data = rows.map(row => ({
                    ...row,
                    followers: JSON.parse(row.followers),
                    following: JSON.parse(row.following)
                }));
                
                // if we have enough data, show what changed
                if (data.length >= 2) {
                    let newest = data[0];
                    let older = data[1];
                    
                    let currentFollowers = new Set(newest.followers);
                    let oldFollowers = new Set(older.followers);
                    let currentFollowing = new Set(newest.following);
                    let oldFollowing = new Set(older.following);
                    
                    // figure out all the changes
                    let changes = {
                        newFollowers: newest.followers.filter(f => !oldFollowers.has(f)),
                        lostFollowers: Array.from(oldFollowers).filter(f => !currentFollowers.has(f)),
                        newFollowing: newest.following.filter(f => !oldFollowing.has(f)),
                        unfollowed: Array.from(oldFollowing).filter(f => !currentFollowing.has(f))
                    };
                    
                    res.json({ data, changes });
                } else {
                    res.json({ data });
                }
            }
        }
    );
});

// see whats changed between two dates
app.get('/api/follower-changes/:username', (req, res) => {
    let username = req.params.username;
    let { start, end } = req.query;
    
    db.all(
        'SELECT * FROM follower_data WHERE username = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
        [username, start, end],
        (err, rows) => {
            if (err) {
                console.log('error getting changes:', err);
                res.status(500).json({ error: 'couldnt get changes' });
            } else {
                let data = rows.map(row => ({
                    ...row,
                    followers: JSON.parse(row.followers),
                    following: JSON.parse(row.following)
                }));
                
                if (data.length >= 2) {
                    let oldest = data[data.length - 1];
                    let newest = data[0];
                    
                    let oldFollowers = new Set(oldest.followers);
                    let newFollowers = new Set(newest.followers);
                    let oldFollowing = new Set(oldest.following);
                    let newFollowing = new Set(newest.following);
                    
                    let changes = {
                        newFollowers: newest.followers.filter(f => !oldFollowers.has(f)),
                        lostFollowers: Array.from(oldFollowers).filter(f => !newFollowers.has(f)),
                        newFollowing: newest.following.filter(f => !oldFollowing.has(f)),
                        unfollowed: Array.from(oldFollowing).filter(f => !newFollowing.has(f))
                    };
                    
                    res.json({ changes });
                } else {
                    res.json({ changes: null });
                }
            }
        }
    );
});

// serve the results page for any path
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'results.html'));
});

// start the server!
app.listen(port, () => {
    console.log(`server is running at http://localhost:${port} :)`);
});
