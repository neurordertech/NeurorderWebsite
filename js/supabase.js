const SUPABASE_URL = "https://nuxvshuynqycsxhtjrwr.supabase.co";

const SUPABASE_ANON_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51eHZzaHV5bnF5Y3N4aHRqcndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzQyNDUsImV4cCI6MjA5ODY1MDI0NX0.UO6NVZ-r4-filIS1sp7df-do2438alhVe88bg3LJdqg";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);