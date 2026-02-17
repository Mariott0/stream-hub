const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ============================
// CONFIG YOUTUBE API
// ============================
const API_KEY = "AIzaSyARpI0VjxBBn20OutsM3VbT-vXDXXzyOvY";

const channels = [
  { name: "ACF Performance", channelId: "UCvgSmIdI92W4KnP15fJwfwA" },
  { name: "Rato Borrachudo", channelId: "UCDt4dFdsJyjjA8mQULkOLLw" },
  { name: "Gordox", channelId: "UC0aogS8ogMaDUZKKKLKH8fg" },
  { name: "Cariani", channelId: "UCPX0gLduKAfgr-HJENa7CFw" },
  { name: "Richard Rasmussen", channelId: "UC13ikrGSy3E2AveqLAI9lqg" },
  { name: "Inverno na Transamazônica", channelId: "UC2qRum_4YU_5RHH83cU2O7Q" },
  { name: "Tonimek", channelId: "UCwRM1SXROyxSSJqrOTQzILw" },
  { name: "Nathan Mariotto", channelId: "UChVM0HxSPi3ClJVPWCGM5Og" },
];

let lastLiveStatus = []; // Cache para não deixar a tela vazia

// ============================
// LÓGICA DE VERIFICAÇÃO
// ============================

async function checkLives() {
  console.log(`[${new Date().toLocaleTimeString()}] Verificando lives...`);
  try {
    let result = [];

    for (const ch of channels) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.channelId}&eventType=live&type=video&key=${API_KEY}`;
        const res = await axios.get(url);

        if (res.data.items && res.data.items.length > 0) {
          result.push({
            name: ch.name,
            live: true,
            videoId: res.data.items[0].id.videoId,
          });
        } else {
          result.push({
            name: ch.name,
            live: false,
            channelId: ch.channelId,
          });
        }
      } catch (err) {
        console.log(
          `Erro no canal ${ch.name}:`,
          err.response?.data?.error?.message || err.message,
        );
        // Se der erro em um canal (ex: cota), mantém o status offline ou anterior
        result.push({ name: ch.name, live: false });
      }
    }

    lastLiveStatus = result;
    io.emit("liveUpdate", result);
    console.log("Status atualizado e enviado para os clientes.");
  } catch (err) {
    console.log("Erro geral na verificação:", err.message);
  }
}

// ============================
// SOCKET.IO & EXPRESS
// ============================

let onlineUsers = 0;

io.on("connection", (socket) => {
  onlineUsers++;
  io.emit("updateUsers", onlineUsers);

  // Quando o usuário conecta, ele recebe o ÚLTIMO status verificado (cache)
  // Isso evita fazer uma requisição na API toda vez que alguém entra
  if (lastLiveStatus.length > 0) {
    socket.emit("liveUpdate", lastLiveStatus);
  }

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("updateUsers", onlineUsers);
  });
});

app.get("/", (req, res) => {
  res.send("Servidor StreamHub Online");
});

// ============================
// START & INTERVALO
// ============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

  // 1. PRIMEIRA REQUISIÇÃO: Acontece logo no deploy/start
  checkLives();

  // 2. INTERVALO: A cada 3 horas (3 * 60 * 60 * 1000)
  setInterval(checkLives, 3 * 60 * 60 * 1000);
});
