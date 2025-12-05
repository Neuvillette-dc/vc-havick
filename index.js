// make a mess and i'll touch you
//                               by neuvi :D

const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');

const config = require('./config.json');
const client = new Client({
  checkUpdate: false,
  patchVoice: true  // CRITICAL: Required for voice to work
});

let voiceConnection = null;
let audioPlayer = null;
let isLooping = true;
let soundFiles = [];
let currentIndex = 0;

console.log('✅ Starting bot...');

client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`👥 Allowed users: ${config.allowedUserIds.join(', ')}`);
  
  if (!fs.existsSync(config.soundsPath)) {
    fs.mkdirSync(config.soundsPath, { recursive: true });
    console.log(`📁 Created sounds folder at ${config.soundsPath}`);
  }
  
  soundFiles = getSoundFiles();
  console.log(`📁 Loaded ${soundFiles.length} audio files`);
});

client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id || 
      !config.allowedUserIds.includes(message.author.id) || 
      !message.content.startsWith('!')) {
    return;
  }

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'join' || command === 'j') {
    try {
      const voiceChannel = message.member?.voice?.channel;
      
      if (!voiceChannel) {
        console.log('❌ User not in voice channel');
        return message.react('🔇').catch(console.error);
      }

      console.log(`🔊 Joining: ${voiceChannel.name}`);

      // Disconnect if already connected
      if (voiceConnection) {
        console.log('🔌 Leaving previous channel...');
        voiceConnection.destroy();
        voiceConnection = null;
        audioPlayer = null;
        await new Promise(r => setTimeout(r, 500));
      }

      // Join using @discordjs/voice
      voiceConnection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      console.log('✅ Joined voice channel');
      await message.react('✅').catch(console.error);

      // Reload sound files
      soundFiles = getSoundFiles();
      
      if (soundFiles.length === 0) {
        console.log('⚠️ No audio files found in sounds folder');
        return message.channel.send('⚠️ No audio files found in `sounds/` folder').catch(console.error);
      }

      console.log(`🎵 Starting playback of ${soundFiles.length} files`);
      isLooping = true;
      currentIndex = 0;
      playNext();
      
    } catch (error) {
      console.error('❌ Join error:', error);
      await message.react('❌').catch(console.error);
      
      if (voiceConnection) {
        try {
          voiceConnection.destroy();
        } catch (e) {}
        voiceConnection = null;
      }
    }
  }

  else if (command === 'leave' || command === 'l') {
    if (voiceConnection) {
      try {
        isLooping = false;
        if (audioPlayer) {
          audioPlayer.stop();
          audioPlayer = null;
        }
        voiceConnection.destroy();
        voiceConnection = null;
        await message.react('👋').catch(console.error);
        console.log('👋 Left voice channel');
      } catch (error) {
        console.error('Leave error:', error);
      }
    } else {
      await message.react('❓').catch(console.error);
    }
  }

  else if (command === 'play' || command === 'p') {
    try {
      if (!voiceConnection) {
        return message.reply('❌ Not in voice. Use `!join` first').catch(console.error);
      }

      if (!args.length) {
        return message.reply('🔍 Usage: `!play <YouTube URL>`').catch(console.error);
      }

      const wasLooping = isLooping;
      isLooping = false;
      if (audioPlayer) {
        audioPlayer.stop();
        audioPlayer = null;
      }

      const url = args[0];
      await message.react('🔍').catch(console.error);
      
      console.log(`▶️ Fetching: ${url}`);
      
      const info = await ytdl.getInfo(url);
      console.log(`▶️ Playing: ${info.videoDetails.title}`);
      
      const stream = ytdl(url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      });

      const { createAudioPlayer, createAudioResource } = require('@discordjs/voice');
      audioPlayer = createAudioPlayer();
      const resource = createAudioResource(stream);
      
      voiceConnection.subscribe(audioPlayer);
      audioPlayer.play(resource);

      audioPlayer.on('idle', () => {
        console.log('✅ Finished YouTube playback');
        audioPlayer = null;
        if (wasLooping) {
          isLooping = true;
          playNext();
        }
      });

      audioPlayer.on('error', (err) => {
        console.error('❌ Player error:', err);
        audioPlayer = null;
        if (wasLooping) {
          isLooping = true;
          playNext();
        }
      });
      
      await message.react('🎵').catch(console.error);
      
    } catch (error) {
      console.error('⚠️ Play error:', error);
      await message.react('❌').catch(console.error);
      isLooping = true;
      if (voiceConnection) playNext();
    }
  }

  else if (command === 'vol' || command === 'v') {
    if (!voiceConnection || !audioPlayer) {
      return message.react('🔇').catch(console.error);
    }
    
    const vol = parseFloat(args[0]);
    if (isNaN(vol) || vol < 0 || vol > 2) {
      return message.reply('🔢 Usage: `!vol 1.0` (0.0-2.0)').catch(console.error);
    }
    
    if (audioPlayer.state.resource) {
      audioPlayer.state.resource.volume.setVolume(vol);
    }
    await message.react('✅').catch(console.error);
    console.log(`🔊 Volume: ${vol}`);
  }

  else if (command === 'loop') {
    if (args[0] === 'on') {
      isLooping = true;
      await message.react('🔁').catch(console.error);
      console.log('🔁 Loop enabled');
      if (voiceConnection && !audioPlayer) {
        playNext();
      }
    } else if (args[0] === 'off') {
      isLooping = false;
      if (audioPlayer) {
        audioPlayer.stop();
        audioPlayer = null;
      }
      await message.react('⏹️').catch(console.error);
      console.log('⏹️ Loop disabled');
    } else {
      message.reply('Usage: `!loop on` or `!loop off`').catch(console.error);
    }
  }

  else if (command === 'skip' || command === 's') {
    if (audioPlayer && isLooping) {
      audioPlayer.stop();
      audioPlayer = null;
      await message.react('⏭️').catch(console.error);
      console.log('⏭️ Skipped');
    } else {
      await message.react('❓').catch(console.error);
    }
  }

  else if (command === 'reload' || command === 'r') {
    soundFiles = getSoundFiles();
    console.log(`📁 Reloaded ${soundFiles.length} audio files`);
    await message.reply(`📁 Reloaded ${soundFiles.length} audio files`).catch(console.error);
  }

  else if (command === 'list' || command === 'ls') {
    if (soundFiles.length === 0) {
      return message.reply('❌ No audio files loaded').catch(console.error);
    }
    
    const fileList = soundFiles.slice(0, 20).map((f, i) => `${i + 1}. ${path.basename(f)}`).join('\n');
    const msg = `📁 Audio files (${soundFiles.length} total):\n\`\`\`\n${fileList}\n${soundFiles.length > 20 ? '...' : ''}\`\`\``;
    message.reply(msg).catch(console.error);
  }

  else if (command === 'np' || command === 'now') {
    if (audioPlayer && soundFiles.length > 0) {
      const current = soundFiles[currentIndex % soundFiles.length];
      message.reply(`🎵 Now playing: **${path.basename(current)}** (${currentIndex + 1}/${soundFiles.length})`).catch(console.error);
    } else {
      message.reply('❌ Nothing playing').catch(console.error);
    }
  }
});

