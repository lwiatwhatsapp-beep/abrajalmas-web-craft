-- ===================================
-- جداول نظام التوظيف - أبراج الماس
-- ===================================

-- 1. جدول الوظائف المتاحة
CREATE TABLE IF NOT EXISTS job_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  type_ar TEXT NOT NULL DEFAULT 'دوام كامل',
  type_en TEXT NOT NULL DEFAULT 'Full-time',
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول طلبات التوظيف
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL,
  position_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  experience TEXT NOT NULL,
  education TEXT NOT NULL,
  specialization TEXT NOT NULL,
  skills TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contacted', 'interview', 'rejected', 'accepted')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_job_positions_active ON job_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_job_positions_order ON job_positions(display_order);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_position ON job_applications(position_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created ON job_applications(created_at DESC);

-- 4. إضافة RLS (Row Level Security)
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 5. سياسات الوصول للوظائف
-- السماح للجميع بقراءة الوظائف النشطة
CREATE POLICY "Anyone can view active job positions"
  ON job_positions FOR SELECT
  USING (is_active = true);

-- السماح للمسؤولين بكل العمليات
CREATE POLICY "Admins can do everything on job positions"
  ON job_positions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- 6. سياسات الوصول للطلبات
-- السماح للجميع بإضافة طلب
CREATE POLICY "Anyone can submit job application"
  ON job_applications FOR INSERT
  WITH CHECK (true);

-- السماح للمسؤولين بقراءة وتعديل الطلبات
CREATE POLICY "Admins can view all job applications"
  ON job_applications FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update job applications"
  ON job_applications FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- 7. إدخال بيانات أولية للوظائف
INSERT INTO job_positions (title_ar, title_en, type_ar, type_en, description_ar, description_en, display_order) VALUES
  ('مهندس شبكات', 'Network Engineer', 'دوام كامل', 'Full-time', 'خبرة في تصميم وتنفيذ الشبكات LAN/WAN والألياف الضوئية وإعداد المعدات الشبكية.', 'Experience in designing and implementing LAN/WAN networks, fiber optics, and network equipment setup.', 1),
  ('فني أنظمة مراقبة', 'CCTV Systems Technician', 'دوام كامل', 'Full-time', 'خبرة في تركيب وصيانة كاميرات المراقبة وأنظمة IP Camera وNVR/DVR.', 'Experience in installing and maintaining CCTV cameras, IP Camera systems, and NVR/DVR.', 2),
  ('فني جهد منخفض', 'Low-Voltage Technician', 'دوام كامل', 'Full-time', 'خبرة في أنظمة الجهد المنخفض والأنظمة الضعيفة وإنذار الحريق والصوت المركزي.', 'Experience in low-voltage systems, low-current systems, fire alarms, and central audio.', 3),
  ('مندوب مبيعات تقني', 'Technical Sales Representative', 'دوام كامل', 'Full-time', 'خبرة في المبيعات التقنية وتسويق الحلول والمعدات للشركات والمؤسسات.', 'Experience in technical sales and marketing solutions and equipment to companies and institutions.', 4),
  ('مطور برمجيات', 'Software Developer', 'دوام كامل', 'Full-time', 'خبرة في تطوير أنظمة إدارة المؤسسات والتطبيقات الويب والمحاسبة.', 'Experience in developing enterprise management systems, web applications, and accounting.', 5)
ON CONFLICT DO NOTHING;

-- 8. إنشاء function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. إنشاء triggers للتحديث التلقائي
CREATE TRIGGER update_job_positions_updated_at
  BEFORE UPDATE ON job_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. إنشاء view لإحصائيات الطلبات
CREATE OR REPLACE VIEW job_applications_stats AS
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_application
FROM job_applications
GROUP BY status;

-- ===================================
-- ملاحظات للتنفيذ:
-- ===================================
-- 1. قم بتنفيذ هذا الملف في Supabase SQL Editor
-- 2. تأكد من إنشاء مستخدم Admin في Authentication
-- 3. أضف role='admin' في metadata للمستخدم Admin
-- 4. للوصول إلى لوحة التحكم: /admin (يتطلب تسجيل دخول)
