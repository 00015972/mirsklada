/**
 * MirSklada Backend Server
 * Entry point for the Express.js application
 */

require('dotenv').config();
const app = require('./app');
const { initializeTelegramBot } = require('./modules/telegram-bot/bot');

const PORT = process.env.PORT || 3000;

// Initialize Telegram Bot (if token is configured)
if (process.env.TELEGRAM_BOT_TOKEN) {
  initializeTelegramBot();
  console.log('✅ Telegram Bot initialized');
} else {
  console.log('⚠️ Telegram Bot not configured (TELEGRAM_BOT_TOKEN missing)');
}

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🏪 MirSklada API Server                             ║
  ║                                                       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║   Port: ${PORT}                                          ║
  ║   API URL: http://localhost:${PORT}/api/v1               ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
