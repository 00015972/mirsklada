# grammY Telegram Bot Patterns for Mirsklada

## Project Structure

```
apps/bot-admin/src/
├── bot.ts                    # Bot initialization
├── config/
│   └── env.ts               # Environment config
├── commands/
│   ├── index.ts             # Command registration
│   ├── start.ts             # /start command
│   ├── stock.ts             # /stock command
│   ├── add.ts               # /add command
│   └── upload.ts            # /upload command
├── conversations/
│   ├── add-stock.ts         # Add stock flow
│   └── upload-photo.ts      # Upload photo flow
├── middleware/
│   ├── auth.ts              # Verify admin users
│   ├── tenant.ts            # Resolve tenant context
│   └── i18n.ts              # Language detection
├── keyboards/
│   ├── main-menu.ts
│   └── product-list.ts
├── services/
│   └── api.ts               # Backend API client
└── types/
    └── context.ts           # Custom context type
```

## Bot Initialization

```typescript
// apps/bot-admin/src/bot.ts
import { Bot, session, GrammyError, HttpError } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { I18n } from '@grammyjs/i18n';
import { MyContext, SessionData } from './types/context';
import { env } from './config/env';

// Middleware
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';

// Commands
import { startCommand } from './commands/start';
import { stockCommand } from './commands/stock';
import { addCommand } from './commands/add';

// Conversations
import { addStockConversation } from './conversations/add-stock';
import { uploadPhotoConversation } from './conversations/upload-photo';

// Create bot instance
const bot = new Bot<MyContext>(env.TELEGRAM_ADMIN_BOT_TOKEN);

// i18n setup
const i18n = new I18n<MyContext>({
  defaultLocale: 'ru',
  directory: 'locales',
});

// Session middleware
bot.use(session({
  initial: (): SessionData => ({
    tenantId: undefined,
    language: 'ru',
  }),
}));

// Register middleware
bot.use(i18n);
bot.use(conversations());
bot.use(authMiddleware);
bot.use(tenantMiddleware);

// Register conversations
bot.use(createConversation(addStockConversation));
bot.use(createConversation(uploadPhotoConversation));

// Register commands
bot.command('start', startCommand);
bot.command('stock', stockCommand);
bot.command('add', addCommand);

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

export { bot };
```

## Custom Context Type

```typescript
// apps/bot-admin/src/types/context.ts
import { Context, SessionFlavor } from 'grammy';
import { ConversationFlavor } from '@grammyjs/conversations';
import { I18nFlavor } from '@grammyjs/i18n';

export interface SessionData {
  tenantId?: string;
  language: 'en' | 'ru' | 'uz';
}

export interface TenantData {
  id: string;
  name: string;
  subscriptionTier: 'basic' | 'pro';
}

export interface AdminUser {
  id: string;
  telegramId: number;
  tenantId: string;
  role: 'admin' | 'staff';
  name: string;
}

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor &
  I18nFlavor & {
    adminUser?: AdminUser;
    tenant?: TenantData;
  };
```

## Authentication Middleware

```typescript
// apps/bot-admin/src/middleware/auth.ts
import { NextFunction } from 'grammy';
import { MyContext } from '../types/context';
import { apiClient } from '../services/api';

export async function authMiddleware(ctx: MyContext, next: NextFunction) {
  // Skip auth for /start command
  if (ctx.message?.text?.startsWith('/start')) {
    return next();
  }

  const telegramId = ctx.from?.id;
  
  if (!telegramId) {
    await ctx.reply(ctx.t('errors.unauthorized'));
    return;
  }

  try {
    // Verify user with backend
    const response = await apiClient.post('/auth/telegram/verify', {
      telegramId,
    });

    if (!response.data.user) {
      await ctx.reply(ctx.t('errors.notRegistered'));
      return;
    }

    ctx.adminUser = response.data.user;
    ctx.session.tenantId = response.data.user.tenantId;
    
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    await ctx.reply(ctx.t('errors.authFailed'));
  }
}
```

## Tenant Middleware

```typescript
// apps/bot-admin/src/middleware/tenant.ts
import { NextFunction } from 'grammy';
import { MyContext } from '../types/context';
import { apiClient } from '../services/api';

export async function tenantMiddleware(ctx: MyContext, next: NextFunction) {
  // Skip if no admin user (auth middleware should handle)
  if (!ctx.adminUser) {
    return next();
  }

  try {
    const response = await apiClient.get(`/tenants/${ctx.adminUser.tenantId}`);
    ctx.tenant = response.data;
    
    // Check subscription for pro features
    if (ctx.tenant.subscriptionTier !== 'pro') {
      // Bot usage requires Pro subscription
      await ctx.reply(ctx.t('subscription.proRequired'));
      return;
    }

    return next();
  } catch (error) {
    console.error('Tenant error:', error);
    await ctx.reply(ctx.t('errors.tenantNotFound'));
  }
}
```

## Command Patterns

### Start Command

