# GillBot — Discord Music Bot

A full-featured Discord music bot with YouTube, Spotify, and SoundCloud support.
Supports slash commands, prefix commands (`!play`), and a setup-channel mode where you just type a song name.

---

## What Was Fixed

1. **Silent music failures** — `getStream` previously returned immediately without checking if yt-dlp actually started.
   If yt-dlp wasn't found or YouTube rate-limited the request, the bot just sat there and did nothing.
   Now it properly rejects with a clear error message, so the bot replies with "Failed to play" instead of going silent.

2. **No timeout** — yt-dlp could hang forever if YouTube was slow to respond.
   Now it has a 20-second timeout with a helpful error message.

3. **yt-dlp auto-update** — yt-dlp breaks every few weeks as YouTube changes their site.
   The bot now updates yt-dlp every time it starts.

4. **Better startup error messages** — Missing yt-dlp or tokens now give actionable error messages.

---

## Required Setup (before hosting)

### Step 1 — Get your Discord credentials

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application (or open your existing one)
3. Go to **Bot** tab → copy your **Bot Token** (this is `DISCORD_TOKEN`)
4. Go to **General Information** tab → copy **Application ID** (this is `DISCORD_CLIENT_ID`)
5. On the **Bot** tab, enable these **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### Step 2 — Invite the bot to your server

Use this URL (replace `YOUR_CLIENT_ID` with your Application ID):

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3213312&scope=bot+applications.commands
```

---

## Hosting Options (all free)

### Option A — Railway (Recommended ⭐)

Railway gives you **$5 free credits/month** — enough to run a small Discord bot 24/7.

1. Push the `gillmusicbot/` folder to a GitHub repo
   (You can make the repo private — Railway works with private repos)
2. Go to [railway.com](https://railway.com) → Sign up free
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repo (if the bot folder is a subfolder, set **Root Directory** to `gillmusicbot`)
5. Go to your project → **Variables** tab → add:
   | Variable | Value |
   |---|---|
   | `DISCORD_TOKEN` | Your bot token |
   | `DISCORD_CLIENT_ID` | Your application ID |
   | `YOUTUBE_COOKIES_TXT` | *(see below — strongly recommended)* |
6. Railway will build and deploy automatically. Done!

### Option B — Render

Render has a **free tier** but it pauses your bot after 15 minutes of inactivity.
Good for testing, not ideal for 24/7 use.

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → **Background Worker**
3. Connect your repo, set **Root Directory** to `gillmusicbot`
4. **Runtime**: Node
5. **Build Command**: `npm install`
6. **Start Command**: `node start.js`
7. Add environment variables (same as Railway above)

### Option C — Koyeb

Koyeb offers a **free instance** with no sleep timeout.

1. Push to GitHub
2. Go to [koyeb.com](https://koyeb.com) → Create App
3. Select GitHub → your repo
4. **Run command**: `node start.js`
5. Add environment variables

---

## Fixing YouTube Playback on Cloud Hosts (Important!)

Cloud servers get **IP-banned by YouTube** because thousands of bots use them.
The fix is to give your bot your YouTube cookies so it logs in as you.

### How to export cookies:

1. Install the **"Get cookies.txt LOCALLY"** extension in Chrome or Edge
   - Chrome: [link](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Go to [youtube.com](https://youtube.com) — make sure you're logged in
3. Click the extension icon → **Export** → save the file
4. Open the file in Notepad, select all, copy everything
5. In Railway/Render/Koyeb → add environment variable:
   - **Name**: `YOUTUBE_COOKIES_TXT`
   - **Value**: paste the entire cookie file content
6. Redeploy the bot

> ⚠️ Use a secondary Google account for this, not your main account.

---

## Commands

| Command | Aliases | Description |
|---|---|---|
| `/play <song>` | `!play`, `!p` | Play a song or URL |
| `/skip` | `!skip`, `!s` | Skip current song |
| `/stop` | `!stop` | Stop and clear queue |
| `/pause` | `!pause` | Pause playback |
| `/resume` | `!resume`, `!r` | Resume playback |
| `/queue` | `!queue`, `!q` | Show queue |
| `/nowplaying` | `!np` | Show current song |
| `/volume <1-100>` | `!vol` | Set volume |
| `/loop` | `!loop`, `!l` | Toggle loop (off/song/queue) |
| `/autoplay` | `!ap` | Toggle autoplay |
| `/join` | `!j` | Join your voice channel |
| `/leave` | `!dc` | Leave voice channel |
| `/setup` | `!setup` | Set a music-only channel |
| `/help` | `!h` | Show all commands |

---

## Local Testing

```bash
cd gillmusicbot

# Install dependencies
npm install

# Install yt-dlp (required for music)
pip install yt-dlp        # Mac/Linux
# or
pip3 install yt-dlp       # if pip doesn't work

# Set up your tokens
cp .env.example .env
# Open .env in a text editor and fill in DISCORD_TOKEN and DISCORD_CLIENT_ID

# Run the bot
npm start
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Bot joins voice but plays nothing | Set `YOUTUBE_COOKIES_TXT` (see above) |
| "yt-dlp not found" error | Install yt-dlp: `pip install yt-dlp` |
| Bot doesn't respond to commands | Check Bot Token is correct; check Message Content Intent is enabled |
| Slash commands not showing | Wait up to 1 hour for Discord to register them globally |
| Bot goes offline randomly | Use Railway (it has auto-restart on failure) |
