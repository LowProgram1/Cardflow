import React from 'react';
import { Link, usePage } from '@inertiajs/react';

/** Navigation config: keys visible only to admin (hidden from client/user). */
const ADMIN_ONLY_NAV_KEYS = ['users', 'expenses'];

/** All sidebar items in display order. Exported for mobile bottom nav. */
export const ALL_NAV_ITEMS = [
    {
        name: 'Dashboard',
        href: '/',
        key: 'dashboard',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM16 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM16 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
    {
        name: 'Users',
        href: '/users',
        key: 'users',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        name: 'Cards',
        href: '/cards',
        key: 'cards',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
    },
    {
        name: 'Expenses',
        href: '/expenses',
        key: 'expenses',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        name: 'Settings',
        href: '/settings',
        key: 'settings',
        icon: (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

/**
 * Returns nav items to display based on role: admin sees all, client/user sees only Dashboard, Cards, Settings.
 * @param {boolean} isAdmin - From shared auth.isAdmin (backend is source of truth).
 * @returns {typeof ALL_NAV_ITEMS}
 */
export function getNavItemsForRole(isAdmin) {
    if (isAdmin) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter((item) => !ADMIN_ONLY_NAV_KEYS.includes(item.key));
}

export function Sidebar({ isCollapsed = false, isMobileOpen = false, onClose }) {
    const { url, props } = usePage();
    const auth = props?.auth;
    const isAdmin = auth?.isAdmin === true;
    const userName = auth?.user?.name ?? 'User';
    const faviconUrl = props?.favicon_url ?? null;
    const navItemsFiltered = getNavItemsForRole(isAdmin);

    const aside = (
        <aside
            className={[
                'bg-[#1E3A8A] border-r border-[#1E3A8A] text-[#F3F4F6] flex flex-col shrink-0 transition-[width] duration-200 ease-out min-h-full',
                isMobileOpen
                    ? 'fixed inset-y-0 left-0 z-40 w-20 shadow-xl min-h-screen'
                    : `relative md:min-h-screen min-h-full ${isCollapsed ? 'w-[72px] md:w-[72px]' : 'w-full md:w-64'}`,
            ].join(' ')}
        >
            <div
                className={[
                    'bg-[#1E3A8A] px-4 py-3 border-b border-[#1E3A8A]/40 flex items-center min-h-10',
                    (isCollapsed || isMobileOpen) ? 'justify-center px-2' : 'justify-between md:justify-start gap-3',
                ].join(' ')}
            >
                <div className="h-9 w-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center shrink-0 overflow-hidden">
                    {faviconUrl ? (
                        <img src={faviconUrl} alt="CardFlow" className="h-full w-full object-contain" />
                    ) : (
                        <span className="text-xs font-semibold tracking-tight text-[#F3F4F6]">CF</span>
                    )}
                </div>
                {!isCollapsed && !isMobileOpen && (
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold tracking-tight text-[#F3F4F6] truncate">CardFlow</div>
                    </div>
                )}
                {isMobileOpen && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6] shrink-0 ml-auto md:hidden"
                        aria-label="Close menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            {/* Pinned Profile (desktop sidebar): avatar + name */}
            <div
                className={[
                    'border-b border-[#1E3A8A]/40 px-3 py-2.5 flex items-center gap-3 bg-[#1E3A8A] shrink-0',
                    (isCollapsed || isMobileOpen) ? 'justify-center px-2' : '',
                ].join(' ')}
            >
                <div className="h-8 w-8 rounded-full bg-[#F3F4F6]/20 border border-[#F3F4F6]/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#F3F4F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                {!isCollapsed && !isMobileOpen && (
                    <span className="text-sm font-medium text-[#F3F4F6] truncate" title={userName}>{userName}</span>
                )}
            </div>
            <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto bg-[#1E3A8A]">
                {navItemsFiltered.map((item) => {
                    const active = item.href === '/' ? url === '/' : url.startsWith(item.href);
                    const iconsOnly = isCollapsed || isMobileOpen;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={isMobileOpen ? onClose : undefined}
                            className={[
                                'flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors',
                                iconsOnly ? 'justify-center px-2' : 'gap-3',
                                active
                                    ? 'bg-[#F3F4F6]/10 text-[#F3F4F6] border border-[#F3F4F6]/20'
                                    : 'text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6] border border-transparent',
                            ].join(' ')}
                            title={iconsOnly ? item.name : undefined}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!iconsOnly && <span className="truncate">{item.name}</span>}
                            {!iconsOnly && active && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F3F4F6] shrink-0" />
                            )}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-[#1E3A8A] px-3 py-3 shrink-0 bg-[#1E3A8A]">
                <Link
                    as="button"
                    method="post"
                    href="/logout"
                    className={[
                        'flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-[#F3F4F6]/90 hover:bg-[#F3F4F6]/10 hover:text-[#F3F4F6] transition-colors border-0 bg-transparent cursor-pointer',
                        (isCollapsed || isMobileOpen) ? 'justify-center px-2' : 'gap-3',
                    ].join(' ')}
                    title={(isCollapsed || isMobileOpen) ? 'Log out' : undefined}
                >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!isCollapsed && !isMobileOpen && <span className="truncate">Log out</span>}
                </Link>
            </div>
        </aside>
    );

    return aside;
}
