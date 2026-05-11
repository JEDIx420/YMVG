import { createClient } from '@/utils/supabase/server';

/**
 * A generic wrapper for Server Actions that require an authenticated Supabase user.
 * Initializes the client, fetches the user, and standardizes error handling,
 * including safely passing through Next.js internal redirect signals.
 */
export async function withAuthAction<T>(
  actionFn: (supabase: any, user: any) => Promise<T>,
  fallbackReturn: T
): Promise<T> {
  // Initialize client OUTSIDE try/catch to prevent trapping DynamicServerUsage
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return fallbackReturn;
  }
  
  try {
    return await actionFn(supabase, user);
  } catch (error) {
     // Re-throw Next.js internal signals so the framework can handle them
     if (error instanceof Error && (error.message === 'NEXT_REDIRECT' || error.message.includes('DynamicServerError'))) {
       throw error;
     }
     
     // Also check Next 15 specific digest for dynamic server usage
     if ((error as any)?.digest === 'DYNAMIC_SERVER_USAGE') {
       throw error;
     }
     
     console.error("Action Error:", error);
     return fallbackReturn;
  }
}
