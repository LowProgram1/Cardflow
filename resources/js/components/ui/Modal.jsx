import React from 'react';

export function Modal({ title, open, onClose, children, headerClassName = '' }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1E3A8A]/40 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 shadow-xl">
                <div className={`flex items-center justify-between px-5 py-4 border-b border-[#1E3A8A]/20 ${headerClassName}`}>
                    <h2 className="text-sm font-semibold tracking-tight text-[#1E3A8A]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-[#1E3A8A]/60 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/10 transition"
                    >
                        <span className="sr-only">Close</span>
                        <svg
                            className="w-4 h-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-4 text-sm text-[#1E3A8A]">{children}</div>
            </div>
        </div>
    );
}

