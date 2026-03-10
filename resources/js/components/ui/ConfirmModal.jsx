import React from 'react';

/**
 * Confirmation dialog: "Do you want to delete?" with Cancel and Confirm (e.g. Delete).
 */
export function ConfirmModal({
    open,
    title = 'Confirm delete',
    message = 'Do you want to delete?',
    confirmLabel = 'Delete',
    confirmClassName = 'bg-red-600 hover:bg-red-700 text-white',
    onConfirm,
    onCancel,
    loading = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1E3A8A]/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 shadow-xl mx-4">
                <div className="px-5 py-4 border-b border-[#1E3A8A]/20">
                    <h2 className="text-sm font-semibold text-[#1E3A8A]">{title}</h2>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-[#1E3A8A]/90">{message}</p>
                </div>
                <div className="px-5 py-4 flex justify-end gap-2 border-t border-[#1E3A8A]/20">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-[#1E3A8A]/20 px-4 py-2 text-xs font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/10 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-60 ${confirmClassName}`}
                    >
                        {loading ? 'Deleting…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
