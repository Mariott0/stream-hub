const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// IMPORTANTE: permitir frontend conectar
app.use(express.json());

// criar servidor
const server = http.createServer(app);

// SOCKET CONFIG
const io = new Server(server, {
  cors: {
    origin: "*",

    methods: ["GET", "POST"],
  },
});

// contador
let onlineUsers = 0;

// conexão
io.on("connection", (socket) => {
  onlineUsers++;

  console.log("Usuário conectado:", onlineUsers);

  io.emit("updateUsers", onlineUsers);

  socket.on("disconnect", () => {
    onlineUsers--;

    console.log("Usuário desconectado:", onlineUsers);

    io.emit("updateUsers", onlineUsers);
  });
});

// ROTA TESTE
app.get("/", (req, res) => {
  res.send("Servidor StreamHub Online");
});

// PORTA PRODUÇÃO
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
