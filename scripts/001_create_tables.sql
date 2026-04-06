-- Templates table: stores saved templates for each format
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('post', 'storyImage', 'storyText', 'reelsCover')),
  settings JSONB NOT NULL,
  text_content TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table: stores user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  panel_theme TEXT DEFAULT 'light',
  default_format TEXT DEFAULT 'post',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Batch exports table: tracks batch export jobs
CREATE TABLE IF NOT EXISTS public.batch_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_images INT DEFAULT 0,
  completed_images INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Batch export items: individual images in a batch
CREATE TABLE IF NOT EXISTS public.batch_export_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batch_exports(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  format TEXT NOT NULL,
  settings JSONB NOT NULL,
  text_content TEXT,
  image_url TEXT,
  output_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_export_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates (public read for defaults, user-specific for custom)
CREATE POLICY "Anyone can read default templates" ON public.templates
  FOR SELECT USING (is_default = true);

CREATE POLICY "Authenticated users can read all templates" ON public.templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert templates" ON public.templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update templates" ON public.templates
  FOR UPDATE USING (auth.role() = 'authenticated' AND is_default = false);

CREATE POLICY "Authenticated users can delete non-default templates" ON public.templates
  FOR DELETE USING (auth.role() = 'authenticated' AND is_default = false);

-- RLS Policies for user_settings
CREATE POLICY "Users can read own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for batch_exports
CREATE POLICY "Users can read own batch exports" ON public.batch_exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch exports" ON public.batch_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch exports" ON public.batch_exports
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for batch_export_items
CREATE POLICY "Users can read own batch items" ON public.batch_export_items
  FOR SELECT USING (
    batch_id IN (SELECT id FROM public.batch_exports WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own batch items" ON public.batch_export_items
  FOR INSERT WITH CHECK (
    batch_id IN (SELECT id FROM public.batch_exports WHERE user_id = auth.uid())
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_format ON public.templates(format);
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON public.templates(is_default);
CREATE INDEX IF NOT EXISTS idx_batch_exports_user_id ON public.batch_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_export_items_batch_id ON public.batch_export_items(batch_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS templates_updated_at ON public.templates;
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
