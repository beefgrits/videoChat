# videoChat
Simple webRTC proof of concept with Google authentication and dynamic UI

AVstuff.js works along with the signaler node application to allow 2 authorized people to start a video conference. Developer must set the CLIENTID and signalingServer variables at the beginning of the script, and then the script may be added to a web page to display the video conference application. AVstuff is designed as a drop-in and go solution that generates all UI elements and CSS for the application, index.html is a bare minimum example that calls the script and lets it do its thing. 
