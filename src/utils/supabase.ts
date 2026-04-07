import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rizdcmdrsicuiouxlfle.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpemRjbWRyc2ljdWlvdXhsZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NzkwMjAsImV4cCI6MjA5MDM1NTAyMH0.BLy7iR5KVy6HKT-9mdyAt3mDv3ys6_IyaEp5ikvSSHI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);