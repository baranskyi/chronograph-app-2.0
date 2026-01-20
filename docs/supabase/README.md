# Supabase Setup

Выполни эти SQL-файлы в Supabase **SQL Editor** в указанном порядке:

## Порядок выполнения

1. `01-create-tables.sql` — создание таблиц (rooms, timers, sessions)
2. `02-create-indexes.sql` — индексы для быстрого поиска
3. `03-enable-rls.sql` — включение Row Level Security
4. `04-create-policies.sql` — политики доступа (опционально)

## Как выполнить

1. Открой [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбери проект **chronograph-app**
3. Перейди в **SQL Editor**
4. Нажми **New Query**
5. Скопируй содержимое файла и вставь
6. Нажми **Run**
7. Повтори для следующего файла

## Схема базы данных

### rooms
- `id` — UUID (primary key)
- `user_id` — UUID (опционально, для аутентифицированных пользователей)
- `room_code` — VARCHAR(9), уникальный код комнаты (например, "ABCD-1234")
- `name` — название комнаты
- `active_timer_id` — UUID активного таймера
- `is_active` — статус комнаты
- `created_at`, `last_used_at` — временные метки

### timers
- `id` — UUID (primary key)
- `room_id` — UUID комнаты
- `name` — название таймера
- `duration` — длительность в секундах
- `remaining_seconds` — оставшееся время
- `elapsed_seconds` — прошедшее время
- `status` — статус (stopped, running, paused)
- `is_on_air` — флаг "On Air"
- `position` — порядок сортировки
- `settings` — JSONB с настройками

### sessions
- Для будущей аналитики (peak viewers, duration и т.д.)

## Примечания

- **user_id опционален** — комнаты могут быть анонимными
- **Сервер использует service role key** — RLS обходится
- Политики в `04-create-policies.sql` нужны для прямого доступа с фронтенда
- Данные сохраняются постоянно, даже после рестарта сервера

## Environment Variables (Railway)

Убедись, что в Railway настроены:
- `VITE_SUPABASE_URL` — URL проекта Supabase
- `VITE_SUPABASE_ANON_KEY` — публичный ключ Supabase

Или серверные варианты:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (для полного доступа)
