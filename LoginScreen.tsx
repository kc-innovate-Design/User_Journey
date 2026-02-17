
import React from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const ALLOWED_DOMAINS = ['innovate-design.co.uk', 'innovate-design.com'];

interface LoginScreenProps {
    onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [isNewUser, setIsNewUser] = React.useState(false);

    const validateDomain = (email: string): boolean => {
        const domain = email.split('@')[1]?.toLowerCase();
        return ALLOWED_DOMAINS.includes(domain);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!validateDomain(email)) {
            setError('Only @innovate-design.co.uk and @innovate-design.com emails are allowed.');
            return;
        }

        setLoading(true);
        try {
            if (isNewUser) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLogin();
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Incorrect password. Try again or reset it below.');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found. Click "Create Account" below.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Account already exists. Try signing in instead.');
                setIsNewUser(false);
            } else if (err.code === 'auth/weak-password') {
                setError('Password must be at least 6 characters.');
            } else {
                setError(err.message || 'Sign-in failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Enter your email address first.');
            return;
        }
        if (!validateDomain(email)) {
            setError('Only @innovate-design.co.uk and @innovate-design.com emails are allowed.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setError('');
            setMessage('Password reset email sent! Check your inbox.');
        } catch (err: any) {
            setError('Could not send reset email. Check the address and try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-accent/30 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-10">
                    {/* Logo / Branding */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/20 backdrop-blur-sm rounded-2xl border border-accent/30 mb-6">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                                <path d="M18 20V10M12 20V4M6 20v-6" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Innovate System
                        </h1>
                        <p className="text-white/50 mt-2 text-sm font-light">
                            User Journey Mapping Tool
                        </p>
                    </div>

                    {/* Sign In Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@innovate-design.co.uk"
                                required
                                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                minLength={6}
                                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-accent text-white rounded-2xl font-semibold text-base shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{isNewUser ? 'Creating account...' : 'Signing in...'}</span>
                                </div>
                            ) : (
                                isNewUser ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {error && (
                        <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
                    )}
                    {message && (
                        <p className="mt-4 text-center text-green-400 text-sm">{message}</p>
                    )}

                    {/* Links */}
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <button
                            onClick={handleForgotPassword}
                            className="text-white/40 text-xs hover:text-accent transition-colors"
                        >
                            Forgot password?
                        </button>
                        <button
                            onClick={() => { setIsNewUser(!isNewUser); setError(''); setMessage(''); }}
                            className="text-white/40 text-xs hover:text-accent transition-colors"
                        >
                            {isNewUser ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <p className="text-white/30 text-xs">
                            Restricted to Innovate Design accounts
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
