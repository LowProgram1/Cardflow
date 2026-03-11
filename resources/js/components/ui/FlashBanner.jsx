import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Single flash message banner at the top of the content (same style for success, update, delete, error).
 * No modal, no OK button — auto-dismiss after 2.5s. Shown above the table/content in all modules.
 */
export function FlashBanner() {
    const { props } = usePage();
    const flash = props?.flash;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (flash?.message != null && flash?.key != null) {
            setVisible(true);
            const id = setTimeout(() => setVisible(false), 2500);
            return () => clearTimeout(id);
        }
    }, [flash?.key]);

    if (!flash?.message || !visible) return null;

    const type = flash.type || 'success';
    const isSuccess = type === 'success';
    const isDelete = type === 'delete';
    const isError = type === 'error';

    const styles = isSuccess
        ? 'border-green-200 bg-green-50 text-green-800'
        : isDelete || isError
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-[#1E3A8A]/20 bg-[#1E3A8A]/5 text-[#1E3A8A]';

    return (
        <div className="fixed inset-x-0 top-4 flex justify-center z-50 px-4 pointer-events-none">
            <div
                className={`rounded-xl border px-4 py-3 text-sm shadow-lg max-w-md w-full ${styles}`}
                role="status"
                aria-live="polite"
            >
                <p className="font-medium">{flash.message}</p>
            </div>
        </div>
    );
}
