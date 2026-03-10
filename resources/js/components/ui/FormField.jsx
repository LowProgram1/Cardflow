import React from 'react';

/**
 * Wraps a form control with label and validation error message.
 * Use with inputs that add their own error border, e.g. className={errors.x ? 'border-red-500' : ''}
 */
export function FormField({ label, name, error, children, required, hint, className = '' }) {
    const hasError = !!error;
    const inputId = name ? `field-${name}` : undefined;

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className={`block text-xs font-medium ${hasError ? 'text-red-700' : 'text-[#1E3A8A]'}`}
                >
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {typeof children === 'function' ? children({ hasError, inputId }) : children}
            </div>
            {hint && !error && <p className="text-[11px] text-[#1E3A8A]/50">{hint}</p>}
            {error && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1" role="alert">
                    <svg className="w-3.5 h-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
