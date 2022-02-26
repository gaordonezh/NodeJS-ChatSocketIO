const express = require("express");
const http = require("http");
const router = require("./router");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./user");
const { addMessage, getMessages } = require("./messages");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);
    addMessage("10101010", "admin", `${user.name}, welcome to ${user.room}`);
    let result = getMessages();
    setTimeout(() => {
      io.to(room).emit("message", result);
    }, 500);

    socket.broadcast
      .to(user.room)
      .emit("message", [{ user: "admin", text: `${user.name}, has joined` }]);
    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", async (message, callback) => {
    const user = await getUser(socket.id);
    if (user) {
      addMessage(user.id, user.name, message);
      let result = getMessages();
      io.to(user.room).emit("message", result);
    }
  });

  socket.on("disconnect", (params) => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left`,
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
