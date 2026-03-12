import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Sidebar, getNavItemsForRole } from './Sidebar';
import { FlashBanner } from '../ui/FlashBanner';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

/** Keys to show in mobile bottom nav (Dashboard, Users, Cards, Expenses). Profile, Settings, Logout live in mobile sidebar. */
const MOBILE_BOTTOM_NAV_KEYS = ['dashboard', 'users', 'cards', 'expenses'];

const SIDEBAR_COLLAPSED_KEY = 'cardflow-sidebar-collapsed';

export function AppLayout({ children }) {
    const { url, props } = usePage();
    const userName = props?.auth?.user?.name ?? 'Admin';
    const idleTimeoutMinutes = props?.auth?.idleTimeoutMinutes ?? 5;
    const isAdmin = props?.auth?.isAdmin === true;
    const allNavItems = getNavItemsForRole(isAdmin);
    const mobileNavItems = allNavItems.filter((item) => MOBILE_BOTTOM_NAV_KEYS.includes(item.key));
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useInactivityLogout(idleTimeoutMinutes);

    useEffect(() => {
        if (mobileMenuOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        setMounted(true);
    }, []);

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
            <FlashBanner />
            <div className="min-h-screen bg-[#E5E7EB] text-[#1E3A8A] flex flex-col md:flex-row">
                {/* Mobile top bar: hamburger opens sidebar; title in center */}
                <header className="sticky top-0 z-30 flex h-12 min-h-12 w-full items-center gap-2 px-3 md:px-4 bg-[#1E3A8A] text-[#F3F4F6] shrink-0 md:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2.5 rounded-lg text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6] shrink-0"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold truncate flex-1 text-center">CardFlow</span>
                    <div className="w-10 shrink-0" aria-hidden />
                </header>

                {/* Mobile sidebar: Profile & Settings at top, Logout at bottom */}
                {mobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-[#1E3A8A]/60 md:hidden"
                            aria-hidden
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <aside className="fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] flex flex-col bg-[#1E3A8A] text-[#F3F4F6] shadow-xl md:hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]/10">
                                <span className="text-sm font-semibold">Menu</span>
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 rounded-lg text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10"
                                    aria-label="Close menu"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="px-3 py-4 space-y-1 border-b border-[#F3F4F6]/10">
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#F3F4F6]/5">
                                    <div className="h-10 w-10 rounded-full bg-[#F3F4F6]/20 border border-[#F3F4F6]/30 flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-[#F3F4F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium truncate">{userName}</span>
                                </div>
                                <Link
                                    href="/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6]"
                                >
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </Link>
                            </div>
                            <div className="flex-1 min-h-0" />
                            <div className="border-t border-[#F3F4F6]/10 px-3 py-4">
                                <Link
                                    as="button"
                                    method="post"
                                    href="/logout"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6] border-0 bg-transparent cursor-pointer"
                                >
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Log out
                                </Link>
                            </div>
                        </aside>
                    </>
                )}

                {/* Desktop (≥768px): sidebar fixed */}
                <div className={`hidden md:block md:fixed md:inset-y-0 md:left-0 z-20 ${sidebarCollapsed ? 'md:w-[72px]' : 'md:w-64'}`}>
                    <Sidebar
                        isCollapsed={sidebarCollapsed}
                        isMobileOpen={false}
                        onClose={() => {}}
                    />
                </div>

                {/* Spacer so main content has margin-left equal to sidebar on desktop */}
                <div className={sidebarCollapsed ? 'hidden md:block md:w-[72px] shrink-0' : 'hidden md:block md:w-64 shrink-0'} aria-hidden />

                {/* Main content */}
                <main className="flex-1 min-w-0 flex flex-col border-t border-[#1E3A8A]/20 md:border-t-0 md:border-l md:border-[#1E3A8A]/20 bg-[#E5E7EB] overflow-x-hidden">
                    {/* Desktop (≥768px) navbar: sticky when scrolling */}
                    <div className="hidden md:flex sticky top-0 z-10 h-12 min-h-12 items-center gap-3 px-3 md:px-4 border-b border-[#1E3A8A] bg-[#1E3A8A] text-[#F3F4F6] shrink-0">
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
                    </div>
                    <div className="w-full pl-5 md:pl-6 pr-4 md:pr-5 lg:pr-6 pt-5 md:pt-6 lg:pt-7 pb-[max(6rem,calc(1rem+env(safe-area-inset-bottom,0px)))] md:pb-6 lg:pb-7">{children}</div>
                </main>

                {/* Mobile (<768px): fixed bottom navigation bar; hidden on desktop */}
                <nav
                    className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden h-16 items-center justify-around bg-[#1E3A8A] border-t border-[#F3F4F6]/10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2"
                    aria-label="Main navigation"
                >
                    {mobileNavItems.map((item) => {
                        const active = item.href === '/' ? url === '/' : url.startsWith(item.href);
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 rounded-lg transition-colors ${
                                    active ? 'text-[#F3F4F6] bg-[#F3F4F6]/10' : 'text-[#F3F4F6]/80 hover:bg-[#F3F4F6]/5 hover:text-[#F3F4F6]'
                                }`}
                            >
                                <span className="shrink-0 [&>svg]:w-6 [&>svg]:h-6">{item.icon}</span>
                                <span className="text-[11px] font-medium truncate w-full text-center leading-tight">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
