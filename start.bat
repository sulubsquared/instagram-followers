@echo off
echo.
echo  _           _                                     __      _ _                            
echo (_)         ^| ^|                                   / _^|    ^| ^| ^|                           
echo  _ _ __  ___^| ^|_ __ _  __ _ _ __ __ _ _ __ ___   ^| ^|_ ___^| ^| ^| _____      _____ _ __ ___ 
echo ^| ^| '_ \/ __^| __/ _` ^|/ _` ^| '__/ _` ^| '_ ` _ \  ^|  _/ _ \^| ^| ^|/ _ \ \ /\ / / _ \ '__/ __^|
echo ^| ^| ^| ^| \__ \ ^|^| (_^| ^| (_^| ^| ^| ^| (_^| ^| ^| ^| ^| ^| ^| ^|^| (_) ^| ^| ^| (_) \ V  V /  __/ ^|  \__ \
echo ^|_^|_^| ^|_^|___/\__\__,_^|\__, ^|_^|  \__,_^|_^| ^|_^| ^|_^| ^|_^| \___/^|_^|_^|\___/ \_/\_/ \___^|_^|  ^|___/
echo                         __/ ^|                                                              
echo                        ^|___/                                                               
echo.
echo starting instagram follower tracker server...
echo.
echo IMPORTANT!!: make sure u add the extension to chrome:
echo 1. go to chrome://extensions/
echo 2. enable "Developer mode" in the top right
echo 3. click "Load unpacked" and select the extension folder
echo.

cd server

:: Check if node_modules exists
if not exist "node_modules\" (
    echo installing dependencies...
    npm install
    echo.
)

:: Start the server
echo server starting at http://localhost:3000
echo press Ctrl+C to stop the server
echo.
node server.js

pause
