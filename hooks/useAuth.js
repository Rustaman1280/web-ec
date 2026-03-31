import { useState, useEffect } from 'react';
import { subscribeToAuthStatus } from '@/lib/authUtils';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthStatus((data) => {
      if (data) {
        setCurrentUser(data.user);
        setProfile(data.profile);
      } else {
        setCurrentUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { currentUser, profile, loading };
}
