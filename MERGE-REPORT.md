# NOUS Platform Integration Report

## Result
This repository is the standalone integrated NOUS Platform. It is not embedded in the NeurorderWebsite repository.

## Source precedence
- Original `nous-platform`: backend, Supabase functions, migrations, authentication/API files and deployment foundation.
- New `nous-platform-3`: current application shell, four-space interface, CHKI Community experience and partner-access interface.

## Preserved backend work
- `js/auth.js`, `js/api.js`, `js/supabase.js`, `js/nous.js`
- Supabase Edge Functions: `nous-bus`, `nous-consent`, `orule`
- Confidential backend-only `supabase/functions/_shared/boyros/`
- Core, presence, context, bus, consent and O.R.U.L.E. migrations

## Integrated frontend work
- Current `app/index.html` four-space shell
- Business experience
- Community tile and CHKI public portal
- Medical-universe Impact page
- Protected Partner Discussion gateway
- Organisation/domain/membership/programme-access migration

## Corrections made
- Renamed `js/rous.js` to `js/ros.js` to match the existing root HTML import.
- Corrected broken logo and script paths.
- Removed `.git`, `node_modules`, macOS metadata and Supabase temporary runtime/secrets from the delivery package.

## Deployment boundary
Deploy this repository independently as NOUS Platform. Link to it from neurorder.com rather than copying it into NeurorderWebsite.

## Required configuration
1. Confirm the public Supabase URL and anon/publishable key in `app/js/supabase-config.js` and any root configuration.
2. Run `npm install` after extraction.
3. Run `supabase db push` only after reviewing the new organisation-access migration.
4. Confirm the final NOUS production domain and authentication redirect URLs.
5. Approve partner domains only after direct organisational verification.
