-- ============================================
-- CHRONOGRAPH APP - Database Schema
-- Выполнять в Supabase SQL Editor
-- ============================================

-- 1. Создание таблицы rooms (без active_timer_id пока)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code VARCHAR(9) UNIQUE NOT NULL,
  name VARCHAR(100) DEFAULT 'My Room',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Создание таблицы timers
CREATE TABLE IF NOT EXISTS timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 300,
  remaining_seconds INTEGER NOT NULL DEFAULT 300,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'stopped',
  is_on_air BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{"mode": "countdown", "soundEnabled": true, "flashEnabled": true, "overtimeEnabled": true, "yellowThreshold": 30, "redThreshold": 10}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Создание таблицы sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  peak_viewers INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0
);

-- 4. Добавить недостающие колонки в timers (если таблица уже существовала)
DO $$
BEGIN
  -- remaining_seconds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'remaining_seconds') THEN
    ALTER TABLE timers ADD COLUMN remaining_seconds INTEGER NOT NULL DEFAULT 300;
  END IF;
  -- elapsed_seconds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'elapsed_seconds') THEN
    ALTER TABLE timers ADD COLUMN elapsed_seconds INTEGER NOT NULL DEFAULT 0;
  END IF;
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'status') THEN
    ALTER TABLE timers ADD COLUMN status VARCHAR(20) DEFAULT 'stopped';
  END IF;
  -- is_on_air
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'is_on_air') THEN
    ALTER TABLE timers ADD COLUMN is_on_air BOOLEAN DEFAULT false;
  END IF;
  -- position
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'position') THEN
    ALTER TABLE timers ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
  -- settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'settings') THEN
    ALTER TABLE timers ADD COLUMN settings JSONB DEFAULT '{"mode": "countdown", "soundEnabled": true, "flashEnabled": true, "overtimeEnabled": true, "yellowThreshold": 30, "redThreshold": 10}';
  END IF;
  -- started_at (for server-side timer calculation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timers' AND column_name = 'started_at') THEN
    ALTER TABLE timers ADD COLUMN started_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- 5. Добавить колонку active_timer_id в rooms (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'active_timer_id'
  ) THEN
    ALTER TABLE rooms ADD COLUMN active_timer_id UUID;
  END IF;
END $$;

-- 6. Добавить foreign key constraint (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_active_timer' AND table_name = 'rooms'
  ) THEN
    ALTER TABLE rooms
      ADD CONSTRAINT fk_active_timer
      FOREIGN KEY (active_timer_id)
      REFERENCES timers(id)
      ON DELETE SET NULL;
  END IF;
END $$;
