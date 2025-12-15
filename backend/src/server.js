const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./utils/database');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// اتصال به دیتابیس
connectDB();

// Middleware امنیت
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقیقه
    max: 1000, // 1000 درخواست
    message: 'تعداد درخواست‌های شما زیاد است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date(),
        service: 'SODmAX API',
        version: require('./package.json').version
    });
});

// API Documentation
app.get('/api-docs', (req, res) => {
    res.json({
        name: 'SODmAX Pro API',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'ثبت نام کاربر جدید',
                'POST /api/auth/login': 'ورود کاربر',
                'GET /api/auth/profile': 'دریافت پروفایل'
            },
            game: {
                'GET /api/game': 'دریافت اطلاعات بازی',
                'POST /api/game/mine': 'استخراج دستی',
                'POST /api/game/boost': 'فعال‌سازی بوست',
                'POST /api/game/claim-usdt': 'دریافت پاداش USDT',
                'POST /api/game/buy-panel': 'خرید پنل SOD'
            },
            admin: {
                'GET /api/admin/users': 'لیست کاربران',
                'GET /api/admin/stats': 'آمار سیستم',
                'PUT /api/admin/users/:id': 'ویرایش کاربر',
                'DELETE /api/admin/users/:id': 'حذف کاربر'
            }
        }
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'خطای سرور' 
        : err.message;
    
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`
    🚀 SODmAX Pro API Server
    📍 Port: ${PORT}
    🌐 Environment: ${process.env.NODE_ENV || 'development'}
    📅 ${new Date().toLocaleString('fa-IR')}
    `);
});
