-- Индексы для быстрого поиска
CREATE INDEX idx_rooms_user_id ON rooms(user_id);
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_timers_room_id ON timers(room_id);
CREATE INDEX idx_sessions_room_id ON sessions(room_id);
