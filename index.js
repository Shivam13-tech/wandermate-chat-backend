const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

// Predefined group names
// const predefinedGroups = ["Group1", "Group2", "Group3"];
const predefinedGroups = [
  "Mystical Himalayan Trek",
  "Desert Safari Experience",
  "Coastal Adventure Retreat",
  "Cultural Heritage Trail",
  "Alpine Lakes Expedition",
  "Wildlife Safari Adventure",
  "Northern Lights Expedition",
  "Tropical Island Getaway",
  "Volcano Exploration Journey",
];

// Maintain a map of rooms and their members
const groups = new Map();

io.on("connection", (socket) => {
  console.log("a user connected");

  // Handle joining a predefined group
  socket.on("joinGroup", (groupName) => {
    if (!predefinedGroups.includes(groupName)) {
      return socket.emit("error", "Group does not exist");
    }

    // Leave current rooms (if any)
    socket.leaveAll();

    // Join the new group
    socket.join(groupName);
    console.log(`User ${socket.id} joined group: ${groupName}`);

    // Create the group if it doesn't exist and add the user
    if (!groups.has(groupName)) {
      groups.set(groupName, new Set());
    }
    groups.get(groupName).add(socket.id);

    // Notify the user about the group they joined
    socket.emit("joinedGroup", groupName);
  });

  // Handle leaving a group
  socket.on("leaveGroup", (groupName) => {
    if (groups.has(groupName)) {
      groups.get(groupName).delete(socket.id);

      // Notify the user about leaving the group
      socket.emit("leftGroup", groupName);
    }

    socket.leave(groupName);
    console.log(`User ${socket.id} left group: ${groupName}`);
  });

  // Handle messages within a group
  socket.on("message", (data) => {
    const { groupName, message } = data;
    console.log(`Message from ${socket.id} in group ${groupName}: ${message}`);

    // Broadcast the message to all members of the group
    io.to(groupName).emit("message", { sender: socket.id, message });
  });

  // Handle disconnecting users
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);

    // Remove user from all groups
    groups.forEach((members, groupName) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(groupName).emit("userLeft", socket.id);
      }
    });
  });
});

http.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});

module.exports = app; // Export the app for serverless deployment
