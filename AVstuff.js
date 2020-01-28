"use strict"

const CLIENTID = 'your-client-id' // Change to your Google API Client ID
const signalingServer = 'wss://node.app.url' // Change to the URL of your running signaling server websocket app

var accessToken, user, localStream, remoteStream, socket, peerConnection

const webRTCAdapter = document.createElement('script')
webRTCAdapter.src = 'https://webrtc.github.io/adapter/adapter-latest.js'
webRTCAdapter.async = false
document.head.appendChild(webRTCAdapter)

const googleLibrary = document.createElement('script')
googleLibrary.src = 'https://apis.google.com/js/platform.js'
googleLibrary.async = true
googleLibrary.defer = true
document.head.appendChild(googleLibrary)

const googleScopes = document.createElement('meta')
googleScopes.name = 'google-signin-scope'
googleScopes.content = 'profile email'
document.head.appendChild(googleScopes)

const googleClientID = document.createElement('meta')
googleClientID.name = 'google-signin-client_id'
googleClientID.content = CLIENTID + '.apps.googleusercontent.com'
document.head.appendChild(googleClientID)

const iphone = document.createElement('meta')
iphone.name = 'apple-mobile-web-app-capable'
iphone.content = 'yes'
document.head.appendChild(iphone)

const uiScale = document.createElement('meta')
uiScale.name = 'viewport'
uiScale.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
document.head.appendChild(uiScale)

const stylesheet = document.createElement('style')
stylesheet.type = 'text/css'
stylesheet.appendChild(document.createTextNode('input[type=text], select {width: 100%;padding: 12px;border: 1px solid #ccc;border-radius: 4px;box-sizing: border-box;resize: vertical;}'))
stylesheet.appendChild(document.createTextNode('label {padding: 12px 12px 12px 0;display: inline;}'))
stylesheet.appendChild(document.createTextNode('input[type=submit] {background-color: #40aaff;color: white;padding: 12px 20px;border: none;border-radius: 4px;cursor: pointer;float: right;}'))
stylesheet.appendChild(document.createTextNode('input[type=submit]:disabled {background-color: #aaaaaa;color: white;padding: 12px 20px;border: none;border-radius: 4px;cursor: pointer;float: right;}'))
stylesheet.appendChild(document.createTextNode('video {height: 100%;width: 100%;}'))
stylesheet.appendChild(document.createTextNode('.container {border-radius: 5px;background-color: #dddddd;padding: 20px;}'))
stylesheet.appendChild(document.createTextNode('.labelDiv {float: left;width: 20%;margin-top: 6px;}'))
stylesheet.appendChild(document.createTextNode('.selectDiv {float: left;width: 80%;margin-top: 6px;}'))
stylesheet.appendChild(document.createTextNode('.profile {border-radius: 5px;top: 0px;left: 0px;}'))
stylesheet.appendChild(document.createTextNode('.remoteViewDiv {background-color: #000000;top: 0px;right: 0px;left: 0px;bottom: 0px;position: absolute;z-index: 1;}'))
stylesheet.appendChild(document.createTextNode('.localViewDiv {background-color: #000000;top: 50px;left: 50px;width: 20%;height: 20%;position: absolute;z-index: 2;}'))
stylesheet.appendChild(document.createTextNode('.row:after {content: "";display: table;clear: both;}'))
stylesheet.appendChild(document.createTextNode('@media screen and (max-width: 600px) {.labelDiv, .selectDiv, input[type=submit] {width: 100%;margin-top: 0;}}'))
document.head.appendChild(stylesheet)

const avSelectDiv = document.createElement('div')
avSelectDiv.className = 'container'
document.body.appendChild(avSelectDiv)

const googleLogin = document.createElement('div')
googleLogin.className = 'g-signin2'
googleLogin.setAttribute('data-onsuccess', 'onSignIn')
googleLogin.setAttribute('data-theme', 'dark')
avSelectDiv.appendChild(googleLogin)

const profileDiv = document.createElement('div')
profileDiv.className = 'profile'
avSelectDiv.appendChild(profileDiv)
const profilePicture = document.createElement('img')
profileDiv.appendChild(profilePicture)

const row1Div = document.createElement('div')
row1Div.className = 'row'
avSelectDiv.appendChild(row1Div)
const audioLabelDiv = document.createElement('div')
audioLabelDiv.className = 'labelDiv'
row1Div.appendChild(audioLabelDiv)
const audioLabel = document.createElement('label')
audioLabel.htmlFor = 'audioSelect'
audioLabel.innerHTML = 'Mic'
audioLabelDiv.appendChild(audioLabel)
const audioSelectDiv = document.createElement('div')
audioSelectDiv.className = 'selectDiv'
row1Div.appendChild(audioSelectDiv)
const audioSelect = document.createElement('select')
audioSelect.id = 'audioSelect'
audioSelectDiv.appendChild(audioSelect)
const noMic = document.createElement('option')
noMic.text = "No Microphone"
noMic.selected = true
noMic.value = false
audioSelect.appendChild(noMic)

