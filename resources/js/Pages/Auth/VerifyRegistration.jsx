import React from 'react';
import { useForm } from '@inertiajs/react';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { PasswordConfirmationHint } from '../../components/ui/PasswordConfirmationHint';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';

export default function VerifyRegistration({ email, token }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register/verify');
    };

    return (
        <div className="min-h-screen bg-[#E5E7EB] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white shadow-xl p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-semibold text-[#1E3A8A]">Set your password</h1>
                        <p className="text-sm text-[#1E3A8A]/70 mt-1">
                            Verify your account for {email}
                        </p>
                    </div>
                    <form onSubmit={submit} className="space-y-4">
                        <input type="hidden" name="token" value={data.token} />
                        <FormValidationSummary errors={errors} />
                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-[#1E3A8A] mb-1">
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Min 12 chars, upper & lower case, number, symbol"
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
                                placeholder="Confirm your password"
                                className="w-full rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2.5 text-sm text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                            />
                            <PasswordConfirmationHint password={data.password} confirmation={data.password_confirmation} />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                        >
                            {processing ? 'Saving…' : 'Set password and verify'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
