import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function useRequireAuth() {
  const { data: session, status } = useSession();
  const [authStatus, setAuthStatus] = useState<string>(status);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setAuthStatus(status)// optionally pass "google" as provider
    }
  }, [status])

  const isLoading = authStatus === 'unauthenticated'
  const isAuthenticated = authStatus === 'authenticated'

  return { session, isLoading, isAuthenticated }
}