```typescript
// apps/bot-admin/src/commands/start.ts
import { MyContext } from '../types/context';
import { mainMenuKeyboard } from '../keyboards/main-menu';

export async function startCommand(ctx: MyContext) {
  const name = ctx.from?.first_name || 'there';
  
  await ctx.reply(
    ctx.t('welcome.message', { name }),
    {
      reply_markup: mainMenuKeyboard(ctx),
    }
  );
}
```

### Stock Command

```typescript
// apps/bot-admin/src/commands/stock.ts
import { MyContext } from '../types/context';
import { apiClient } from '../services/api';

export async function stockCommand(ctx: MyContext) {
  if (!ctx.tenant) {
    return ctx.reply(ctx.t('errors.noTenant'));
  }

  try {
    const response = await apiClient.get('/products', {
      headers: { 'X-Tenant-ID': ctx.tenant.id },
    });

    const products = response.data;

    if (products.length === 0) {
      return ctx.reply(ctx.t('stock.empty'));
    }

    // Format stock list
    let message = `📦 *${ctx.t('stock.title')}*\n\n`;
    
    for (const product of products) {
      const stockEmoji = product.currentStockKg < 10 ? '🔴' : '🟢';
      message += `${stockEmoji} *${product.name}*\n`;
      message += `   ${product.currentStockKg.toFixed(2)} kg × ${formatUZS(product.basePricePerKg)}\n\n`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Stock fetch error:', error);
    await ctx.reply(ctx.t('errors.fetchFailed'));
  }
}

function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}
```

## Conversation Patterns

### Add Stock Conversation

```typescript
// apps/bot-admin/src/conversations/add-stock.ts
import { Conversation } from '@grammyjs/conversations';
import { MyContext } from '../types/context';
import { apiClient } from '../services/api';
import { productListKeyboard, cancelKeyboard } from '../keyboards';

export async function addStockConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
) {
  // Step 1: Select product
  const products = await conversation.external(async () => {
    const response = await apiClient.get('/products', {
      headers: { 'X-Tenant-ID': ctx.tenant!.id },
    });
    return response.data;
  });

  await ctx.reply(ctx.t('addStock.selectProduct'), {
    reply_markup: productListKeyboard(products),
  });

  const productResponse = await conversation.waitFor('callback_query:data');
  const productId = productResponse.callbackQuery.data.replace('product:', '');
  
  await productResponse.answerCallbackQuery();

  const selectedProduct = products.find((p: any) => p.id === productId);
  
  // Step 2: Enter quantity
  await ctx.reply(
    ctx.t('addStock.enterQuantity', { product: selectedProduct.name }),
    { reply_markup: cancelKeyboard() }
  );

  const quantityResponse = await conversation.waitFor('message:text');
  const quantityText = quantityResponse.message.text;

  // Handle cancel
  if (quantityText.toLowerCase() === 'cancel') {
    return ctx.reply(ctx.t('common.cancelled'));
  }

  const quantity = parseFloat(quantityText);

  // Validate quantity
  if (isNaN(quantity) || quantity <= 0) {
    return ctx.reply(ctx.t('errors.invalidQuantity'));
  }

  // Round to 2 decimal places
  const roundedQuantity = Math.round(quantity * 100) / 100;

  // Step 3: Confirm
  await ctx.reply(
    ctx.t('addStock.confirm', {
      product: selectedProduct.name,
      quantity: roundedQuantity.toFixed(2),
    }),
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ ' + ctx.t('common.confirm'), callback_data: 'confirm' },
            { text: '❌ ' + ctx.t('common.cancel'), callback_data: 'cancel' },
          ],
        ],
      },
    }
  );

  const confirmResponse = await conversation.waitFor('callback_query:data');
  await confirmResponse.answerCallbackQuery();

  if (confirmResponse.callbackQuery.data !== 'confirm') {
    return ctx.reply(ctx.t('common.cancelled'));
  }

  // Step 4: Save to backend
  try {
    await apiClient.post(
      '/stock/movements',
      {
        productId,
        type: 'IN',
        quantityKg: roundedQuantity,
      },
      {
        headers: { 'X-Tenant-ID': ctx.tenant!.id },
      }
    );

    await ctx.reply(
      ctx.t('addStock.success', {
        quantity: roundedQuantity.toFixed(2),
        product: selectedProduct.name,
      }),
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Add stock error:', error);
    await ctx.reply(ctx.t('errors.saveFailed'));
  }
}
```

### Upload Photo Conversation

```typescript
// apps/bot-admin/src/conversations/upload-photo.ts
import { Conversation } from '@grammyjs/conversations';
import { MyContext } from '../types/context';
import { apiClient } from '../services/api';

export async function uploadPhotoConversation(
  conversation: Conversation<MyContext>,
  ctx: MyContext
) {
  // Step 1: Request photo
  await ctx.reply(ctx.t('upload.sendPhoto'));

  // Wait for photo
  const photoResponse = await conversation.waitFor('message:photo');
  
  // Get highest resolution photo
  const photos = photoResponse.message.photo;
  const largestPhoto = photos[photos.length - 1];
  
  await ctx.reply(ctx.t('upload.processing'));

  try {
    // Get file from Telegram
    const file = await ctx.api.getFile(largestPhoto.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_ADMIN_BOT_TOKEN}/${file.file_path}`;

    // Send to backend (which handles Google Drive upload)
    const response = await apiClient.post(
      '/uploads/warehouse-photo',
      {
        fileUrl,
        filename: `warehouse_${Date.now()}.jpg`,
      },
      {
        headers: { 'X-Tenant-ID': ctx.tenant!.id },
      }
    );

    await ctx.reply(
      ctx.t('upload.success', { filename: response.data.filename }),
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Upload error:', error);
    await ctx.reply(ctx.t('errors.uploadFailed'));
  }
}
```

## Keyboard Patterns

```typescript
// apps/bot-admin/src/keyboards/main-menu.ts
import { InlineKeyboard } from 'grammy';
import { MyContext } from '../types/context';

