# GillBot — Discord Music Bot

## Deploy to Railway

### Environment Variables (set these in Railway dashboard)
| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Your bot's application/client ID |

### Steps
1. Push this `bot/` folder to a GitHub repo (or the whole project)
2. Go to [railway.com](https://railway.com) → New Project → Deploy from GitHub repo
3. Select your repo (set root directory to `bot/` if needed)
4. Add the two environment variables above in the Railway dashboard → Variables tab
5. Railway will build and deploy automatically

## Local Testing
```bash
cp .env.example .env
# fill in your tokens in .env
npm install
npm start
```
