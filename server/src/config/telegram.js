/**
 * Telegram Bot Configuration
 */

module.exports = {
  // Bot token from environment
  TOKEN: process.env.TELEGRAM_BOT_TOKEN,

  // Webhook URL for production (optional)
  WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,

  // Bot commands
  COMMANDS: {
    START: '/start',
    HELP: '/help',
    CATALOG: '/catalog',
    ORDER: '/order',
    MYORDERS: '/myorders',
    CART: '/cart',
    STOCK: '/stock', // Staff only
  },

  // Callback data prefixes
  CALLBACKS: {
    CATEGORY: 'cat_',
    PRODUCT: 'prod_',
    ADD_TO_CART: 'add_',
    REMOVE_FROM_CART: 'rem_',
    CHECKOUT: 'checkout',
    CONFIRM_ORDER: 'confirm_',
    CANCEL_ORDER: 'cancel_',
  },

  // Messages (can be translated later)
  MESSAGES: {
    WELCOME: 'Welcome to MirSklada! 🏪\n\nI can help you place orders.',
    HELP: 'Available commands:\n/catalog - Browse products\n/order - Create order\n/myorders - View your orders',
    NOT_REGISTERED: 'Please contact the business to get registered.',
    ORDER_RECEIVED: '✅ Order received! We will process it shortly.',
    INVALID_COMMAND: 'Unknown command. Type /help for available commands.',
  },
};
