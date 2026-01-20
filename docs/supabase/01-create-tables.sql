-- Комнаты пользователей
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code VARCHAR(9) UNIQUE NOT NULL,
  name VARCHAR(100) DEFAULT 'My Room',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Таймеры
CREATE TABLE timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL DEFAULT 300,
  position INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{"mode": "countdown", "soundEnabled": true, "flashEnabled": true}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- История сессий
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  peak_viewers INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0
);
