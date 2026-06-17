# Multi-Tenant Fleet Management Authentication Setup

This guide will help you set up the complete authentication system for your B2B multi-tenant SaaS fleet management platform.

## 🚀 Quick Setup Overview

1. **Supabase Project Setup**
2. **Database Schema Setup**
3. **Google OAuth Configuration**
4. **Environment Variables**
5. **Testing the Authentication**

---

## 1. Supabase Project Setup

### Create a New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `fleet-management-platform`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

### Get Your Project Credentials
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **Project API Keys** → `anon public`
   - **Project API Keys** → `service_role` (keep this secret!)

---

## 2. Database Schema Setup

### Run the SQL Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire content from `database-setup.sql`
3. Run the SQL to create all tables, indexes, RLS policies, and functions

### What the Schema Creates:
- **organizations**: Company/tenant data
- **users**: Extended user profiles linked to auth.users
- **vehicles**: Fleet vehicle information with geographic location
- **routes**: Route planning and management
- **vehicle_tracking**: Historical tracking data
- **Automatic user/org creation**: Triggers for seamless signup
- **Row Level Security**: Complete tenant isolation

---

## 3. Google OAuth Configuration

### Configure Google OAuth Provider
1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. You'll need to create a Google OAuth app:

#### Create Google OAuth App:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type**: Web application
6. Add **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** and **Client Secret**

#### Configure in Supabase:
1. Paste **Client ID** and **Client Secret** in Supabase Google provider settings
2. Save the configuration

---

## 4. Environment Variables

### Update Your `.env.local`
Replace the placeholder values in your `.env.local` file:

```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_actual_mapbox_token

# Supabase Configuration for Multi-tenant Fleet Management
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important**: Never commit the service role key to version control!

---

## 5. Authentication Flow

### How It Works:

#### New User Signup:
1. **Email/Password**: User signs up with email, password, and company name
2. **Google OAuth**: User signs in with Google (company name optional)
3. **Auto-Organization**: System automatically creates organization and assigns user as admin
4. **Profile Creation**: User profile is created with proper role and organization link

#### Existing User Login:
1. User signs in with email/password or Google
2. System fetches user profile and organization data
3. All data access is automatically filtered by organization (RLS)

#### Multi-Tenant Security:
- **Row Level Security**: Users can only see their organization's data
- **Role-Based Access**: Admin, Dispatcher, Viewer roles with different permissions
- **Automatic Filtering**: All queries automatically filter by organization

---

## 6. Testing the Authentication

### Test Email/Password Signup:
1. Go to `/signup`
2. Fill in:
   - **Email**: test@yourcompany.com
   - **Password**: Strong password
   - **Full Name**: Test User
   - **Company Name**: Test Company
3. Check email for verification link
4. Verify and sign in

### Test Google OAuth:
1. Go to `/signin`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Should auto-create organization and redirect to dashboard

### Verify Multi-Tenancy:
1. Create two different organizations
2. Add vehicles to each organization
3. Sign in as different users
4. Verify each user only sees their organization's vehicles

---

## 7. Features Included

### ✅ Authentication Features:
- **Email/Password Authentication**
- **Google OAuth (SSO)**
- **Automatic user profile creation**
- **Organization auto-creation**
- **Role-based access control**
- **Session management**
- **Password reset (built-in with Supabase)**

### ✅ Multi-Tenancy Features:
- **Complete data isolation**
- **Row Level Security (RLS)**
- **Organization-based filtering**
- **Role-based permissions**
- **Scalable architecture**

### ✅ Fleet Management Integration:
- **Vehicle management per organization**
- **Route planning per organization**
- **Tracking data per organization**
- **User management per organization**

---

## 8. Next Steps

### Add More Authentication Features:
1. **Email Verification**: Configure email templates in Supabase
2. **Password Reset**: Customize reset flow
3. **User Invitations**: Add team member invitation system
4. **SSO Providers**: Add Microsoft, Apple, etc.

### Enhance Multi-Tenancy:
1. **Subdomain Routing**: Route users based on organization slug
2. **Custom Branding**: Allow organizations to customize their interface
3. **Billing Integration**: Add Stripe for subscription management
4. **Admin Panel**: Create super admin interface for managing all organizations

### Fleet Management Features:
1. **Real-time Vehicle Tracking**: Connect to actual GPS devices
2. **Route Optimization**: Add route planning algorithms
3. **Alerts & Notifications**: Real-time alerts for vehicle issues
4. **Analytics Dashboard**: Fleet performance metrics
5. **Driver Management**: Driver profiles and assignments

---

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **RLS Policies**: Always use Row Level Security for multi-tenant data
3. **Role Validation**: Validate user roles on both client and server
4. **API Security**: Use service role key only in server-side functions
5. **Regular Updates**: Keep Supabase client libraries updated

---

## 🆘 Troubleshooting

### Common Issues:

#### "Invalid API key" Error:
- Check your environment variables
- Ensure you're using the correct project URL and keys

#### Google OAuth Not Working:
- Verify redirect URI matches exactly
- Check Google Cloud Console configuration
- Ensure Google+ API is enabled

#### RLS Blocking Queries:
- Check that user has proper organization assignment
- Verify RLS policies are correctly configured
- Use Supabase SQL editor to test queries

#### User Profile Not Created:
- Check that the trigger function is properly installed
- Verify the function has proper permissions
- Check Supabase logs for errors

---

Your multi-tenant fleet management authentication system is now ready! 🚀

Users can sign up, create organizations, and start managing their fleets with complete data isolation and security. 