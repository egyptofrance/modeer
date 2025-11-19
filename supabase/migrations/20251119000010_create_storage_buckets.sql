-- إنشاء Storage buckets للموظفين

-- Bucket للصور الشخصية
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket للمستندات
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- سياسات الوصول للصور الشخصية
-- الموظفون يمكنهم رفع صورهم
CREATE POLICY "Employees can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- الموظفون يمكنهم قراءة صورهم
CREATE POLICY "Employees can read their own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.is_application_admin = true
    )
  )
);

-- الموظفون يمكنهم تحديث صورهم
CREATE POLICY "Employees can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- الموظفون يمكنهم حذف صورهم
CREATE POLICY "Employees can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- سياسات الوصول للمستندات
-- الموظفون يمكنهم رفع مستنداتهم
CREATE POLICY "Employees can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- الموظفون والأدمن يمكنهم قراءة المستندات
CREATE POLICY "Employees can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.is_application_admin = true
    )
  )
);

-- الموظفون يمكنهم تحديث مستنداتهم
CREATE POLICY "Employees can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- الموظفون يمكنهم حذف مستنداتهم
CREATE POLICY "Employees can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
