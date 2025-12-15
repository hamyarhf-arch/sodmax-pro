// supabase-config.js
// این فایل رو با اطلاعات پروژه خودت پر کن

export const SUPABASE_CONFIG = {
  URL: 'https://zoqsgvgbmxrkemcwxwus.supabase.co',
  ANON_KEY: zoqsgvgbmxrkemcwxwus
};

// نحوه دریافت کلید:
// 1. به داشبورد Supabase برو
// 2. Project Settings → API
// 3. کلید "anon public" رو کپی کن
// 4. اینجا paste کن

export const TABLES = {
  USERS: 'users',
  GAMES: 'games',
  TRANSACTIONS: 'transactions',
  MISSIONS: 'missions',
  SALE_PLANS: 'sale_plans'
};

export const DEFAULT_VALUES = {
  STARTING_SOD: 1000000, // 1M SOD هدیه ثبت‌نام
  MINING_POWER: 10,      // قدرت استخراج پایه
  USER_LEVEL: 1,         // سطح اولیه
  USDT_RATE: 10000000    // 10M SOD = 0.01 USDT
};
