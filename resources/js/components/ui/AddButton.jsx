import React from 'react';

/**
 * Mobile-first add/create button: icon only on small screens, icon + label on md+.
 * Use for "New payment", "New card", etc.
 */
export function AddButton({ onClick, children, className = '', ariaLabel, type = 'button', ...rest }) {
    return (
        <button
            type={type}
            onClick={onClick}
            aria-label={ariaLabel ?? (typeof children === 'string' ? children : 'Add')}
            className={`inline-flex items-center justify-center rounded-lg bg-[#2563EB] p-2 text-white hover:bg-[#1E3A8A] md:px-3 md:py-1.5 md:text-xs md:font-medium ${className}`}
            {...rest}
        >
            <svg className="w-5 h-5 shrink-0 md:w-4 md:h-4 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {children != null && <span className="hidden md:inline">{children}</span>}
        </button>
    );
}
