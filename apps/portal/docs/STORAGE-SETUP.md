# Настройка системы хранения материалов

## 🎯 Что нужно сделать

Система хранения файлов готова! Осталось только настроить Supabase.

### Шаг 1: Создать таблицы в базе данных

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла
   `apps/portal/database/create_storage_materials.sql`
5. Нажмите **Run**

### Шаг 2: Создать Storage Bucket

1. В Supabase Dashboard перейдите в **Storage**
2. Нажмите **New bucket**
3. Введите имя: `materials`
4. **ВАЖНО**: Оставьте галочку "Public bucket" **ВЫКЛЮЧЕННОЙ** (приватный бакет)
5. Нажмите **Create bucket**

### Шаг 3: Добавить Storage Policies

После создания бакета:

1. Нажмите на бакет `materials`
2. Перейдите на вкладку **Policies**
3. Нажмите **Add policies**
4. Выберите **For full customization**

Добавьте эти политики:

#### Политика 1: Админы могут всё

```sql
-- Name: Admin full access
CREATE POLICY "Admin full access" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'materials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'materials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

#### Политика 2: Студенты могут скачивать назначенные файлы

```sql
-- Name: Students can read assigned files
CREATE POLICY "Students can read assigned files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'materials'
  AND (
    -- Публичные файлы
    EXISTS (
      SELECT 1 FROM storage_files sf
      WHERE sf.storage_path = name
      AND sf.is_public = true
    )
    OR
    -- Назначенные файлы
    EXISTS (
      SELECT 1 FROM student_materials sm
      JOIN storage_files sf ON sf.id = sm.file_id
      WHERE sf.storage_path = name
      AND sm.student_id = auth.uid()
    )
  )
);
```

---

## ✅ Готово!

После выполнения этих шагов:

1. **В админке** появится раздел **"Материалы"** в боковом меню
2. Вы сможете загружать файлы (PDF, изображения, аудио, видео и т.д.)
3. Категоризировать файлы (Хирагана, Катакана, N5, N4 и т.д.)
4. Назначать файлы конкретным ученикам
5. **Ученики** увидят свои материалы в личном кабинете
6. Система отслеживает, кто просмотрел какие файлы

## 📁 Поддерживаемые категории

- Хирагана
- Катакана
- Иероглифы (Кандзи)
- Грамматика
- Словарь
- Чтение
- Аудирование
- JLPT N5
- JLPT N4
- JLPT N3
- Домашнее задание
- Общее

## 💾 Лимиты

- **Supabase Free Tier**: 1 GB хранилища
- **Max размер файла**: 50 MB
- Рекомендуется сжимать PDF и изображения перед загрузкой
