/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const errorMiddleware = require('./middlewares/error.middleware');

// Import route modules
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/products.routes');
const supplierRoutes = require('./modules/suppliers/suppliers.routes');
const clientRoutes = require('./modules/clients/clients.routes');
const purchaseRoutes = require('./modules/purchases/purchases.routes');
const orderRoutes = require('./modules/orders/orders.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const reportRoutes = require('./modules/reports/reports.routes');

const app = express();

// ===========================================
// Security Middleware
// ===========================================
app.use(helmet());

// ===========================================
// CORS Configuration
// ===========================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// ===========================================
// Body Parsing Middleware
// ===========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===========================================
// Logging Middleware
// ===========================================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ===========================================
// Health Check Endpoint
// ===========================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MirSklada API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ===========================================
// API Routes (v1)
// ===========================================
const API_PREFIX = '/api/v1';

// API Welcome/Health endpoint
app.get(API_PREFIX, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MirSklada API',
    version: 'v1',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      products: `${API_PREFIX}/products`,
      suppliers: `${API_PREFIX}/suppliers`,
      clients: `${API_PREFIX}/clients`,
      purchases: `${API_PREFIX}/purchases`,
      orders: `${API_PREFIX}/orders`,
      payments: `${API_PREFIX}/payments`,
      reports: `${API_PREFIX}/reports`,
    },
  });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/suppliers`, supplierRoutes);
app.use(`${API_PREFIX}/clients`, clientRoutes);
app.use(`${API_PREFIX}/purchases`, purchaseRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);

// ===========================================
// 404 Handler
// ===========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ===========================================
// Error Handler (must be last)
// ===========================================
app.use(errorMiddleware);

module.exports = app;
