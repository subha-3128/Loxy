-- ==============================================================================
-- LOXY: Zero-Knowledge Password Vault Database Schema & Row Level Security
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Vault Items Table (SENSITIVE FIELDS ENCRYPTED)
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  encrypted_data TEXT NOT NULL, -- AES-GCM ciphertext + IV payload in JSON
  category TEXT NOT NULL DEFAULT 'Other',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Index for user query performance
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON public.vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_category ON public.vault_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_vault_items_favorite ON public.vault_items(user_id, is_favorite);

-- Enable RLS for vault_items
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vault items"
  ON public.vault_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault items"
  ON public.vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault items"
  ON public.vault_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items"
  ON public.vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Vault Security Settings Table (Salt & Master Password Verification Token)
CREATE TABLE IF NOT EXISTS public.vault_settings (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  salt TEXT NOT NULL,                      -- Base64 PBKDF2 salt
  verification_data TEXT NOT NULL,         -- Encrypted sentinel token
  auto_lock_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vault settings"
  ON public.vault_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own vault settings"
  ON public.vault_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Auth trigger to create profile row automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
