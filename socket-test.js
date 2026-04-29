const { io } = require("socket.io-client");

const socket = io("http://localhost:3000/chat", {
  transports: ["websocket"],
  query: {
    token: process.env.TOKEN,
    roomId: process.env.ROOM_ID,
  },
});

socket.on("connect", () => {
  console.log("connected", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("connect_error:", err.message, err.data || "");
});

socket.on("room:joined", (payload) => {
  console.log("room:joined", payload);
});

socket.on("room:user_joined", (payload) => {
  console.log("room:user_joined", payload);
});

socket.on("message:new", (payload) => {
  console.log("message:new", payload);
});

socket.on("room:user_left", (payload) => {
  console.log("room:user_left", payload);
});

socket.on("room:deleted", (payload) => {
  console.log("room:deleted", payload);
  socket.disconnect();
});

process.on("SIGINT", () => {
  socket.disconnect();
  process.exit(0);
});