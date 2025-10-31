import TelegramBot from 'node-telegram-bot-api';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);

const DB_NAME = 'cenimax';
const BACKUP_DIR = path.join(__dirname, 'database', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN not found in environment variables!');
  console.error('Please set your Telegram bot token first.');
  process.exit(1);
}

console.log('🤖 Starting Cenimax Database Manager Bot...');
console.log(`📊 Database: ${DB_NAME}`);
console.log(`📂 Backup directory: ${BACKUP_DIR}`);

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `
🎬 *Cenimax Database Manager Bot*

Welcome! I can help you manage your PostgreSQL database remotely.

*Available Commands:*

📊 /stats - Show database statistics
📋 /tables - List all database tables
💾 /export - Export database as SQL file
📥 /import - Import database (send SQL file after command)
🔄 /backup - Create a backup
📂 /backups - List all backups
ℹ️ /help - Show this message

*How to Import:*
1. Send /import command
2. Upload your .sql file
3. I'll import it automatically

*Security:* Keep this bot token private!
  `;
  
  bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Type /start to see all available commands!');
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '📊 Fetching database stats...');
  
  try {
    const queries = [
      { label: 'Movies', query: 'SELECT COUNT(*) FROM movies;' },
      { label: 'Genres', query: 'SELECT COUNT(*) FROM genres;' },
      { label: 'Cast Members', query: 'SELECT COUNT(*) FROM cast_members;' },
      { label: 'Database Size', query: `SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));` }
    ];
    
    let statsText = '📊 *Database Statistics*\n\n';
    
    for (const { label, query } of queries) {
      try {
        const { stdout } = await execPromise(`psql -d ${DB_NAME} -t -c "${query}"`);
        const value = stdout.trim();
        statsText += `• ${label}: \`${value}\`\n`;
      } catch (error) {
        statsText += `• ${label}: Error\n`;
      }
    }
    
    const now = new Date().toLocaleString();
    statsText += `\n⏱ Updated: ${now}`;
    
    await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error getting stats: ${error.message}`);
  }
});

bot.onText(/\/tables/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '📋 Fetching tables...');
  
  try {
    const { stdout } = await execPromise(`psql -d ${DB_NAME} -c "\\dt"`);
    await bot.sendMessage(chatId, `📋 *Database Tables*\n\n\`\`\`\n${stdout}\n\`\`\``, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
});

bot.onText(/\/export/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '💾 Exporting database... This may take a moment.');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = path.join(BACKUP_DIR, `cenimax_export_${timestamp}.sql`);
    
    await execPromise(`pg_dump -d ${DB_NAME} -f ${filename}`);
    
    const stats = fs.statSync(filename);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size > 50 * 1024 * 1024) {
      await bot.sendMessage(
        chatId,
        `⚠️ File too large (${sizeMB}MB). Telegram limit is 50MB.\nFile saved at: \`${filename}\``,
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.sendDocument(chatId, filename, {
        caption: `✅ Database exported successfully!\n📦 Size: ${sizeMB}MB`
      });
    }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Export failed: ${error.message}`);
  }
});

bot.onText(/\/import/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '📥 *Import Database*\n\nPlease send me a .sql file to import.\n⚠️ *Warning:* This will overwrite existing data!',
    { parse_mode: 'Markdown' }
  );
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const document = msg.document;
  
  if (!document.file_name.endsWith('.sql')) {
    await bot.sendMessage(chatId, '❌ Please send a .sql file only!');
    return;
  }
  
  await bot.sendMessage(chatId, '📥 Downloading file...');
  
  try {
    const file = await bot.getFile(document.file_id);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const localFile = path.join(BACKUP_DIR, `import_${timestamp}.sql`);
    
    const fileStream = bot.getFileStream(file.file_id);
    const writeStream = fs.createWriteStream(localFile);
    
    await new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    await bot.sendMessage(chatId, '💾 Importing database... This may take a while.');
    
    await execPromise(`psql -d ${DB_NAME} -f ${localFile}`);
    
    const now = new Date().toLocaleString();
    await bot.sendMessage(
      chatId,
      `✅ Database imported successfully!\n📂 File: \`${document.file_name}\`\n⏱ Imported at: ${now}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    const errorMsg = error.message.slice(0, 500);
    await bot.sendMessage(chatId, `❌ Import failed:\n\`\`\`\n${errorMsg}\n\`\`\``, { parse_mode: 'Markdown' });
  }
});

bot.onText(/\/backup/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '🔄 Creating backup...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);
    
    await execPromise(`pg_dump -d ${DB_NAME} -f ${filename}`);
    
    const stats = fs.statSync(filename);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    await bot.sendMessage(
      chatId,
      `✅ Backup created successfully!\n📂 File: \`${filename}\`\n📦 Size: ${sizeMB}MB`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Backup failed: ${error.message}`);
  }
});

bot.onText(/\/backups/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));
    
    if (files.length === 0) {
      await bot.sendMessage(chatId, '📂 No backups found.');
      return;
    }
    
    files.sort().reverse();
    let backupList = '📂 *Available Backups*\n\n';
    
    const displayFiles = files.slice(0, 10);
    for (const file of displayFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      backupList += `• \`${file}\` (${sizeMB}MB)\n`;
    }
    
    if (files.length > 10) {
      backupList += `\n... and ${files.length - 10} more`;
    }
    
    await bot.sendMessage(chatId, backupList, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error listing backups: ${error.message}`);
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ Bot is running! Press Ctrl+C to stop.');
