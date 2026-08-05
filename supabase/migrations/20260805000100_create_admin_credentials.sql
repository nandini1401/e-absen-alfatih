CREATE TABLE public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_credentials TO service_role;

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny anon access" ON public.admin_credentials
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "deny authenticated access" ON public.admin_credentials
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
