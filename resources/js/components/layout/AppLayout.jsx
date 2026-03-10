import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Sidebar } from './Sidebar';
import { Toast } from '../ui/Toast';
import { SuccessModal } from '../ui/SuccessModal';

const SIDEBAR_COLLAPSED_KEY = 'cardflow-sidebar-collapsed';

export function AppLayout({ children }) {
    const { props } = usePage();
    const userName = props?.auth?.user?.name ?? 'Admin';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!mounted) return;
        try {
            const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
            if (stored !== null) setSidebarCollapsed(stored === 'true');
        } catch (_) {}
    }, [mounted]);

    const setCollapsed = (value) => {
        setSidebarCollapsed(value);
        try {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
        } catch (_) {}
    };

    return (
        <>
            <Toast />
            <SuccessModal />
            <div className="min-h-screen bg-[#E5E7EB] text-[#1E3A8A] flex flex-col sm:flex-row">
                {/* Mobile top bar: sticky when scrolling */}
                <header className="sticky top-0 z-30 flex h-12 min-h-12 w-full items-center justify-between gap-2 px-3 sm:px-4 bg-[#1E3A8A] text-[#F3F4F6] shrink-0 sm:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 -ml-2 rounded-lg text-[#F3F4F6] hover:bg-[#F3F4F6]/10"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-[#F3F4F6]/20 border border-[#F3F4F6]/30 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-[#F3F4F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium truncate max-w-[140px]">{userName}</span>
                    </div>
                    <div className="w-10 shrink-0" aria-hidden />
                </header>

                {/* Desktop: sidebar fixed */}
                <div className={`hidden sm:block sm:fixed sm:inset-y-0 sm:left-0 z-20 ${sidebarCollapsed ? 'sm:w-[72px]' : 'sm:w-64'}`}>
                    <Sidebar
                        isCollapsed={sidebarCollapsed}
                        isMobileOpen={false}
                        onClose={() => setMobileMenuOpen(false)}
                    />
                </div>

                {/* Spacer so main content starts after sidebar on desktop */}
                <div className={sidebarCollapsed ? 'hidden sm:block sm:w-[72px] shrink-0' : 'hidden sm:block sm:w-64 shrink-0'} aria-hidden />

                {/* Mobile: sidebar overlay */}
                {mobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-30 bg-[#1E3A8A]/60 sm:hidden"
                            aria-hidden
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="fixed inset-y-0 left-0 z-40 sm:hidden">
                            <Sidebar
                                isCollapsed={false}
                                isMobileOpen={true}
                                onClose={() => setMobileMenuOpen(false)}
                            />
                        </div>
                    </>
                )}

                {/* Main content */}
                <main className="flex-1 min-w-0 flex flex-col border-t border-[#1E3A8A]/20 sm:border-t-0 sm:border-l sm:border-[#1E3A8A]/20 bg-[#E5E7EB] overflow-x-hidden">
                    {/* Desktop navbar: sticky when scrolling */}
                    <div className="hidden sm:flex sticky top-0 z-10 h-12 min-h-12 items-center gap-3 px-3 sm:px-4 border-b border-[#1E3A8A] bg-[#1E3A8A] text-[#F3F4F6] shrink-0">
                        <button
                            type="button"
                            onClick={() => setCollapsed(!sidebarCollapsed)}
                            className="p-2 rounded-lg text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6]"
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-[#F3F4F6]/20 border border-[#F3F4F6]/30 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-[#F3F4F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium truncate">{userName}</span>
                        </div>
                    </div>
                    <div className="w-full pl-5 sm:pl-6 pr-4 sm:pr-5 lg:pr-6 py-5 sm:py-6 lg:py-7">{children}</div>
                </main>
            </div>
        </>
    );
}
