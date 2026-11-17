import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;
const MAX_PLAYERS = 32;
const players = new Map();

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
  pingInterval: 25000,
  pingTimeout: 20000,
});

app.get('/', (_req, res) => res.json({
  game: 'Sobrevivência Pós-Apocalipse',
  status: 'online',
  players: players.size,
  maxPlayers: MAX_PLAYERS,
}));
app.get('/health', (_req, res) => res.json({ ok: true, players: players.size }));

function cleanName(value) {
  const name = String(value ?? 'Sobrevivente').replace(/[<>\\\u0000-\u001f]/g, '').trim().slice(0, 18);
  return name || 'Sobrevivente';
}
function validNumber(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
}
function publishPlayers() {
  io.emit('players:update', [...players.values()]);
}

io.on('connection', (socket) => {
  socket.on('player:join', (payload = {}) => {
    if (players.size >= MAX_PLAYERS && !players.has(socket.id)) {
      socket.emit('server:message', 'Servidor cheio. Tente novamente mais tarde.');
      socket.disconnect(true);
      return;
    }
    players.set(socket.id, {
      id: socket.id,
      name: cleanName(payload.name),
      x: validNumber(payload.x, -180, 180),
      y: validNumber(payload.y, 0, 20),
      z: validNumber(payload.z, -180, 180),
      yaw: validNumber(payload.yaw, -Math.PI * 4, Math.PI * 4),
      pitch: 0,
      moving: false,
    });
    publishPlayers();
  });

  socket.on('player:update', (payload = {}) => {
    const player = players.get(socket.id);
    if (!player) return;
    const now = Date.now();
    if (socket.data.lastUpdate && now - socket.data.lastUpdate < 35) return;
    socket.data.lastUpdate = now;
    player.x = validNumber(payload.x, -180, 180);
    player.y = validNumber(payload.y, 0, 20);
    player.z = validNumber(payload.z, -180, 180);
    player.yaw = validNumber(payload.yaw, -Math.PI * 4, Math.PI * 4);
    player.pitch = validNumber(payload.pitch, -Math.PI, Math.PI);
    player.moving = Boolean(payload.moving);
    socket.broadcast.emit('players:update', [...players.values()]);
  });

  socket.on('disconnect', () => {
    if (players.delete(socket.id)) {
      io.emit('player:left', { id: socket.id });
      publishPlayers();
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor multiplayer ativo na porta ${PORT}`);
});
