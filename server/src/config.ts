export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      basicMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
      basicYearly: process.env.STRIPE_PRICE_BASIC_YEARLY || '',
      unlimitedMonthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || '',
      unlimitedYearly: process.env.STRIPE_PRICE_UNLIMITED_YEARLY || ''
    }
  }
}
