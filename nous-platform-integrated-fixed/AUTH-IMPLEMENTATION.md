# NOUS Authentication Implementation

## Implemented
- Email/password sign in using Supabase Auth.
- Email/password account creation using Supabase Auth.
- Email confirmation return route.
- Persistent browser sessions and automatic token refresh.
- Protected NOUS app pages with return-to-page redirects.
- Dynamic signed-in name and initials in the NOUS profile control.
- Public CHKI access without authentication.
- Restricted CHKI Partner Discussion access through organisation membership and programme-access RPC.
- Sign-out support inside the partner workspace.

## Routes
- `/login.html`
- `/signup.html`
- `/app/index.html` — authenticated
- `/app/business.html` — authenticated
- `/app/community/chki-executive-briefing-v3/` — public
- `/app/partner-discussion.html` — authenticated and organisation restricted

## Supabase dashboard settings required
Add the deployed site URL and these redirect URLs under Authentication > URL Configuration:
- `https://YOUR-NOUS-DOMAIN/login.html`
- `https://YOUR-NOUS-DOMAIN/app/index.html`

Confirm the Email provider is enabled. Decide whether Confirm email remains enabled before launch.

## Validation completed
- JavaScript syntax checks passed for auth, auth guard and partner-access scripts.
- All authentication and CHKI routes returned HTTP 200 from a local static server.
- Signup metadata matches the automatic `nous_profiles` trigger in the core migration.

## Not remotely verified
A live sign-in against the production Supabase project was not performed because no test-user credentials were supplied. Complete the short launch test using a disposable test account after deployment.
