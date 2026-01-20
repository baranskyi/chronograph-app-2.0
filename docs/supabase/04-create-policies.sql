-- Policies для rooms
CREATE POLICY "Users can view own rooms" ON rooms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rooms" ON rooms
  FOR DELETE USING (auth.uid() = user_id);

-- Policies для timers
CREATE POLICY "Users can manage timers in own rooms" ON timers
  FOR ALL USING (room_id IN (SELECT id FROM rooms WHERE user_id = auth.uid()));

-- Policies для sessions
CREATE POLICY "Users can manage sessions in own rooms" ON sessions
  FOR ALL USING (room_id IN (SELECT id FROM rooms WHERE user_id = auth.uid()));
