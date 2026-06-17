-- SUPABASE EMAIL CONFIRMATION SETUP
-- This file contains instructions for enabling email confirmation in your Supabase project

/* 
STEP 1: Enable Email Confirmation in Supabase Dashboard
=========================================================

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings
3. Find "Email Confirmation" section
4. Enable "Confirm email" toggle
5. Set "Email confirmation redirect URL" to: ${SITE_URL}/auth/callback

This ensures that users must confirm their email before they can sign in.

STEP 2: Configure Email Templates (Optional)
==========================================

1. Go to Authentication → Email Templates
2. Customize the "Confirm signup" email template
3. You can customize the subject, HTML content, and styling

Example custom email template:
```
<h2>Welcome to Fleet Management Platform!</h2>
<p>Thanks for signing up! Follow this link to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

STEP 3: Test Email Confirmation
===============================

1. Try signing up with a real email address
2. Check your email for the confirmation link
3. Click the confirmation link
4. You should be redirected to /auth/callback
5. Try signing in - it should work after confirmation

STEP 4: Verify Email Confirmation Status (SQL Queries)
====================================================

You can run these queries in the SQL editor to check email confirmation status:
*/

-- Check recent users and their email confirmation status
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END as confirmation_status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Count confirmed vs unconfirmed users
SELECT 
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END as status,
    COUNT(*) as user_count
FROM auth.users 
GROUP BY 
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END;

-- Check if a specific user's email is confirmed (replace with actual email)
SELECT 
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email is confirmed'
        ELSE 'Email NOT confirmed'
    END as status
FROM auth.users 
WHERE email = 'user@example.com';  -- Replace with actual email

/*
TROUBLESHOOTING
===============

If email confirmation is not working:

1. Check that SMTP is configured properly in Supabase
2. Verify that the redirect URL matches exactly
3. Check spam folder for confirmation emails
4. Ensure the site URL is set correctly in project settings
5. Make sure "Confirm email" is enabled in Authentication → Settings

Common Issues:
- Users can sign up but don't receive confirmation emails → Check SMTP settings
- Users receive emails but links don't work → Check redirect URL setting
- Users get redirected to wrong page → Verify emailRedirectTo in code matches settings

The application code is already updated to:
- Require email confirmation for signup
- Block unconfirmed users from accessing the app
- Show proper error messages for unconfirmed users
- Handle email confirmation redirects properly
*/ 