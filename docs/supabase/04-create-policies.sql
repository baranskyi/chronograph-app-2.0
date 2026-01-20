-- ============================================
-- CHRONOGRAPH APP - Row Level Security Policies
-- Выполнять в Supabase SQL Editor
-- ============================================

-- Удалить существующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete own rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can view active rooms by code" ON rooms;
DROP POLICY IF EXISTS "Users can manage timers in own rooms" ON timers;
DROP POLICY IF EXISTS "Anyone can view timers in active rooms" ON timers;
DROP POLICY IF EXISTS "Users can manage sessions in own rooms" ON sessions;

-- ============================================
-- Policies для rooms
-- ============================================

-- Аутентифицированные пользователи могут видеть свои комнаты
CREATE POLICY "Users can view own rooms" ON rooms
  FOR SELECT USING (auth.uid() = user_id);

-- Аутентифицированные пользователи могут создавать комнаты
CREATE POLICY "Users can create own rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Аутентифицированные пользователи могут обновлять свои комнаты
CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE USING (auth.uid() = user_id);

-- Аутентифицированные пользователи могут удалять свои комнаты
CREATE POLICY "Users can delete own rooms" ON rooms
  FOR DELETE USING (auth.uid() = user_id);

-- Анонимные комнаты доступны всем по room_code (для viewers)
CREATE POLICY "Anyone can view active rooms by code" ON rooms
  FOR SELECT USING (is_active = true);

-- ============================================
-- Policies для timers
-- ============================================

-- Пользователи могут управлять таймерами в своих комнатах
-- ИЛИ в анонимных комнатах (user_id IS NULL)
CREATE POLICY "Users can manage timers in own rooms" ON timers
  FOR ALL USING (
    room_id IN (
      SELECT id FROM rooms
      WHERE user_id = auth.uid()
         OR user_id IS NULL
    )
  );

-- Viewer доступ к таймерам активных комнат
CREATE POLICY "Anyone can view timers in active rooms" ON timers
  FOR SELECT USING (room_id IN (SELECT id FROM rooms WHERE is_active = true));

-- ============================================
-- Policies для sessions
-- ============================================

-- Пользователи могут управлять сессиями в своих комнатах
-- ИЛИ в анонимных комнатах (user_id IS NULL)
CREATE POLICY "Users can manage sessions in own rooms" ON sessions
  FOR ALL USING (
    room_id IN (
      SELECT id FROM rooms
      WHERE user_id = auth.uid()
         OR user_id IS NULL
    )
  );

-- ============================================
-- ПРИМЕЧАНИЕ: Сервер использует service role key,
-- который обходит RLS. Эти политики нужны для
-- прямого доступа с фронтенда (если потребуется).
-- ============================================
