"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/');
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-zinc-500 text-center mb-8">
            Sign in to continue to Creative Studio
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full py-3">
              <LogIn className="w-5 h-5" />
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
