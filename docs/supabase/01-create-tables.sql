-- Комнаты (user_id опционален для анонимных комнат)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code VARCHAR(9) UNIQUE NOT NULL,
  name VARCHAR(100) DEFAULT 'My Room',
  active_timer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Таймеры с полным состоянием
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

-- История сессий
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  peak_viewers INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0
);

-- Добавить внешний ключ для active_timer_id после создания таблицы timers
ALTER TABLE rooms
  ADD CONSTRAINT fk_active_timer
  FOREIGN KEY (active_timer_id)
  REFERENCES timers(id)
  ON DELETE SET NULL;
