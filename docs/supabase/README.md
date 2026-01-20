# Supabase Setup

Выполни эти SQL-файлы в Supabase **SQL Editor** в указанном порядке:

## Порядок выполнения

1. `01-create-tables.sql` — создание таблиц
2. `02-create-indexes.sql` — индексы для быстрого поиска
3. `03-enable-rls.sql` — включение Row Level Security
4. `04-create-policies.sql` — политики доступа

## Как выполнить

1. Открой Supabase Dashboard
2. Перейди в **SQL Editor**
3. Нажми **New Query**
4. Скопируй содержимое файла и вставь
5. Нажми **Run**
6. Повтори для следующего файла

## После выполнения SQL

Отключи подтверждение email для тестирования:
- **Authentication** → **Providers** → **Email**
- Отключи **"Confirm email"**
