# Discord Music Selfbot

A Discord selfbot that plays music from YouTube links in voice channels using the microphone input.

## Setup Instructions

### 1. Install Dependencies
```bash
pip install discord.py yt-dlp PyNaCl ffmpeg-python
```

### 2. Install FFmpeg
- Download FFmpeg from https://ffmpeg.org/download.html
- Add FFmpeg to your system PATH

### 3. Configure the Bot
Edit `config.json` file:
```json
{
  "token": "YOUR_DISCORD_TOKEN_HERE",
  "songs": [
    {"name": "Song Name", "url": "https://www.youtube.com/watch?v=VIDEO_ID"}
  ]
}
```

Replace `YOUR_DISCORD_TOKEN_HERE` with your Discord account token (get from Discord DevTools: F12 → Application → Local Storage)

### 4. Add Songs
Add your YouTube links to the `songs` array in `config.json`:
```json
{
  "token": "YOUR_TOKEN_HERE",
  "songs": [
    {"name": "Your Song 1", "url": "https://www.youtube.com/watch?v=VIDEO_ID1"},
    {"name": "Your Song 2", "url": "https://www.youtube.com/watch?v=VIDEO_ID2"}
  ]
}

## Commands
- `!join` - Join your voice channel and start playing music automatically
- `!leave` - Leave the voice channel and stop playing

## Usage
1. Run the bot: `python main.py`
2. Join a voice channel in Discord
3. Type `!join` in any text channel to start playing
4. The bot will automatically loop through all songs in config.json
5. Use `!leave` to stop and leave

## Features
- **Auto-play on join** - Starts playing immediately when joining
- **Continuous loop** - Plays all songs in order, then repeats
- **Minimal commands** - Only join and leave for simple operation
- Plays music directly through microphone input
- Supports YouTube links
- Configuration stored in JSON format

## Important Notes
- This is a selfbot (uses your account token)
- Make sure to follow Discord's Terms of Service
- Only use this in servers where selfbots are allowed
- Token and songs are now stored in `config.json` instead of separate files
# vc-havick
# vc-havick