export function mainMenuKeyboard(ctx: MyContext): InlineKeyboard {
  return new InlineKeyboard()
    .text('📦 ' + ctx.t('menu.viewStock'), 'action:stock')
    .row()
    .text('➕ ' + ctx.t('menu.addStock'), 'action:add')
    .text('📤 ' + ctx.t('menu.upload'), 'action:upload')
    .row()
    .text('📊 ' + ctx.t('menu.reports'), 'action:reports')
    .text('⚙️ ' + ctx.t('menu.settings'), 'action:settings');
}

// apps/bot-admin/src/keyboards/product-list.ts
import { InlineKeyboard } from 'grammy';

interface Product {
  id: string;
  name: string;
  currentStockKg: number;
}

export function productListKeyboard(products: Product[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  for (const product of products) {
    keyboard
      .text(`${product.name} (${product.currentStockKg.toFixed(2)} kg)`, `product:${product.id}`)
      .row();
  }
  
  keyboard.text('❌ Cancel', 'cancel');
  
  return keyboard;
}

export function cancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('❌ Cancel', 'cancel');
}
```

## API Client for Bot

```typescript
// apps/bot-admin/src/services/api.ts
import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Secret': env.BOT_API_SECRET, // Authenticate bot with backend
      },
    });
  }

  async get(url: string, config?: any) {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post(url: string, data?: any, config?: any) {
    const response = await this.client.post(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

## Localization Files

```json
// apps/bot-admin/locales/ru.json
{
  "welcome": {
    "message": "👋 Привет, {name}!\n\nДобро пожаловать в Mirsklada Bot.\nВыберите действие:"
  },
  "menu": {
    "viewStock": "Склад",
    "addStock": "Добавить",
    "upload": "Загрузить фото",
    "reports": "Отчёты",
    "settings": "Настройки"
  },
  "stock": {
    "title": "Остатки на складе",
    "empty": "Склад пуст. Добавьте товары через веб-приложение."
  },
  "addStock": {
    "selectProduct": "📦 Выберите товар:",
    "enterQuantity": "⚖️ Введите вес для *{product}* (в кг):",
    "confirm": "Подтвердите добавление:\n\n*{product}*\n+{quantity} кг",
    "success": "✅ Успешно добавлено *{quantity} кг* товара *{product}*"
  },
  "upload": {
    "sendPhoto": "📷 Отправьте фото склада:",
    "processing": "⏳ Загружаем фото...",
    "success": "✅ Фото сохранено: *{filename}*"
  },
  "common": {
    "confirm": "Подтвердить",
    "cancel": "Отмена",
    "cancelled": "❌ Операция отменена"
  },
  "errors": {
    "unauthorized": "❌ Вы не авторизованы. Обратитесь к администратору.",
    "notRegistered": "❌ Вы не зарегистрированы в системе.",
    "authFailed": "❌ Ошибка авторизации. Попробуйте позже.",
    "noTenant": "❌ Бизнес не найден.",
    "tenantNotFound": "❌ Бизнес не найден в системе.",
    "fetchFailed": "❌ Не удалось загрузить данные.",
    "saveFailed": "❌ Не удалось сохранить данные.",
    "uploadFailed": "❌ Не удалось загрузить фото.",
    "invalidQuantity": "❌ Неверный вес. Введите число больше 0."
  },
  "subscription": {
    "proRequired": "⭐ Telegram-бот доступен только на тарифе Pro.\n\nОбновите подписку в веб-приложении."
  }
}
```

## Entry Point

```typescript
// apps/bot-admin/src/index.ts
import { bot } from './bot';
import { env } from './config/env';

async function main() {
  console.log('🤖 Starting Admin Bot...');
  
  // Set bot commands
  await bot.api.setMyCommands([
    { command: 'start', description: 'Начать работу' },
    { command: 'stock', description: 'Посмотреть остатки' },
    { command: 'add', description: 'Добавить товар на склад' },
    { command: 'upload', description: 'Загрузить фото склада' },
    { command: 'help', description: 'Помощь' },
  ]);

  // Start bot
  if (env.NODE_ENV === 'production') {
    // Webhook mode for production
    // Configure webhook here
  } else {
    // Long polling for development
    bot.start({
      onStart: (botInfo) => {
        console.log(`✅ Bot @${botInfo.username} started!`);
      },
    });
  }
}

main().catch(console.error);
```
