// GillBot launcher
// Reads DISCORD_TOKEN and DISCORD_CLIENT_ID from .env (local) or host env vars (Railway/Render/etc.)

process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");
const { execFileSync, execSync } = require("child_process");

// ── 1. Load .env if it exists ────────────────────────────────────────────────
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  console.log("[GillBot] Loaded .env file.");
}

// ── 2. Validate required env vars ───────────────────────────────────────────
if (!process.env.DISCORD_TOKEN) {
  console.error("[GillBot] ERROR: DISCORD_TOKEN is not set.");
  console.error("  → Add it to Railway Variables, Render Environment Variables, or your .env file.");
  process.exit(1);
}
if (!process.env.DISCORD_CLIENT_ID) {
  console.error("[GillBot] ERROR: DISCORD_CLIENT_ID is not set.");
  console.error("  → Add it to Railway Variables, Render Environment Variables, or your .env file.");
  process.exit(1);
}

// ── 3. Locate ffmpeg ─────────────────────────────────────────────────────────
(function locateFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    console.log("[GillBot] Using FFMPEG_PATH from env:", process.env.FFMPEG_PATH);
    return;
  }
  const staticBin = path.join(__dirname, "node_modules", "ffmpeg-static", "ffmpeg");
  if (fs.existsSync(staticBin)) {
    process.env.FFMPEG_PATH = staticBin;
    console.log("[GillBot] Using ffmpeg-static binary:", staticBin);
    return;
  }
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
  try {
    const found = execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim();
    if (found) {
      process.env.FFMPEG_PATH = found;
      console.log("[GillBot] Found ffmpeg via which:", found);
      return;
    }
  } catch (_) {}
  console.warn("[GillBot] WARNING: ffmpeg not found — audio playback will fail.");
})();

// ── 4. Check & update yt-dlp ────────────────────────────────────────────────
(function checkYtdlp() {
  const ytdlpBin = process.env.YTDLP_PATH || "yt-dlp";
  try {
    const ver = execFileSync(ytdlpBin, ["--version"], { encoding: "utf8" }).trim();
    console.log("[GillBot] yt-dlp found:", ver);
  } catch (e) {
    console.error("[GillBot] CRITICAL: yt-dlp not found!", e.message);
    console.error("  → Railway/Render: make sure yt-dlp is in nixpacks.toml or installed via pip.");
    console.error("  → Local: run  pip install yt-dlp  or  pip3 install yt-dlp");
    process.exit(1); // bot cannot play music without yt-dlp
  }

  // Auto-update yt-dlp so YouTube doesn't break it
  if (process.env.YTDLP_SKIP_UPDATE !== "true") {
    try {
      console.log("[GillBot] Updating yt-dlp (set YTDLP_SKIP_UPDATE=true to skip)...");
      execSync(`${ytdlpBin} -U`, { stdio: "inherit", timeout: 60000 });
    } catch (_) {
      console.warn("[GillBot] yt-dlp update skipped (non-fatal).");
    }
  }
})();

// ── 5. Write cookies.txt for yt-dlp (YouTube rate-limit fix) ────────────────
const cookiesPath = path.join(__dirname, "cookies.txt");
if (process.env.YOUTUBE_COOKIES_TXT) {
  try {
    fs.writeFileSync(cookiesPath, process.env.YOUTUBE_COOKIES_TXT);
    process.env.YTDLP_COOKIES = cookiesPath;
    console.log("[GillBot] YouTube cookies.txt written — yt-dlp will use it.");
  } catch (e) {
    console.error("[GillBot] Warning: could not write cookies.txt:", e.message);
  }
} else {
  console.warn(
    "[GillBot] YOUTUBE_COOKIES_TXT not set — YouTube songs may fail on cloud IPs.\n" +
    "  → Export cookies from your browser with the 'Get cookies.txt LOCALLY' Chrome extension\n" +
    "    and paste the full file contents as the YOUTUBE_COOKIES_TXT env var."
  );
}

// ── 6. Launch the bot ────────────────────────────────────────────────────────
console.log("[GillBot] Launching bot...");
const { spawn } = require("child_process");
const bot = spawn(process.execPath, ["app/index.mjs"], {
  stdio: "inherit",
  env: process.env,
  cwd: __dirname,
});
bot.on("error", (e) => {
  console.error("[GillBot] Failed to start bot process:", e.message);
  process.exit(1);
});
bot.on("exit", (code) => {
  console.log("[GillBot] Bot exited with code:", code);
  process.exit(code || 0);
});