const row2Div = document.createElement('div')
row2Div.className = 'row'
avSelectDiv.appendChild(row2Div)
const videoLabelDiv = document.createElement('div')
videoLabelDiv.className = 'labelDiv'
row2Div.appendChild(videoLabelDiv)
const videoLabel = document.createElement('label')
videoLabel.htmlFor = "videoSelect"
videoLabel.innerHTML = "Camera"
videoLabelDiv.appendChild(videoLabel)
const videoSelectDiv = document.createElement('div')
videoSelectDiv.className = 'selectDiv'
row2Div.appendChild(videoSelectDiv)
const videoSelect = document.createElement('select')
videoSelect.id = 'videoSelect'
videoSelectDiv.appendChild(videoSelect)
const noCamera = document.createElement('option')
noCamera.text = "No Camera"
noCamera.selected = true
noCamera.value = false
videoSelect.appendChild(noCamera)

const row3Div = document.createElement('div')
row3Div.className = 'row'
avSelectDiv.appendChild(row3Div)
const userLabelDiv = document.createElement('div')
userLabelDiv.className = 'labelDiv'
row3Div.appendChild(userLabelDiv)
const userLabel = document.createElement('label')
userLabel.htmlFor = "userSelect"
userLabel.innerHTML = "Online Users"
userLabelDiv.appendChild(userLabel)
const userSelectDiv = document.createElement('div')
userSelectDiv.className = 'selectDiv'
row3Div.appendChild(userSelectDiv)
const userSelect = document.createElement('select')
userSelect.id = 'userSelect'
userSelectDiv.appendChild(userSelect)

const row4Div = document.createElement('div')
row4Div.className = 'row'
avSelectDiv.appendChild(row4Div)
const callSwitch = document.createElement('input')
callSwitch.type = "submit"
callSwitch.disabled = true
callSwitch.value = "Start Conference"
callSwitch.onclick = startCall
row4Div.appendChild(callSwitch)

const localViewDiv = document.createElement('div')
localViewDiv.className = "localViewDiv"
localViewDiv.hidden = true
document.body.appendChild(localViewDiv)

const localView = document.createElement('video')
localView.setAttribute("playsinline",null)
localView.muted = true
localView.autoplay = true
localViewDiv.appendChild(localView)

const remoteViewDiv = document.createElement('div')
remoteViewDiv.className = "remoteViewDiv"
remoteViewDiv.hidden = true
document.body.appendChild(remoteViewDiv)

const remoteView = document.createElement('video')
remoteView.setAttribute("playsinline",null)
remoteView.muted = false
remoteView.autoplay = true
remoteViewDiv.appendChild(remoteView)

navigator.mediaDevices.enumerateDevices().then(initialize).catch(handleError)

function connectWebsocket () {
    socket = new WebSocket(signalingServer)

    socket.onopen = function () {
        socket.send(JSON.stringify({action: 'id', token: accessToken.access_token}))
    }

    socket.onmessage = function (message) {
        let data = JSON.parse(message.data)
        switch (data.action) {
            case 'offer':
                handleOffer(data)
                break
            case 'answer':
                handleAnswer(data)
                break
            case 'candidate':
                handleCandidate(data)
                break
            case 'connected':
                console.log(data.name + " connected.")
                const newUser = document.createElement('option')
                newUser.text = data.name
                newUser.value = data.email
                newUser.id = data.email
                userSelect.appendChild(newUser)
                callSwitch.disabled = false
                break
            case 'disconnected':
                console.log(data.user + " left the server.")
                const userRemove = document.getElementById(user.user)
                userSelect.remove(userRemove)
                break
            case 'unknown':
                console.log("Unknown command: ", data.data)
                break
            case 'unauthorized':
                console.log("Unauthorized connection.")
                break
            case 'identified':
                console.log("Connected to signaling server as " + data.user)
                profilePicture.src = user.getImageUrl()
                profilePicture.height = 50
                profilePicture.width = 50
                const userList = data.userList.users
                userList.forEach(function (otherUser) {
                    console.log("found user " + otherUser.name)
                    const newUser = document.createElement('option')
                    newUser.value = otherUser.email
                    newUser.text = otherUser.name
                    newUser.id = otherUser.email
                    userSelect.appendChild(newUser)
                    callSwitch.disabled = false
               	})
                break
            default:
                console.log(data.user + " sent action: " + data.action + ". This is being ignored.")
                break
        }
    }
}

function onSignIn(googleUser) {
    user = googleUser.getBasicProfile()
    accessToken = googleUser.getAuthResponse()
    console.log(user.getName())
    googleLogin.hidden = true
    connectWebsocket()
}

