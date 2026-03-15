import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { PasswordConfirmationHint } from '../../components/ui/PasswordConfirmationHint';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen bg-[#E5E7EB] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-semibold text-[#1E3A8A]">Cardflow</h1>
                        <p className="text-sm text-[#1E3A8A]/70 mt-1">Create your account</p>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <FormValidationSummary errors={errors} />
                        <div>
                            <label htmlFor="name" className="block text-xs font-medium text-[#1E3A8A] mb-1">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2.5 text-sm text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                                placeholder="Your name"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                            )}
                        </div>
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
                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-[#1E3A8A] mb-1">
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2.5 text-sm text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                            />
                            <PasswordStrengthIndicator password={data.password} showOnlyWhenFilled />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation" className="block text-xs font-medium text-[#1E3A8A] mb-1">
                                Confirm password
                            </label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2.5 text-sm text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                            />
                            <PasswordConfirmationHint password={data.password} confirmation={data.password_confirmation} />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                            )}
                        </div>
                        <p className="text-xs text-[#1E3A8A]/60">
                            After signing up you will receive an email to verify your address. Activate it to login.
                        </p>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                        >
                            {processing ? 'Submitting…' : 'Sign up'}
                        </button>
                    </form>
                    <p className="mt-4 text-center text-sm text-[#1E3A8A]/70">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#2563EB] hover:text-[#1E3A8A] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
