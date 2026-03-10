import React from 'react';

/**
 * Shows a summary alert when the form has validation errors.
 * Lists each validation message so users see what to fix on every submit.
 */
export function FormValidationSummary({ errors, className = '' }) {
    const entries = Object.entries(errors ?? {}).filter(([, v]) => v != null && String(v).trim() !== '');
    if (entries.length === 0) return null;

    return (
        <div
            className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 ${className}`}
            role="alert"
        >
            <div className="flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="min-w-0 flex-1">
                    <p className="font-medium">Please correct the errors below.</p>
                    <ul className="mt-1.5 list-disc list-inside text-xs text-red-700 space-y-0.5">
                        {entries.map(([field, message]) => (
                            <li key={field}>{String(message)}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
