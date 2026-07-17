// CJS launcher — spawns plain node for the bot
//
// Loads variables from a .env file (if present) AND supports variables
// set directly in the hosting panel's process environment ("Startup"
// page). No credentials are hardcoded in this file.
// Set DISCORD_TOKEN and DISCORD_CLIENT_ID via either method.

process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");

// --- minimal .env loader (no extra dependency needed) ---
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  console.log("[GillBot] Loaded .env file.");
}
// ------------------------------------------------------

// --- locate ffmpeg and set FFMPEG_PATH for audio playback ---
// Railway (Nixpacks) installs system ffmpeg; point the bot at it explicitly
// so prism-media / discord-player don't fall back to a missing binary.
(function () {
  // 1. Already set externally — honour it
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    console.log("[GillBot] Using FFMPEG_PATH from env:", process.env.FFMPEG_PATH);
    return;
  }
  // 2. ffmpeg-static bundled binary
  const staticBin = path.join(__dirname, "node_modules", "ffmpeg-static", "ffmpeg");
  if (fs.existsSync(staticBin)) {
    process.env.FFMPEG_PATH = staticBin;
    console.log("[GillBot] Using ffmpeg-static binary:", staticBin);
    return;
  }
  // 3. Common system paths (Railway / Linux / Nix)
  const candidates = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/bin/ffmpeg",
    "/run/current-system/sw/bin/ffmpeg",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      process.env.FFMPEG_PATH = p;
      console.log("[GillBot] Using system ffmpeg:", p);
      return;
    }
  }
  // 4. Try `which ffmpeg` as last resort
  try {
    const { execFileSync } = require("child_process");
    const found = execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim();
    if (found) {
      process.env.FFMPEG_PATH = found;
      console.log("[GillBot] Found ffmpeg via which:", found);
      return;
    }
  } catch (_) {}
  console.warn("[GillBot] Warning: ffmpeg not found — audio playback may not work.");
})();
// ------------------------------------------------------

// --- write cookies.txt for yt-dlp if provided ---
// yt-dlp uses this Netscape-format cookie file to authenticate YouTube requests.
// Set YOUTUBE_COOKIES_TXT in Railway Variables (paste the full cookie file content).
const cookiesPath = path.join(__dirname, "cookies.txt");
if (process.env.YOUTUBE_COOKIES_TXT) {
  try {
    fs.writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES_TXT);
    process.env.YTDLP_COOKIES = cookiesPath;
    console.log("[GillBot] YouTube cookies.txt written for yt-dlp.");
  } catch (e) {
    console.error("[GillBot] Warning: could not write cookies.txt:", e.message);
  }
} else {
  console.warn("[GillBot] YOUTUBE_COOKIES_TXT not set — yt-dlp may hit rate limits. Add it in Railway Variables.");
}
// ------------------------------------------------------

if (!process.env.DISCORD_TOKEN) {
  console.error("[GillBot] DISCORD_TOKEN is not set. Add it via the Environment (.env) page or Startup variables.");
  process.exit(1);
}
if (!process.env.DISCORD_CLIENT_ID) {
  console.error("[GillBot] DISCORD_CLIENT_ID is not set. Add it via the Environment (.env) page or Startup variables.");
  process.exit(1);
}

// --- verify yt-dlp is installed ---
try {
  const { execFileSync } = require("child_process");
  const ytdlpVer = execFileSync("yt-dlp", ["--version"], { encoding: "utf8" }).trim();
  console.log("[GillBot] yt-dlp found:", ytdlpVer);
} catch (e) {
  console.error("[GillBot] WARNING: yt-dlp NOT found!", e.message);
  console.error("[GillBot] Audio will not work. Add yt-dlp to nixpacks.toml nixPkgs.");
}
// ----------------------------------

console.log("[GillBot] Launching bot...");
const { spawn } = require("child_process");
const bot = spawn(process.execPath, ["app/index.mjs"], {
  stdio: "inherit",
  env: process.env,
  cwd: __dirname
});
bot.on("error", (e) => { console.error("[GillBot] Error:", e); process.exit(1); });
bot.on("exit", (code) => { console.log("[GillBot] Exited:", code); process.exit(code || 0); });
