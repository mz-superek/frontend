'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [status, setStatus] = React.useState<'LOADING' | 'SUCCESS' | 'ERROR' | ''>('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    supabase.auth
      .signInWithPassword({ email, password })
      .then((response) => {
        if (response.error) {
          setStatus('ERROR');
          setErrorMessage(response.error.message);
        } else {
          setStatus('SUCCESS');
          router.replace('/projects');
        }
      })
      .catch((error) => {
        console.error(error);
        setStatus('ERROR');
        setErrorMessage(error.message || 'An unexpected error occurred.');
      });
  };
  return (
    <div>
      <h1>Login Page</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor='email'>Email:</label>
        <input type='email' id='email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor='password'>Password:</label>
        <input
          type='password'
          id='password'
          name='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type='submit' disabled={status === 'LOADING'}>
          Login
        </button>
        {status === 'ERROR' && <p role='alert'>{errorMessage}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
