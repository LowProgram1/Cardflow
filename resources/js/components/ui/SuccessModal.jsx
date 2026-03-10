import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * - Success (add/edit): modal with message + OK button.
 * - Delete: message only, no button, auto-dismiss after ~1.5s.
 */
export function SuccessModal() {
    const { props } = usePage();
    const flash = props?.flash;
    const [dismissed, setDismissed] = useState(false);
    const isSuccess = flash?.type === 'success';
    const isDelete = flash?.type === 'delete';
    const show = (isSuccess || isDelete) && flash?.message;

    useEffect(() => {
        if (show) setDismissed(false);
    }, [show, flash?.message]);

    // Delete: auto-dismiss after 1.5s
    useEffect(() => {
        if (!show || !isDelete) return;
        const id = setTimeout(() => setDismissed(true), 1500);
        return () => clearTimeout(id);
    }, [show, isDelete]);

    if (!show || dismissed) return null;

    // Delete: brief message only, no button, toast-style
    if (isDelete) {
        return (
            <div className="fixed inset-x-0 top-4 flex justify-center z-50 px-4 pointer-events-none">
                <div
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg transition-opacity duration-200"
                    role="status"
                >
                    <p className="font-medium">{flash.message}</p>
                </div>
            </div>
        );
    }

    // Success (add/edit): modal with OK button
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1E3A8A]/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#F3F4F6] border border-green-200 shadow-xl mx-4">
                <div className="px-5 py-4 border-b border-green-200/50">
                    <h2 className="text-sm font-semibold text-green-800">Success</h2>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-[#1E3A8A]/90">{flash.message}</p>
                </div>
                <div className="px-5 py-4 flex justify-end border-t border-[#1E3A8A]/20">
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-medium"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
