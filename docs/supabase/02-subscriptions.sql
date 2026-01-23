-- ============================================
-- CHRONOGRAPH APP - Subscriptions Schema
-- Выполнять в Supabase SQL Editor ПОСЛЕ 01-create-tables.sql
-- ============================================

-- 1. Создание таблицы user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(20) DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'unlimited', 'enterprise')),
  status VARCHAR(20) DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(status);

-- 3. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Триггер для updated_at
DROP TRIGGER IF EXISTS trigger_subscription_updated_at ON user_subscriptions;
CREATE TRIGGER trigger_subscription_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- 5. Функция для автоматического создания trial подписки при регистрации
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'trial', 'trialing', NOW() + INTERVAL '3 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Триггер для автоматического создания trial при регистрации
DROP TRIGGER IF EXISTS trigger_create_trial ON auth.users;
CREATE TRIGGER trigger_create_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();

-- 7. RLS (Row Level Security) политики
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свою подписку
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может обновлять только свою подписку (ограниченно)
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role может делать всё (для webhooks)
DROP POLICY IF EXISTS "Service role full access" ON user_subscriptions;
CREATE POLICY "Service role full access" ON user_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Таблица для хранения contact form сообщений (Enterprise)
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  message TEXT NOT NULL,
  plan_interest VARCHAR(50) DEFAULT 'enterprise',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);

-- RLS для contact_requests (только insert для всех)
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact request" ON contact_requests;
CREATE POLICY "Anyone can submit contact request" ON contact_requests
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- План лимитов по подпискам:
-- trial:      unlimited rooms, unlimited timers (3 дня)
-- basic:      1 room, 1 timer
-- unlimited:  unlimited rooms, unlimited timers
-- enterprise: unlimited rooms, unlimited timers + customization
-- ============================================
