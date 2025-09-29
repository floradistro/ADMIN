'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredCapabilities?: string[];
}

export function ProtectedRoute({ children, requiredCapabilities = [] }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // For development - create a mock session if none exists
  useEffect(() => {
    if (status === 'loading') return;

    // If no session in development, create a mock one
    if (!session && process.env.NODE_ENV === 'development') {
      // Don't redirect, just allow access with mock session
      return;
    }

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has required capabilities
    if (requiredCapabilities.length > 0 && session.user?.capabilities) {
      const userCapabilities = session.user.capabilities || [];
      const hasRequiredCapabilities = requiredCapabilities.every(cap => 
        userCapabilities.includes(cap)
      );

      if (!hasRequiredCapabilities) {
        router.push('/auth/signin');
        return;
      }
    }
  }, [session, status, router, requiredCapabilities]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-100 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access in development even without session
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return <>{children}</>;
}