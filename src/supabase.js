
import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your Supabase URL and anon key
const supabaseUrl = 'https://grufptfyzuwdzmflutvk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydWZwdGZ5enV3ZHptZmx1dHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Nzk2MjYsImV4cCI6MjA3NDQ1NTYyNn0.rF4xAIcVE-vwRKJHZmC_mrV-GAWKp1LR7GXLYI0O5kg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
