-- ================================================
-- جدول شريط الصور اللانهائي (Infinite Marquee)
-- أبراج الماس - Abraj Almas
-- ================================================
-- التاريخ: 2026-06-03
-- قابل للتشغيل عدة مرات بأمان (Idempotent)
-- ================================================

-- 1. إنشاء الجدول (يُتجاهل إن كان موجوداً)
CREATE TABLE IF NOT EXISTS marquee_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT,
  image_url   TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  order_num   INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء Indexes للأداء (يُتجاهل إن كان موجوداً)
CREATE INDEX IF NOT EXISTS idx_marquee_items_active    ON marquee_items(is_active);
CREATE INDEX IF NOT EXISTS idx_marquee_items_order_num ON marquee_items(order_num);

-- 3. تفعيل Row Level Security
ALTER TABLE marquee_items ENABLE ROW LEVEL SECURITY;

-- 4. حذف السياسات القديمة أولاً ثم إعادة إنشائها
--    (DROP IF EXISTS يمنع خطأ "policy already exists")

DROP POLICY IF EXISTS "Anyone can view active marquee items" ON marquee_items;
DROP POLICY IF EXISTS "Service role full access on marquee"  ON marquee_items;

-- السماح للجميع بقراءة العناصر النشطة فقط
CREATE POLICY "Anyone can view active marquee items"
  ON marquee_items FOR SELECT
  USING (is_active = true);

-- السماح للمشرفين بعمليات الكتابة الكاملة
-- (يتوافق مع نظام المشروع الذي يعتمد على anon key + كلمة مرور)
CREATE POLICY "Service role full access on marquee"
  ON marquee_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. دالة تحديث updated_at (OR REPLACE تُحدّثها إن وُجدت)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger للتحديث التلقائي
DROP TRIGGER IF EXISTS update_marquee_items_updated_at ON marquee_items;
CREATE TRIGGER update_marquee_items_updated_at
  BEFORE UPDATE ON marquee_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. بيانات تمهيدية (Seed) — تُتجاهل إن كانت موجودة
-- الصور مخزّنة في public/assets/marquee/ باسم proj-N.png
INSERT INTO marquee_items (title, image_url, is_active, order_num) VALUES
  ('مشروع أبراج الماس 1',   '/assets/marquee/proj-1.png',  true, 1),
  ('مشروع أبراج الماس 2',   '/assets/marquee/proj-2.png',  true, 2),
  ('مشروع أبراج الماس 3',   '/assets/marquee/proj-3.png',  true, 3),
  ('مشروع أبراج الماس 4',   '/assets/marquee/proj-4.png',  true, 4),
  ('مشروع أبراج الماس 5',   '/assets/marquee/proj-5.png',  true, 5),
  ('مشروع أبراج الماس 6',   '/assets/marquee/proj-6.png',  true, 6),
  ('مشروع أبراج الماس 7',   '/assets/marquee/proj-7.png',  true, 7),
  ('مشروع أبراج الماس 8',   '/assets/marquee/proj-8.png',  true, 8),
  ('مشروع أبراج الماس 9',   '/assets/marquee/proj-9.png',  true, 9),
  ('مشروع أبراج الماس 10',  '/assets/marquee/proj-10.png', true, 10),
  ('مشروع أبراج الماس 11',  '/assets/marquee/proj-11.png', true, 11),
  ('مشروع أبراج الماس 12',  '/assets/marquee/proj-12.png', true, 12),
  ('مشروع أبراج الماس 13',  '/assets/marquee/proj-13.png', true, 13)
ON CONFLICT DO NOTHING;

-- ================================================
-- ✅ جاهز — يمكن تشغيل هذا الملف أكثر من مرة بأمان
-- ================================================
-- • إدارة العناصر: /admin → تبويب "شريط الصور"
-- • الصور المحلية: public/assets/marquee/proj-N.png
-- • رفع صور جديدة: عبر لوحة التحكم الإدارية
-- ================================================
