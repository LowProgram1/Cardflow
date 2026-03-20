import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';

const INITIAL_VISIBLE_COUNT = 5;

function PaymentHistory({ transactionHistory }) {
    const [showAll, setShowAll] = useState(false);
    const total = transactionHistory.length;
    const visible = showAll ? transactionHistory : transactionHistory.slice(0, INITIAL_VISIBLE_COUNT);
    const hasMore = total > INITIAL_VISIBLE_COUNT;

    return (
        <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#1E3A8A]">Transaction History</h2>
                <span className="text-[11px] text-[#1E3A8A]/50">
                    {total ? `${total} transactions` : 'No data'}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead>
                        <tr className="border-b border-[#1E3A8A]/20 text-[#1E3A8A]/70">
                            <th className="py-2 pr-3 font-semibold">Card No.</th>
                            <th className="py-2 pr-3 font-semibold">Posted Date</th>
                            <th className="py-2 pr-3 font-semibold">Amount</th>
                            <th className="py-2 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {total === 0 && (
                            <tr>
                                <td colSpan={4} className="py-4 text-[#1E3A8A]/60 text-center">
                                    Expense and payment transactions will appear here.
                                </td>
                            </tr>
                        )}
                        {visible.map((row) => (
                            <tr key={row.id} className="border-b border-[#1E3A8A]/10 hover:bg-[#1E3A8A]/5">
                                <td className="py-2 pr-3 text-[#1E3A8A]">{row.card_last_four ? `•••• ${row.card_last_four}` : '—'}</td>
                                <td className="py-2 pr-3 text-[#1E3A8A]/80">{row.date_paid ?? row.transaction_date ?? '—'}</td>
                                <td className="py-2 pr-3 font-medium text-[#2563EB]">{row.formatted_amount_paid}</td>
                                <td className="py-2 text-[#1E3A8A]/80 capitalize">{row.status ?? 'expense'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <div className="mt-3 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setShowAll((prev) => !prev)}
                        className="text-xs font-medium text-[#2563EB] hover:text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 rounded px-3 py-1.5"
                    >
                        {showAll ? 'Show less' : `Show more (${total - INITIAL_VISIBLE_COUNT} more)`}
                    </button>
                </div>
            )}
        </div>
    );
}

