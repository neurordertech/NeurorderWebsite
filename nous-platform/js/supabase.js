const SUPABASE_URL =
    "https://ixnncxwrztxluiltmsol.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_yQAdi3Qw64oPQoz6nNGr9Q_sTLA9U_o";

if (!window.supabase) {
    console.error(
        "Supabase library was not loaded before supabase.js."
    );
} else {
    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

    console.log("Nous connected to Supabase.");
}