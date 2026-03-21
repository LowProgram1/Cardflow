import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function ForgotPassword() {
    const { flash, initialEmail } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: initialEmail || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-[#E5E7EB] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-semibold text-[#1E3A8A]">Forgot password?</h1>
                        <p className="text-sm text-[#1E3A8A]/70 mt-2">
                            Enter the email you used to sign up. We’ll send you a link to reset your password.
                        </p>
                    </div>
                    {flash?.message && (
                        <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${flash.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-[#1E3A8A]/20 bg-[#1E3A8A]/5 text-[#1E3A8A]'}`}>
                            {flash.message}
                        </div>
                    )}
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-[#1E3A8A] mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2.5 text-sm text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                        >
                            {processing ? 'Sending…' : 'Send reset link'}
                        </button>
                    </form>
                    <p className="mt-4 text-center">
                        <Link
                            href="/login"
                            className="text-sm text-[#2563EB] hover:text-[#1E3A8A] font-medium hover:underline"
                        >
                            Back to sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
