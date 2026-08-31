'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import router from 'next/router';

const LoginPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [status, setStatus] = React.useState<'LOADING' | 'SUCCESS' | 'ERROR' | ''>('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    setStatus('LOADING');
    supabase.auth
      .signInWithPassword({ email, password })
      .then((response) => {
        if (response.error) {
          setStatus('ERROR');
        } else {
          setStatus('SUCCESS');
          router.push('/projects');
        }
      })
      .catch(() => {
        setStatus('ERROR');
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
        {status && (
          <p>
            {status} {status === 'ERROR' && ' - Login failed'}
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
