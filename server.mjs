import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
const PORT = Number.parseInt(process.env.PORT || "4173", 10);
const HOST = process.env.HOST || "0.0.0.0";
const ROOM_TTL = 24 * 60 * 60 * 1000;
const ACTIVE_WINDOW = 30 * 1000;
const rooms = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function cleanText(value, max = 40) {
  return String(value ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, max);
}

function createCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = [...randomBytes(6)].map((byte) => alphabet[byte % alphabet.length]).join("");
  } while (rooms.has(code));
  return code;
}

function publicRoom(room, playerId) {
  const now = Date.now();
  room.players.forEach((player) => {
    player.active = player.seen > now - ACTIVE_WINDOW;
  });
  return {
    code: room.code,
    host: room.host,
    status: room.status,
    players: room.players,
    chat: room.chat,
    coop: room.coop,
    order: room.order,
    expires: room.expires,
    isHost: room.host === playerId,
  };
}

function newPlayer(profile, ready) {
  const now = Date.now();
  return {
    id: randomUUID(),
    name: cleanText(profile?.name, 24) || "Petualang",
    kelas: cleanText(profile?.kelas, 12) || "9A",
    avatar: Math.max(0, Math.min(11, Number(profile?.avatar) || 0)),
    ready,
    active: true,
    seen: now,
    x: 1250,
    y: 1050,
    scene: "city",
    dir: "down",
    moving: false,
    emote: "",
    emoteAt: 0,
    report: {},
  };
}

function pruneRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.expires < now || !room.players.some((player) => player.seen > now - ROOM_TTL)) {
      rooms.delete(code);
    }
  }
}

function updateState(player, state = {}) {
  const allowedScenes = new Set(["city", "academy", "factory", "lab", "ipo", "warehouse", "garden", "portal", "results", "arena"]);
  const allowedDirections = new Set(["up", "down", "left", "right"]);
  const allowedEmotes = new Set(["", "👍", "💡", "❓", "✅", "🎉"]);
  if (Number.isFinite(Number(state.x))) player.x = Math.max(0, Math.min(2700, Number(state.x)));
  if (Number.isFinite(Number(state.y))) player.y = Math.max(0, Math.min(2050, Number(state.y)));
  if (allowedScenes.has(state.scene)) player.scene = state.scene;
  if (allowedDirections.has(state.dir)) player.dir = state.dir;
  if (allowedEmotes.has(state.emote)) player.emote = state.emote;
  if (Number.isFinite(Number(state.emoteAt))) player.emoteAt = Number(state.emoteAt);
  player.moving = Boolean(state.moving);
  if (state.activity && typeof state.activity === "object") player.activity = state.activity;
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64 * 1024) throw new Error("Permintaan terlalu besar.");
  }
  return body ? JSON.parse(body) : {};
}