function ExpenseList({ items }) {
    const [showAll, setShowAll] = useState(false);
    const total = items.length;
    const visible = showAll ? items : items.slice(0, INITIAL_VISIBLE_COUNT);
    const hasMore = total > INITIAL_VISIBLE_COUNT;

    return (
        <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead>
                        <tr className="border-b border-[#1E3A8A]/20 text-[#1E3A8A]/70">
                            <th className="py-2 pr-3 font-semibold">Statement Month</th>
                            <th className="py-2 pr-3 font-semibold">Card Name</th>
                            <th className="py-2 pr-3 font-semibold">Card No.</th>
                            <th className="py-2 pr-3 font-semibold">To Pay</th>
                            <th className="py-2 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((item) => {
                            const amount = Number(item.remaining ?? item.to_pay ?? 0);
                            const pending = amount > 0;
                            const advance = amount < 0;
                            const cardLabel = `${item.card_name ?? '—'}${item.card_last_four ? ` - •••• ${item.card_last_four}` : ''}`;
                            return (
                                <tr key={item.id} className="border-b border-[#1E3A8A]/10 hover:bg-[#1E3A8A]/5">
                                    <td className="py-2 pr-3 text-[#1E3A8A]">{item.statement_month_label ?? item.month_label ?? '—'}</td>
                                    <td className="py-2 pr-3 text-[#1E3A8A]">{cardLabel}</td>
                                    <td className="py-2 pr-3 text-[#1E3A8A]/80">{item.card_last_four ? `•••• ${item.card_last_four}` : '—'}</td>
                                    <td className="py-2 pr-3 font-medium text-[#2563EB]">{item.formatted_remaining ?? item.formatted_to_pay ?? '—'}</td>
                                    <td className="py-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${pending ? 'bg-amber-100 text-amber-800' : advance ? 'bg-sky-100 text-sky-700' : 'bg-green-100 text-green-700'}`}>
                                            {pending ? 'Pending' : advance ? 'Advance' : 'Paid'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <div className="mt-3 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setShowAll((prev) => !prev)}
                        className="text-xs font-medium text-[#2563EB] hover:text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 rounded px-3 py-1.5"
                    >
                        {showAll ? 'Show less' : `Show more (${total - INITIAL_VISIBLE_COUNT} more)`}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const { props } = usePage();
    const metrics = props?.metrics ?? { formatted_total_outstanding: '—', total_users: 0, active_cards: 0 };
    const cards = Array.isArray(props?.cards) ? props.cards : [];
    const transactionHistory = Array.isArray(props?.transactionHistory) ? props.transactionHistory : [];
    const remainingByCard = Array.isArray(props?.remainingByCard) ? props.remainingByCard : [];
    const isAdmin = props?.isAdmin === true;
    const canViewCards = props?.canViewCards !== false;
    const canViewExpenses = props?.canViewExpenses !== false;

    // Keep client dashboard fresh when expenses are updated from another account/tab.
    useEffect(() => {
        if (isAdmin) return;
        const reloadDashboard = () => {
            router.reload({
                only: ['metrics', 'cards', 'remainingByCard', 'transactionHistory', 'installmentExpenses', 'installmentSummary'],
                preserveScroll: true,
            });
        };

        const onFocus = () => reloadDashboard();
        window.addEventListener('focus', onFocus);

        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                reloadDashboard();
            }
        }, 30000);

        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(interval);
        };
    }, [isAdmin]);

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1E3A8A]">Overview</h1>
            </header>

            <section className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-2xl bg-[#2563EB] border border-[#2563EB] p-4 shadow-sm text-[#F3F4F6]">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#F3F4F6]/80 mb-1">
                        {isAdmin ? 'Overall Monthly Outstanding Balance' : 'My Monthly Outstanding Balance'}
                    </div>
                    <div className="text-2xl font-semibold text-[#F3F4F6]">
                        {metrics.formatted_total_outstanding ?? '—'}
                    </div>
                    <p className="mt-1 text-xs text-[#F3F4F6]/90">
                        {isAdmin ? 'Based on current-month card obligations only.' : 'Based on your current-month card obligations only.'}
                    </p>
                </div>

                {metrics.total_users != null && (
                <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#1E3A8A]/60 mb-1">Users</div>
                    <div className="text-2xl font-semibold text-[#1E3A8A]">{metrics.total_users}</div>
                    <p className="mt-1 text-xs text-[#1E3A8A]/70">People with access to CardFlow.</p>
                </div>
                )}

                {isAdmin && (
                <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#1E3A8A]/60 mb-1">Active cards</div>
                    <div className="text-2xl font-semibold text-[#1E3A8A]">{metrics.active_cards ?? 0}</div>
                    <p className="mt-1 text-xs text-[#1E3A8A]/70">Cards currently tracked as active.</p>
                </div>
                )}
            </section>

            {canViewExpenses && (
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#1E3A8A]">Installment & Full Payment</h2>
                        {isAdmin && (
                        <Link
                            href="/expenses"
                            className="text-xs font-medium text-[#2563EB] hover:text-[#1E3A8A]"
                        >
                            Manage expenses →
                        </Link>
                        )}
                    </div>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                        {remainingByCard.map((c) => {
                            const cardLabel = `${c.card_name ?? '—'}${c.card_last_four ? ` - •••• ${c.card_last_four}` : ''}`;
                            const amount = Number(c.remaining ?? 0);
                            const isPending = amount > 0;
                            const isAdvance = amount < 0;
                            return (
                                <div key={c.card_id ?? 'unknown'} className="rounded-2xl bg-amber-50 border border-amber-200 p-4 shadow-sm min-w-0">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-amber-800/80 mb-1">
                                        Monthly Outstanding
                                    </div>
                                    <div className="text-xs text-amber-900 mb-1 truncate">{cardLabel}</div>
                                    <div className="text-xl font-semibold text-amber-900">
                                        {c.formatted_remaining ?? '0.00'}
                                    </div>
                                    <p className="mt-1 text-xs text-amber-800/90">
                                        {isPending ? 'Pending for current statement month.' : isAdvance ? 'Advance payment credit for upcoming statement month.' : 'Paid for current statement month.'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <ExpenseList items={remainingByCard} />
                </section>
            )}

            {canViewExpenses && (
                <section className="mb-6">
                    <PaymentHistory transactionHistory={transactionHistory} />
                </section>
            )}

            {isAdmin && canViewCards && (
            <section className="grid gap-4 lg:grid-cols-1 mb-6">
                <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#1E3A8A]">Cards</h2>
                        <span className="text-[11px] text-[#1E3A8A]/50">{cards.length} total</span>
                    </div>
                    <div className="space-y-2 text-xs">
                        {cards.length === 0 && (
                            <p className="text-[#1E3A8A]/60 text-xs">
                                No cards yet. Start by adding your first credit card.
                            </p>
                        )}
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2"
                            >
                                <div>
                                    <div className="text-xs font-medium text-[#1E3A8A]">{card.name}</div>
                                    <div className="text-[11px] text-[#1E3A8A]/60">
                                        **** {card.last_four}
                                        {card.statement_day != null ? ` · Statement day ${card.statement_day}` : ''}
                                        {card.due_day ? ` · Due ${card.due_day}` : ''}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-[#2563EB]">
                                        {card.formatted_limit}
                                    </div>
                                    <div className="text-[11px] text-[#1E3A8A]/60">Limit</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            )}
        </AppLayout>
    );
}

