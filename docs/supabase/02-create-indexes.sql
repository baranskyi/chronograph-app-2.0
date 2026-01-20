-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_timers_room_id ON timers(room_id);
CREATE INDEX IF NOT EXISTS idx_timers_is_on_air ON timers(is_on_air);
CREATE INDEX IF NOT EXISTS idx_sessions_room_id ON sessions(room_id);