function initialize(deviceInfos) {
    var hasMic = false, hasCamera = false
        deviceInfos.forEach(function(deviceInfo) {
        if (deviceInfo.kind === 'audioinput') {
            hasMic = true
        }
        else if (deviceInfo.kind === 'videoinput') {
            hasCamera = true
        }
    })
    if (hasMic || hasCamera) {
        navigator.mediaDevices.getUserMedia(JSON.parse('{"audio": "' + hasMic + '", "video": "' + hasCamera + '"}')).then(function (stream) {
            localStream = stream
            navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
                deviceInfos.forEach(function(deviceInfo) {
                    const option = document.createElement('option')
                    option.value = deviceInfo.deviceId
                    localStream.getTracks().forEach(function(track) {
                        if (track.getSettings().deviceId === deviceInfo.deviceId) {
                            option.selected = true
                        }
                    })
                    if (deviceInfo.kind === 'audioinput') {
                        option.text = deviceInfo.label || 'microphone ' + (audioSelect.length + 1)
                        audioSelect.appendChild(option)
                    } else if (deviceInfo.kind === 'videoinput') {
                        option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1)
                        videoSelect.appendChild(option)
                    } else {
                        console.log('Found another kind of device: ', deviceInfo)
                    }
                })
            }).then(function () {
                localStream.getTracks().forEach(function(track) {
                    track.stop()
                })
                localStream = null
            }).catch(handleError)
        }).catch(handleError)
    }
    else {
        window.alert("Unable to detect microphone or camera.")
    }
}

function startCall () {
    createPeerConnection()
    
    avSelectDiv.hidden = true
    localViewDiv.hidden = false
    remoteViewDiv.hidden = false
    if (audioSelect.value =="false" && videoSelect.value == "false") {
        alert("Mic or Camera required for conference.")
        return
    }
    const audioValue = (audioSelect.value == "false") ? 'false': '{"deviceId": {"exact": "' + audioSelect.value + '"}}'
    const videoValue = (videoSelect.value == "false") ? 'false': '{"deviceId": {"exact": "' + videoSelect.value + '"}}'
    navigator.mediaDevices.getUserMedia(JSON.parse('{"audio": ' + audioValue + ', "video": ' + videoValue + '}')).then(function (stream) {
        localStream = stream
        localView.srcObject = localStream
        localView.play()
        localStream.getTracks().forEach(function (track) {
            console.log("Adding track: " + track + " to peer connection.")
            track.enabled = true
            peerConnection.addTrack(track, localStream)
        })
    }).then(function () {
        peerConnection.createOffer().then(function (offer) {
            socket.send(JSON.stringify({user: userSelect.value, action: 'offer', offer: offer}))
            peerConnection.setLocalDescription(offer)
        }).catch(handleError)
    }).catch(handleError)
}

function createPeerConnection () {
    peerConnection = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]})
    
    peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
            console.log(event.candidate)
            socket.send(JSON.stringify({user: userSelect.value, action: 'candidate', candidate: event.candidate}))
        } else {
            console.log("All ICE candidates have been sent.")
            socket.send(JSON.stringify({user: userSelect.value, action: 'candidate', candidate: event.candidate}))
        }
    }
    
    peerConnection.ontrack = function (event) {
        console.log("Remote track received.")
        if (typeof event.streams[0] !== 'undefined') {
            console.log("Adding remote stream.")
            remoteView.srcObject = event.streams[0]
        }
        else if (typeof remoteStream == 'undefined') {
            console.log("Initializing remote stream object.")
            remoteStream = new MediaStream();
            remoteView.srcObject = remoteStream
            console.log("Adding track to remote stream.")
            remoteStream.addTrack(event.track);
        }
        else {
            console.log("Adding track to remote stream.")
            remoteStream.addTrack(event.track);
        }
    }
}

function handleOffer (event) {
    createPeerConnection()
    peerConnection.setRemoteDescription(event.offer)
    const otherUser = document.getElementById(event.user)
    otherUser.selected = true
    avSelectDiv.hidden = true
    localViewDiv.hidden = false
    remoteViewDiv.hidden = false
    if (audioSelect.value =="false" && videoSelect.value == "false") {
        alert("Mic or Camera required for conference.")
        return
    }
    const audioValue = (audioSelect.value == "false") ? 'false': '{"deviceId": {"exact": "' + audioSelect.value + '"}}'
    const videoValue = (videoSelect.value == "false") ? 'false': '{"deviceId": {"exact": "' + videoSelect.value + '"}}'
    navigator.mediaDevices.getUserMedia(JSON.parse('{"audio": ' + audioValue + ', "video": ' + videoValue + '}')).then(function (stream) {
        localStream = stream
        localView.srcObject = localStream
        localView.play()
        localStream.getTracks().forEach(function (track) {
            console.log("Adding track: " + track + " to peer connection.")
            track.enabled = true
            peerConnection.addTrack(track)
        })
    }).then(function () {
        peerConnection.createAnswer().then(function (answer) {
            socket.send(JSON.stringify({user: userSelect.value, action: 'answer', answer: answer}))
            peerConnection.setLocalDescription(answer)
        }).catch(handleError)
    }).catch(handleError)
}

function handleAnswer (event) {
    peerConnection.setRemoteDescription(event.answer)
}

function handleCandidate (event) {
    peerConnection.addIceCandidate(event.candidate).catch(handleError)
}

function handleError (error) {
    console.log(error)
}
