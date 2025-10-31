# Telegram Database Manager Bot

A Telegram bot to manage your Cenimax PostgreSQL database remotely!

## Features

🤖 **Remote Database Management:**
- Export database as SQL file via Telegram
- Import database by sending SQL files
- Create backups on-demand
- View database statistics
- List all tables
- List all backups

## Setup

### Step 1: Create Your Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "Cenimax DB Manager")
4. Choose a username ending in `bot` (e.g., `cenimax_db_bot`)
5. **Copy the API token** - it looks like: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`

### Step 2: Set the Token

On Replit, the bot will ask you for the token when you first run it.

On your VM:
```bash
export TELEGRAM_BOT_TOKEN="your_token_here"
```

Or add to your `.bashrc` / `.zshrc`:
```bash
echo 'export TELEGRAM_BOT_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Run the Bot

```bash
node telegram-bot.mjs
```

The bot runs alongside your main application!

## Usage

### Find Your Bot
1. Open Telegram
2. Search for your bot username (e.g., `@cenimax_db_bot`)
3. Click "Start"

### Available Commands

**📊 Database Info:**
- `/start` - Welcome message & command list
- `/help` - Show all commands
- `/stats` - Show database statistics (movies count, size, etc.)
- `/tables` - List all database tables

**💾 Export & Backup:**
- `/export` - Export entire database as SQL file (sent via Telegram)
- `/backup` - Create a local backup file
- `/backups` - List all backup files

**📥 Import:**
1. Send `/import` command
2. Upload your `.sql` file
3. Bot will import it automatically

## Security

⚠️ **Important Security Notes:**

1. **Keep your bot token private!** - Never share it or commit to GitHub
2. **Limit access** - Only you should have access to this bot
3. **Use with BotFather commands:**
   - In BotFather, send `/mybots`
   - Select your bot
   - Go to "Bot Settings" → "Allow Groups?" → **Disable**
   - This prevents others from adding your bot to groups

## File Structure

```
database/
├── backups/          # Backup & export files (not in Git)
│   ├── backup_20251030_120000.sql
│   ├── export_20251030_130000.sql
│   └── import_20251030_140000.sql
├── data/             # PostgreSQL data files (not in Git)
├── scripts/          # Start/stop scripts (in Git)
└── schema.sql        # Database structure (in Git)
```

## Examples

### Export Database
```
You: /export
Bot: 💾 Exporting database... This may take a moment.
Bot: ✅ Database exported successfully!
     📦 Size: 2.5MB
     [Downloads SQL file]
```

### Import Database
```
You: /import
Bot: 📥 Import Database
     Please send me a .sql file to import.
     ⚠️ Warning: This will overwrite existing data!

You: [Upload backup.sql file]
Bot: 📥 Downloading file...
Bot: 💾 Importing database... This may take a while.
Bot: ✅ Database imported successfully!
     📂 File: backup.sql
     ⏱ Imported at: 2025-10-30 15:30:00
```

### Check Stats
```
You: /stats
Bot: 📊 Database Statistics

     • Movies: 150
     • Genres: 8
     • Cast Members: 45
     • Database Size: 12 MB

     ⏱ Updated: 2025-10-30 15:30:00
```

## Moving to Your VM

The bot works the same way on your VM:

```bash
# On your VM:
git clone your-repo
cd cenimax

# Install dependencies
npm install

# Set token
export TELEGRAM_BOT_TOKEN="your_token"

# Run bot
node telegram-bot.mjs
```

Bot runs in the background, managing your production database!

## Workflow Integration

On Replit, the bot runs automatically via a workflow alongside your frontend. 

On your VM, you can use:
- **systemd** (Linux service)
- **PM2** (Node.js process manager)
- **screen/tmux** (simple background process)
- **Docker** (if you prefer containers)

## Troubleshooting

**Bot not responding?**
- Check if `telegram_bot.py` is running
- Verify `TELEGRAM_BOT_TOKEN` is set
- Check bot logs for errors

**Import failed?**
- Verify SQL file is valid
- Check file size (Telegram limit: 50MB)
- Ensure PostgreSQL is running

**Can't find bot?**
- Verify bot username in BotFather
- Make sure you clicked "Start" in Telegram
- Check bot is running

## Advanced: Scheduled Backups

You can set up automatic backups using cron on your VM:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/cenimax && python -c "import subprocess; subprocess.run(['pg_dump', '-d', 'cenimax', '-f', 'database/backups/auto_backup_$(date +\%Y\%m\%d).sql'])"
```

Then use `/backups` command to see all your automatic backups!
