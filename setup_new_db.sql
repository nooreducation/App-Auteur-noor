-- ========================================================
-- NOOR PLATFORM - MASTER SCHEMA MIGRATION
-- Project: Noor Studio (Auteur) + Noor Main (LMS)
-- TARGET: New Supabase Instance (ftklihdejahkxyrycsoc)
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE CATALOG TABLES
CREATE TABLE IF NOT EXISTS public.levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER MANAGEMENT
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student', -- 'admin', 'author', 'student', 'parent'
    allowed_levels TEXT[] DEFAULT '{}',
    allowed_subjects TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. COURSE CONTENT
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}'::jsonb, -- Store the full Noor JSON structure
    user_id UUID REFERENCES auth.users(id), -- Creator ID
    level TEXT, -- Denormalized for easy filtering
    subject TEXT, -- Denormalized for easy filtering
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist for legacy tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='status') THEN
        ALTER TABLE public.courses ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
END $$;

-- 5. THE CONVERSION BRAIN (SCORM/mAuthor AI Mapping)
CREATE TABLE IF NOT EXISTS public.conversion_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature TEXT UNIQUE NOT NULL, -- JSON structure DNA
    addon_id TEXT, -- e.g., 'gamememo'
    html_template TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LMS TRACKING & STUDENT PROGRESS
CREATE TABLE IF NOT EXISTS public.student_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    current_slide_index INTEGER DEFAULT 0,
    completed_slides JSONB DEFAULT '[]'::jsonb,
    scores JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_slug)
);

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0, -- percent 0-100
    status TEXT DEFAULT 'active',
    UNIQUE(student_id, course_id)
);

-- 7. SYSTEM & SOCIAL
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY (RLS) - PILOT PHASE POLICIES
-- NOTE: For production, refine these policies properly

-- 8. ROW LEVEL SECURITY (RLS) - OPTIMIZED PERFORMANCE
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- LEVELS
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Levels" ON public.levels;
DROP POLICY IF EXISTS "Admin All Levels" ON public.levels;
DROP POLICY IF EXISTS "Acces public levels" ON public.levels;
DROP POLICY IF EXISTS "Admin Delete" ON public.levels;
DROP POLICY IF EXISTS "Admin Insert" ON public.levels;
DROP POLICY IF EXISTS "Admin Update" ON public.levels;

CREATE POLICY "Public Read Levels" ON public.levels FOR SELECT USING (true);
CREATE POLICY "Admin Write Levels" ON public.levels FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admin All Subjects" ON public.subjects;
DROP POLICY IF EXISTS "Acces public subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admin Delete" ON public.subjects;
DROP POLICY IF EXISTS "Admin Insert" ON public.subjects;
DROP POLICY IF EXISTS "Admin Update" ON public.subjects;

CREATE POLICY "Public Read Subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admin Write Subjects" ON public.subjects FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner Update Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin Insert" ON public.profiles;
DROP POLICY IF EXISTS "Public Read" ON public.profiles;
DROP POLICY IF EXISTS "Admin All" ON public.profiles;

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Owner Update Profile" ON public.profiles FOR UPDATE 
USING ((SELECT auth.uid()) = id);
CREATE POLICY "Admin Manage Profiles" ON public.profiles FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- COURSES
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Published Courses" ON public.courses;
DROP POLICY IF EXISTS "Authors Management" ON public.courses;
DROP POLICY IF EXISTS "Les auteurs voient leurs propres cours" ON public.courses;
DROP POLICY IF EXISTS "Les auteurs créent leurs propres cours" ON public.courses;
DROP POLICY IF EXISTS "Les auteurs modifient leurs propres cours" ON public.courses;
DROP POLICY IF EXISTS "Owner Insert" ON public.courses;
DROP POLICY IF EXISTS "Owner Update" ON public.courses;
DROP POLICY IF EXISTS "Owner Delete" ON public.courses;
DROP POLICY IF EXISTS "Migration Policy" ON public.courses;

CREATE POLICY "Public Read Published Courses" ON public.courses FOR SELECT 
USING (status = 'published' OR (SELECT auth.uid()) = user_id);
CREATE POLICY "Authors Management" ON public.courses FOR ALL 
USING ((SELECT auth.uid()) = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- STUDENT PROGRESS
ALTER TABLE public.student_course_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users Track Own Progress" ON public.student_course_progress;
DROP POLICY IF EXISTS "Users can track their own progress" ON public.student_course_progress;

CREATE POLICY "Users Track Own Progress" ON public.student_course_progress FOR ALL 
USING ((SELECT auth.uid()) = student_id);

-- ENROLLMENTS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users See Own Enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can see their enrollments" ON public.enrollments;

CREATE POLICY "Users See Own Enrollments" ON public.enrollments FOR SELECT 
USING ((SELECT auth.uid()) = student_id);

-- CONVERSION RULES
ALTER TABLE public.conversion_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Brain Public Access" ON public.conversion_rules;
DROP POLICY IF EXISTS "Public Insert/Update Access" ON public.conversion_rules;
DROP POLICY IF EXISTS "Public Write" ON public.conversion_rules;
DROP POLICY IF EXISTS "Public Read" ON public.conversion_rules;
DROP POLICY IF EXISTS "Public Read Access" ON public.conversion_rules;

CREATE POLICY "Public Read Brain" ON public.conversion_rules FOR SELECT USING (true);
CREATE POLICY "Admin Manage Brain" ON public.conversion_rules FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT 
USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

-- 9. PERFORMANCE INDEXES (Resolves unindexed_foreign_keys warnings)
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON public.student_course_progress(student_id);

-- ========================================================
-- ✅ MIGRATION READY
-- ========================================================
