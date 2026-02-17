const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ============================
// CONFIG YOUTUBE API
// ============================

const API_KEY = "AIzaSyBDc6JwcvQis7fCsoNwhxMwXiNt_wy72Jw";

const channels = [
  {
    name: "ACF Performance",
    channelId: "UCvgSmIdI92W4KnP15fJwfwA",
  },

  {
    name: "Rato Borrachudo",
    channelId: "UCDt4dFdsJyjjA8mQULkOLLw",
  },

  {
    name: "Gordox",
    channelId: "UC0aogS8ogMaDUZKKKLKH8fg",
  },
  {
    name: "Tonimek",
    channelId: "UCwRM1SXROyxSSJqrOTQzILw",
  },
  {
    name: "Richard Rasmussen",
    channelId: "UC13ikrGSy3E2AveqLAI9lqg",
  },
  {
    name: "Cariani",
    channelId: "UCPX0gLduKAfgr-HJENa7CFw",
  },

  {
    name: "Inverno na Transamazônica",
    channelId: "UC2qRum_4YU_5RHH83cU2O7Q",
  },

  {
    name: "Nathan Mariotto",
    channelId: "UChVM0HxSPi3ClJVPWCGM5Og",
  },
];

// ============================
// CONTADOR ONLINE
// ============================

let onlineUsers = 0;

io.on("connection", async (socket) => {
  onlineUsers++;

  console.log("Usuário conectado:", onlineUsers);

  io.emit("updateUsers", onlineUsers);

  // ENVIA STATUS DAS LIVES IMEDIATAMENTE

  await checkLives();

  socket.on("disconnect", () => {
    onlineUsers--;

    console.log("Usuário desconectado:", onlineUsers);

    io.emit("updateUsers", onlineUsers);
  });
});

// ============================
// VERIFICAR LIVES AUTOMATICO
// ============================

async function checkLives() {
  try {
    const requests = channels.map((ch) => {
      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet` +
        `&channelId=${ch.channelId}` +
        `&eventType=live` +
        `&type=video` +
        `&key=${API_KEY}`;

      return axios
        .get(url)

        .then((res) => {
          if (res.data.items.length > 0) {
            return {
              name: ch.name,
              live: true,
              videoId: res.data.items[0].id.videoId,
            };
          }

          return {
            name: ch.name,
            live: false,
            channelId: ch.channelId,
          };
        })

        .catch(() => {
          return {
            name: ch.name,
            live: false,
            channelId: ch.channelId,
          };
        });
    });

    const result = await Promise.all(requests);

    io.emit("liveUpdate", result);

    console.log("Lives verificadas:", result);
  } catch (err) {
    console.log("Erro geral:", err.message);
  }
}

// verifica a cada 30 segundos

setInterval(checkLives, 30000);

// ============================
// ROTA TESTE
// ============================

app.get("/", (req, res) => {
  res.send("Servidor StreamHub Online");
});

// ============================
// START SERVER
// ============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);

  checkLives();
});
