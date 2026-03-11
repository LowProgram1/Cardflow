import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { props } = usePage();
    const metrics = props?.metrics ?? { formatted_total_outstanding: '—', total_users: 0, active_cards: 0 };
    const cards = Array.isArray(props?.cards) ? props.cards : [];
    const transactionHistory = Array.isArray(props?.transactionHistory) ? props.transactionHistory : [];
    const installmentExpenses = Array.isArray(props?.installmentExpenses) ? props.installmentExpenses : [];
    const installmentSummary = props?.installmentSummary ?? { formatted_total_remaining: '—' };
    const remainingByUser = Array.isArray(props?.remainingByUser) ? props.remainingByUser : [];
    const isAdmin = props?.isAdmin === true;

    return (
        <AppLayout>
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1E3A8A]">Overview</h1>
                    <p className="text-xs sm:text-sm text-[#1E3A8A]/70 mt-1">
                        Snapshot of your credit card exposure and recent activity.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/cards"
                        className="inline-flex items-center rounded-lg border border-[#2563EB] bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] hover:border-[#1E3A8A] transition"
                    >
                        {isAdmin ? 'Manage Cards' : 'Transactions & statements'}
                    </Link>
                    {isAdmin && (
                    <Link
                        href="/expenses"
                        className="inline-flex items-center rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-1.5 text-xs font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/10 transition"
                    >
                        Log Expense
                    </Link>
                    )}
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-3 mb-6">
                {isAdmin && (
                <div className="rounded-2xl bg-[#2563EB] border border-[#2563EB] p-4 shadow-sm text-[#F3F4F6]">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#F3F4F6]/80 mb-1">Overall Outstanding Balance</div>
                    <div className="text-2xl font-semibold text-[#F3F4F6]">
                        {metrics.formatted_total_outstanding ?? '—'}
                    </div>
                    <p className="mt-1 text-xs text-[#F3F4F6]/90">
                        Total expenses minus payments; reduced when you mark installments or full payments as paid.
                    </p>
                </div>
                )}

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

            {installmentExpenses.length > 0 && (
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#1E3A8A]">Expenses (installment & full payment)</h2>
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
                        {remainingByUser.length > 0 ? (
                            remainingByUser.map((u) => (
                                <div key={u.user_id ?? 'unknown'} className="rounded-2xl bg-amber-50 border border-amber-200 p-4 shadow-sm min-w-0">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-amber-800/80 mb-1">Remaining · {u.user_name}</div>
                                    <div className="text-xl font-semibold text-amber-900">
                                        {u.formatted_remaining}
                                    </div>
                                    <p className="mt-1 text-xs text-amber-800/90">Outstanding balance for this user.</p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 shadow-sm">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-amber-800/80 mb-1">Remaining to pay</div>
                                <div className="text-xl font-semibold text-amber-900">
                                    {installmentSummary.formatted_total_remaining}
                                </div>
                                <p className="mt-1 text-xs text-amber-800/90">Outstanding amount.</p>
                            </div>
                        )}
                    </div>
                    <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
                        <div className="space-y-2 text-xs">
                            {installmentExpenses.map((item) => (
                                <div
                                    key={`${item.payment_type}-${item.id}`}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1E3A8A]/20 bg-white px-3 py-2"
                                >
                                    <div>
                                        <div className="font-medium text-[#1E3A8A]">
                                            {item.expense_type_name || (item.payment_type === 'full' ? 'Full payment' : 'Installment')} · {item.card_name}
                                            {item.payment_type === 'full' && (
                                                <span className="ml-1 text-[11px] text-[#1E3A8A]/50">(1 mo)</span>
                                            )}
                                            {item.user_name && item.user_name !== '—' && (
                                                <span className="ml-1 text-[11px] text-[#1E3A8A]/60">· {item.user_name}</span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[#1E3A8A]/60">
                                            {item.transaction_date}
                                            {item.payment_type === 'installment' && ` · ${item.months} mo × ${item.formatted_monthly}`}
                                            {item.payment_type === 'full' && ` · ${item.formatted_monthly}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        <span className="text-green-700 font-medium" title="Paid so far">
                                            {item.paid_months_count}/{item.months} paid · {item.formatted_total_paid}
                                        </span>
                                        <span className="text-amber-800 font-medium" title="Remaining">
                                            {item.formatted_remaining} left
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="mb-6">
                <div className="rounded-2xl bg-[#F3F4F6] border border-[#1E3A8A]/20 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#1E3A8A]">Payment history</h2>
                        <span className="text-[11px] text-[#1E3A8A]/50">
                            {transactionHistory.length ? `${transactionHistory.length} paid` : 'No data'}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="border-b border-[#1E3A8A]/20 text-[#1E3A8A]/70">
                                    <th className="py-2 pr-3 font-semibold">User</th>
                                    <th className="py-2 pr-3 font-semibold">Amount paid</th>
                                    <th className="py-2 pr-3 font-semibold">Date paid</th>
                                    <th className="py-2 font-semibold">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactionHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-[#1E3A8A]/60 text-center">
                                            Paid expenses and payments will appear here.
                                        </td>
                                    </tr>
                                )}
                                {transactionHistory.map((row) => (
                                    <tr key={row.id} className="border-b border-[#1E3A8A]/10 hover:bg-[#1E3A8A]/5">
                                        <td className="py-2 pr-3 text-[#1E3A8A]">{row.user_name ?? '—'}</td>
                                        <td className="py-2 pr-3 font-medium text-[#2563EB]">{row.formatted_amount_paid}</td>
                                        <td className="py-2 pr-3 text-[#1E3A8A]/80">{row.date_paid ?? row.transaction_date ?? '—'}</td>
                                        <td className="py-2 text-[#1E3A8A]/80">{row.description ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {isAdmin && (
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

