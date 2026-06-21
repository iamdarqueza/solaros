# Environment Variables

Create a local `.env.local` file for development.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Used for invite links in emails. Example: http://localhost:3000
NEXT_PUBLIC_APP_URL=

# Resend invite emails. Use a verified sender in production.
RESEND_API_KEY=
RESEND_FROM_EMAIL="SolarOS <onboarding@resend.dev>"
```

`RESEND_API_KEY` is optional for invite-code creation. Without it, SolarOS still creates invite codes, but it will skip sending email.
