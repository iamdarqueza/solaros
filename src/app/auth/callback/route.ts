import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { validateGoogleEmail } from '@/utils/emailValidation'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/signin?error=auth_callback_error', requestUrl.origin))
    }

    // Handle email confirmation
    if (type === 'signup' || type === 'email') {
      return NextResponse.redirect(new URL('/signin?message=Email confirmed! You can now sign in.', requestUrl.origin))
    }

    // Validate the email from Google OAuth
    if (data.session?.user?.email) {
      const emailValidation = validateGoogleEmail(data.session.user.email);
      
      if (!emailValidation.isValid) {
        // Sign out the user since email is not allowed
        await supabase.auth.signOut();
        
        // Redirect with error message
        const errorMessage = encodeURIComponent(emailValidation.error || 'Email not allowed');
        return NextResponse.redirect(new URL(`/signin?error=email_not_allowed&message=${errorMessage}`, requestUrl.origin))
      }
    }
    
    // Add a small delay to ensure session is properly established
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 