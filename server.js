const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const wrtc = require("wrtc");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const users = new Map(); // Store connected users

// Serve the frontend files (optional)
app.use(express.static('public'));

// WebSocket connection handler
io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    // Store user's caller ID
    socket.on("register", (callerId) => {
        users.set(callerId, socket);
        console.log("User registered:", callerId);
    });

    // Handle incoming call signaling (offer)
    socket.on("makeCall", (data) => {
        const { calleeId, sdpOffer } = data;
        const calleeSocket = users.get(calleeId);

        if (calleeSocket) {
            calleeSocket.emit("newCall", {
                callerId: data.callerId,
                sdpOffer: sdpOffer,
            });
        }
    });

    // Handle answer to the call
    socket.on("answerCall", (data) => {
        const { callerId, sdpAnswer } = data;
        const callerSocket = users.get(callerId);

        if (callerSocket) {
            callerSocket.emit("callAnswered", {
                sdpAnswer: sdpAnswer,
            });
        }
    });

    // Handle ICE Candidate signaling
    socket.on("IceCandidate", (data) => {
        const { calleeId, iceCandidate } = data;
        const calleeSocket = users.get(calleeId);

        if (calleeSocket) {
            calleeSocket.emit("IceCandidate", {
                iceCandidate: iceCandidate,
            });
        }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        // Remove user from the users map when they disconnect
        users.forEach((userSocket, callerId) => {
            if (userSocket.id === socket.id) {
                users.delete(callerId);
                console.log("User disconnected: " + callerId);
            }
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
