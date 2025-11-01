import Fastify from "fastify";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

const fastify = Fastify({ logger: true });

const io = new Server(fastify.server, {
  cors: {
    origin: "*",
  },
  maxHttpBufferSize: 10 * 1024 * 1024,
});

const waitingQueue = [];
const chatRooms = new Map();

io.on("connection", (socket) => {
  //   console.log("User connected:", socket.id);

  socket.on("random", () => {
    if (!waitingQueue.includes(socket)) waitingQueue.push(socket);

    if (waitingQueue.length >= 2) {
      const s1 = waitingQueue.shift();
      const s2 = waitingQueue.shift();
      const roomId = randomUUID();

      chatRooms.set(roomId, [s1, s2]);
      s1.join(roomId);
      s2.join(roomId);

      s1.emit("connected", { chatId: roomId });
      s2.emit("connected", { chatId: roomId });

      console.log(`Room ${roomId} created with ${s1.id} & ${s2.id}`);
    } else {
      socket.emit("waiting");
    }
  });

  socket.on("message", (data) => {
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit("message", data);
    });
  });

  socket.on("image", (data) => {
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit("image", data);
    });
  });

  socket.on("disconnect_room", () => {
    console.log(`${socket.id} left the room`);

    const index = waitingQueue.indexOf(socket);
    if (index !== -1) waitingQueue.splice(index, 1);

    for (const [roomId, sockets] of chatRooms.entries()) {
      if (sockets.includes(socket)) {
        sockets.forEach((s) => {
          if (s.id !== socket.id) {
            s.emit("partner_disconnected");
          }
        });

        chatRooms.set(
          roomId,
          sockets.filter((s) => s.id !== socket.id)
        );
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const index = waitingQueue.indexOf(socket);
    if (index !== -1) waitingQueue.splice(index, 1);

    for (const [roomId, sockets] of chatRooms.entries()) {
      if (sockets.includes(socket)) {
        sockets.forEach((s) => {
          if (s.id !== socket.id) {
            s.emit("partner_disconnected");
          }
        });

        chatRooms.set(
          roomId,
          sockets.filter((s) => s.id !== socket.id)
        );
      }
    }
  });
});

const port = 3001;
const host = "0.0.0.0";

fastify.listen({ port, host }).then(() => {
  console.log(`Server running at http://${host}:${port}`);
});