async function handleRoom(req, res) {
  try {
    pruneRooms();
    const data = await readBody(req);
    const action = cleanText(data.action, 24);
    const now = Date.now();

    if (action === "create") {
      const code = createCode();
      const player = newPlayer(data.profile, true);
      rooms.set(code, {
        code,
        host: player.id,
        status: "lobby",
        players: [player],
        chat: [],
        coop: [],
        order: [],
        expires: now + ROOM_TTL,
      });
      return sendJson(res, 200, { code, id: player.id, token: player.id });
    }

    const code = cleanText(data.code, 6).toUpperCase();
    const room = rooms.get(code);
    if (!room) return sendJson(res, 404, { error: "Ruang tidak ditemukan atau sudah berakhir." });

    if (action === "join") {
      const activePlayers = room.players.filter((player) => player.seen > now - ACTIVE_WINDOW);
      if (activePlayers.length >= 8) return sendJson(res, 409, { error: "Ruang penuh." });
      if (room.status === "ended") return sendJson(res, 409, { error: "Sesi sudah berakhir." });
      const player = newPlayer(data.profile, false);
      room.players.push(player);
      room.expires = now + ROOM_TTL;
      return sendJson(res, 200, { code, id: player.id, token: player.id });
    }

    const player = room.players.find((item) => item.id === data.id && item.id === data.token);
    if (!player) return sendJson(res, 401, { error: "Sesi ruang tidak valid." });
    player.seen = now;
    room.expires = now + ROOM_TTL;

    if (["start", "end", "reset-coop"].includes(action) && room.host !== player.id) {
      return sendJson(res, 403, { error: "Hanya host dapat mengatur ruang." });
    }

    if (action === "sync") {
      updateState(player, data.state);
      player.report = {
        ...(data.report && typeof data.report === "object" ? data.report : {}),
        name: player.name,
        kelas: player.kelas,
      };
    } else if (action === "ready") {
      player.ready = Boolean(data.ready);
    } else if (action === "start") {
      const waiting = room.players.some((item) => item.seen > now - ACTIVE_WINDOW && !item.ready);
      if (waiting) return sendJson(res, 409, { error: "Tunggu semua pemain siap." });
      room.status = "playing";
    } else if (action === "end") {
      room.status = "ended";
    } else if (action === "chat") {
      if (now - (player.chatAt || 0) < 900) return sendJson(res, 429, { error: "Tunggu sebentar sebelum mengirim lagi." });
      const message = cleanText(data.message, 120);
      if (!message) return sendJson(res, 400, { error: "Pesan tidak boleh kosong." });
      player.chatAt = now;
      room.chat.push({ id: randomUUID(), player: player.id, name: player.name, message, created: now });
      room.chat = room.chat.slice(-50);
    } else if (action === "coop") {
      const step = Number(data.step);
      if (step !== room.coop.length) {
        return sendJson(res, 409, { error: "Aktifkan secara berurutan: INPUT → PROSES → OUTPUT." });
      }
      const activeCount = room.players.filter((item) => item.seen > now - ACTIVE_WINDOW).length;
      if (activeCount < 2) return sendJson(res, 409, { error: "Quest online membutuhkan setidaknya dua pemain. Ajak teman masuk ruang." });
      if (activeCount >= 3 && room.coop.some((item) => item.player === player.id)) {
        return sendJson(res, 409, { error: "Minta teman lain mengaktifkan stasiun ini agar setiap pemain punya peran." });
      }
      const next = [...room.coop, { player: player.id, at: now }];
      if (step === 2 && new Set(next.map((item) => item.player)).size < 2) {
        return sendJson(res, 409, { error: "Sedikitnya dua pemain harus berkontribusi." });
      }
      room.coop = next;
    } else if (action === "reset-coop") {
      room.coop = [];
    } else if (action === "leave") {
      player.seen = 0;
      player.active = false;
      if (room.host === player.id) {
        const replacement = room.players.find((item) => item.id !== player.id && item.seen > now - ACTIVE_WINDOW);
        if (replacement) room.host = replacement.id;
      }
      return sendJson(res, 200, { ok: true });
    } else if (!new Set(["report", "sync", "ready", "start", "end", "chat", "coop", "reset-coop"]).has(action)) {
      return sendJson(res, 400, { error: "Aksi ruang tidak dikenal." });
    }

    return sendJson(res, 200, publicRoom(room, player.id));
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : "Permintaan tidak dapat diproses." });
  }
}

function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }

  const relative = pathname === "/" ? "index.html" : normalize(pathname).replace(/^[/\\]+/, "");
  const filePath = resolve(join(ROOT, relative));
  if (!filePath.startsWith(ROOT) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 Not Found");
    return;
  }

  const headers = {
    "Content-Type": mime[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Content-Length": statSync(filePath).size,
    "Cache-Control": pathname.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "no-cache",
  };
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && new URL(req.url, "http://localhost").pathname === "/api/room") {
    return void handleRoom(req, res);
  }
  if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res);
  res.writeHead(405, { Allow: "GET, HEAD, POST" }).end();
});

server.listen(PORT, HOST, () => {
  console.log(`Kota Komputasional siap di http://localhost:${PORT}`);
});
