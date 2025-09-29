'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';


export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('wordpress', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Access denied. Please check your credentials and try again.');
      } else if (result?.ok) {
        const session = await getSession();
        if (session) {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      {/* Main Login Card - Matching Product Card Style */}
      <div className="bg-neutral-800/30 backdrop-blur-sm border border-white/[0.04] rounded-lg w-full max-w-md p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 ease-out product-card shadow-2xl shadow-black/20">
        
        {/* Logo Section */}
        <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-top-2 duration-1000 ease-out delay-200">
          <div className="relative inline-block">
            <img 
              src="/logonew.png" 
              alt="Logo" 
              className="h-48 w-auto mx-auto opacity-50 transition-all duration-300 ease-out hover:opacity-70 hover:-translate-y-1 hover:drop-shadow-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Flora Distro Text */}
          <div className="mt-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-800 ease-out delay-400">
            <h1 
              className="text-neutral-400 opacity-60 transition-all duration-300 ease-out hover:opacity-80 tracking-wider"
              style={{
                fontFamily: 'DonGraffiti',
                fontSize: '1.5rem',
                fontWeight: 'normal',
                letterSpacing: '0.1em'
              } as React.CSSProperties}
            >
              Flora Distro
            </h1>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-1000 ease-out delay-500">
          
          {/* Username Field */}
          <div className="animate-in fade-in-0 slide-in-from-left-2 duration-800 ease-out delay-700">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              disabled={isLoading}
              className="w-full bg-neutral-800/30 border border-white/[0.06] rounded px-3 py-2.5 text-neutral-300 placeholder-neutral-600 focus:border-white/[0.12] focus:bg-neutral-800/50 focus:outline-none transition-all duration-300 product-text hover:border-white/[0.08] hover:bg-neutral-800/40"
            />
          </div>

          {/* Password Field */}
          <div className="animate-in fade-in-0 slide-in-from-right-2 duration-800 ease-out delay-900">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={isLoading}
              className="w-full bg-neutral-800/30 border border-white/[0.06] rounded px-3 py-2.5 text-neutral-300 placeholder-neutral-600 focus:border-white/[0.12] focus:bg-neutral-800/50 focus:outline-none transition-all duration-300 product-text hover:border-white/[0.08] hover:bg-neutral-800/40"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg animate-in fade-in-0 slide-in-from-top-1 duration-400 ease-out backdrop-blur-sm">
              <div className="text-sm product-text">{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full bg-neutral-800/40 hover:bg-neutral-700/50 text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.15] px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out hover:shadow-lg hover:shadow-white/10 active:scale-[0.98] animate-in fade-in-0 slide-in-from-bottom-2 duration-800 ease-out delay-1100 product-text font-medium backdrop-blur-sm"
          >
            <span className="inline-block transition-transform duration-200">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </span>
          </button>
        </form>

        {/* Footer Text */}
        <div className="mt-8 text-center animate-in fade-in-0 slide-in-from-bottom-1 duration-600 ease-out delay-1300">
          <p className="text-xs text-neutral-500 product-text transition-colors duration-300 hover:text-neutral-400">
            Enter your credentials to access the portal
          </p>
        </div>
      </div>
    </div>
  );
}