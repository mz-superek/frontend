'use client';
import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const ProjectsPage = () => {
  const router = useRouter();
  const [status, setStatus] = React.useState<'pending' | 'authenticated' | 'unauthenticated'>('pending');
  const [sessionData, setSessionData] = React.useState<Session | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = React.useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (data.session) {
        setSessionData(data.session);
        setStatus('authenticated');
      } else if (error) {
        setSessionErrorMessage(error.message);
        setStatus('unauthenticated');
      } else {
        setStatus('unauthenticated');
        router.replace('/login');
      }
    });
  }, [router]);
  return (
    <div>
      {status === 'pending' ? (
        <p>확인중...</p>
      ) : status === 'unauthenticated' ? (
        <>{sessionErrorMessage && <p role='alert'>{sessionErrorMessage}</p>}</>
      ) : (
        <>
          <h1>Projects Page</h1>
          <p>{sessionData?.user?.email}</p>
          <button
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) {
                setSessionErrorMessage(error.message);
              } else {
                setSessionData(null);
                setStatus('unauthenticated');
                router.replace('/login');
              }
            }}
          >
            logout
          </button>
          {sessionErrorMessage && <p role='alert'>{sessionErrorMessage}</p>}
        </>
      )}
    </div>
  );
};

export default ProjectsPage;
