# Email Domain Validation System

This document explains the email domain validation system implemented for sign up and sign in functionality.

## Overview

The system validates email addresses on both client-side and server-side to ensure only authorized domains can create accounts and sign in. It also blocks disposable email addresses.

## Allowed Domains

Only email addresses with the following Top Level Domains (TLDs) are allowed:

- `.com` - Commercial entities
- `.co` - Companies and commercial entities  
- `.io` - Technology companies and startups
- `.net` - Network-related organizations
- `.org` - Non-profit organizations
- `.ai` - AI and technology companies
- `.dev` - Developers and development companies
- `.app` - Mobile and web applications
- `.tech` - Technology companies

## Disposable Email Detection

The system blocks over 400+ known disposable email services including:
- 10minutemail.com
- mailinator.com
- guerrillamail.com
- yopmail.com
- tempmail.org
- And many more...

## Implementation Details

### Files Modified/Created

1. **`src/utils/emailValidation.ts`** - Core validation utility
   - `validateEmailDomain(email)` - Main validation function
   - `validateGoogleEmail(email)` - Google OAuth validation
   - Contains allowed domains list and disposable domains blacklist

2. **`src/components/auth/SignUpForm.tsx`** - Email signup validation
   - Validates email before submission
   - Shows appropriate error messages

3. **`src/components/auth/SignInForm.tsx`** - Email signin validation  
   - Validates email before authentication
   - Handles URL parameter errors from OAuth

4. **`src/app/auth/callback/route.ts`** - OAuth callback validation
   - Validates Google OAuth emails
   - Signs out user and redirects with error if email not allowed

### Validation Flow

#### Email/Password Sign Up/In:
1. User enters email address
2. Client-side validation runs on form submission
3. If validation fails, error is shown immediately
4. If validation passes, request proceeds to Supabase

#### Google OAuth:
1. User clicks "Sign in with Google"
2. Google OAuth flow completes
3. Callback route validates the Google email
4. If email domain not allowed:
   - User is signed out
   - Redirected to sign-in page with error message
5. If email is valid, user proceeds to app

### Error Messages

- **Invalid TLD**: "We detect that you are using a domain that is not allowed by our system. Please use an email with one of these domains: .com, .co, .io, .net, .org, .ai, .dev, .app, .tech"
- **Disposable Email**: "Disposable email addresses are not allowed. Please use a permanent email address."
- **Invalid Format**: "Please enter a valid email address"

## Testing

Valid email examples:
- user@company.com
- admin@startup.io  
- team@nonprofit.org
- dev@myapp.dev

Invalid email examples:
- user@domain.xyz (invalid TLD)
- temp@mailinator.com (disposable)
- user@company.info (invalid TLD)

## Security Benefits

1. **Prevents Spam**: Blocks disposable email services commonly used for spam
2. **Professional Users**: Ensures users have professional/permanent email addresses
3. **Brand Protection**: Limits access to specific types of organizations
4. **Reduced Abuse**: Makes it harder for bad actors to create fake accounts

## Maintenance

To update the validation:

1. **Add New TLD**: Add to `ALLOWED_DOMAINS` array in `emailValidation.ts`
2. **Block New Disposable Service**: Add domain to `DISPOSABLE_DOMAINS` array
3. **Custom Error Messages**: Modify error strings in validation functions

## Future Enhancements

- Add domain whitelist for specific companies
- Implement MX record validation
- Add email deliverability checks
- Create admin panel for domain management 