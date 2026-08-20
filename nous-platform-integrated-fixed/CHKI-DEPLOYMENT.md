# CHKI delivery routes

Public personalised links after deployment:

- Cure Day Hospitals: `/app/community/chki-executive-briefing-v3/index.html?partner=cureday`
- Nitefalls Medical: `/app/community/chki-executive-briefing-v3/index.html?partner=nitefalls`
- Observatory Library: `/app/community/chki-executive-briefing-v3/index.html?partner=observatory`

The public portal is open. Partner Discussion is protected by NOUS authentication and the Supabase organisation-access layer.

Before activating private access:
1. Run `supabase db push`.
2. Confirm each organisation's official email domain directly with that organisation.
3. Add verified domains to `organisation_domains`.
4. Activate the organisation, membership, and CHKI programme-access records.

Do not grant access from frontend domain matching alone.