function playNext() {
  if (!isLooping || !voiceConnection || soundFiles.length === 0) {
    console.log('⏹️ Playback stopped');
    return;
  }

  const file = soundFiles[currentIndex % soundFiles.length];
  
  try {
    console.log(`▶️ Playing [${currentIndex + 1}/${soundFiles.length}]: ${path.basename(file)}`);
    
    const { createAudioPlayer, createAudioResource } = require('@discordjs/voice');
    
    audioPlayer = createAudioPlayer();
    const resource = createAudioResource(file);
    
    voiceConnection.subscribe(audioPlayer);
    audioPlayer.play(resource);

    audioPlayer.on('idle', () => {
      audioPlayer = null;
      currentIndex++;
      setTimeout(playNext, 300);
    });

    audioPlayer.on('error', (err) => {
      console.error(`❌ Playback error: ${err.message}`);
      audioPlayer = null;
      currentIndex++;
      setTimeout(playNext, 2000);
    });
    
  } catch (error) {
    console.error('⚠️ Play error:', error);
    currentIndex++;
    setTimeout(playNext, 2000);
  }
}

function getSoundFiles() {
  const files = [];
  
  if (!fs.existsSync(config.soundsPath)) {
    console.log(`⚠️ Sounds folder not found: ${config.soundsPath}`);
    return files;
  }

  const scanDir = (dir) => {
    try {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(mp3|wav|ogg|flac|m4a)$/i.test(file)) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      console.error(`Error scanning: ${error.message}`);
    }
  };
  
  scanDir(config.soundsPath);
  return files.sort();
}

client.login(config.token).catch(error => {
  console.error('❌ Login failed:', error.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  isLooping = false;
  if (audioPlayer) {
    try { audioPlayer.stop(); } catch (e) {}
  }
  if (voiceConnection) {
    try { voiceConnection.destroy(); } catch (e) {}
  }
  client.destroy();
  process.exit(0);
});
