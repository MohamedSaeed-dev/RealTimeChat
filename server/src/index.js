import express from 'express'
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})
let users = {};


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', ({ username, roomId }) => {
    socket.join(roomId);

    if (!users[roomId]) {
      users[roomId] = [];
    }

    let user = users[roomId].find((user) => user.username === username);
    if (user) {
      user.id = socket.id;
      user.status = 'online';
    } else {
      users[roomId].push({ id: socket.id, username, status: 'online' });
    }

    io.to(roomId).emit('users', users[roomId]);
  });

  socket.on('sendMessage', (data) => {
    console.log(data);
    io.to(data.roomId).emit('receiveMessage', data);
  });

  socket.on('leaveRoom', ({ username, roomId }) => {
    socket.leave(roomId);
    if (users[roomId]) {
      let user = users[roomId].find((user) => user.username === username);
      if (user) {
        user.status = 'offline';
      }
      io.to(roomId).emit('users', users[roomId]);
    }
  });

  socket.on('disconnect', () => {
    for (let roomId in users) {
      let user = users[roomId].find((user) => user.id === socket.id);
      if (user) {
        user.status = 'offline';
      }
      io.to(roomId).emit('users', users[roomId]);
    }
  });
});


server.listen(8000, () => {
  console.log("Server is running on port 8000");
});