import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { AddButton } from '../../components/ui/AddButton';
import { useForm, usePage, router } from '@inertiajs/react';

function CardForm({ initialData, onClose, isEdit, cardTypes = [] }) {
    const { data, setData, post, put, processing, errors } = useForm({
        bank_name: initialData?.bank_name ?? '',
        card_type_id: initialData?.card_type_id ?? '',
        name: initialData?.name ?? '',
        last_four: initialData?.last_four ?? '',
        limit: initialData?.limit ?? '',
        statement_day: initialData?.statement_day ?? '',
        due_day: initialData?.due_day ?? '',
        is_active: initialData?.is_active ?? true,
        color: initialData?.color ?? 'blue',
    });

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/cards/${initialData.id}` : '/cards';
        const method = isEdit ? put : post;
        if (data.card_type_id === '') setData('card_type_id', null);
        method(route, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Bank name</label>
                <input
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.bank_name}
                    onChange={(e) => setData('bank_name', e.target.value)}
                    placeholder="e.g. Chase, BDO"
                />
                {errors.bank_name && <p className="text-xs text-red-600 mt-1">{errors.bank_name}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Type of card</label>
                <select
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.card_type_id}
                    onChange={(e) => setData('card_type_id', e.target.value)}
                >
                    <option value="">Select card type</option>
                    {cardTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                </select>
                {errors.card_type_id && <p className="text-xs text-red-600 mt-1">{errors.card_type_id}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Card name</label>
                <input
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-[#1F2937]">Last 4 digits</label>
                    <input
                        className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A]"
                        value={data.last_four ?? ''}
                        onChange={(e) => setData('last_four', e.target.value)}
                        maxLength={4}
                    />
                    {errors.last_four && <p className="text-xs text-red-600 mt-1">{errors.last_four}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-[#1F2937]">Credit Limit</label>
                    <input
                        type="number"
                        step="any"
                        min="0"
                        className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A]"
                        value={data.limit}
                        onChange={(e) => setData('limit', e.target.value)}
                    />
                    {errors.limit && <p className="text-xs text-red-600 mt-1">{errors.limit}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-[#1F2937]">Statement of account (day)</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A]"
                        value={data.statement_day}
                        onChange={(e) => setData('statement_day', e.target.value)}
                        placeholder="1-31"
                    />
                    {errors.statement_day && <p className="text-xs text-red-600 mt-1">{errors.statement_day}</p>}
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-[#1F2937]">Due date (day)</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A]"
                        value={data.due_day ?? ''}
                        onChange={(e) => setData('due_day', e.target.value)}
                        placeholder="1-31"
                    />
                    {errors.due_day && <p className="text-xs text-red-600 mt-1">{errors.due_day}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Card color</label>
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { value: 'blue', bg: '#2563EB' },
                        { value: 'red', bg: '#dc2626' },
                        { value: 'black', bg: '#1f2937' },
                        { value: 'platinum', bg: '#9ca3af' },
                        { value: 'yellow', bg: '#eab308' },
                        { value: 'green', bg: '#16a34a' },
                    ].map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setData('color', c.value)}
                            className={`w-8 h-8 rounded-full border-2 shrink-0 transition-all ${
                                data.color === c.value ? 'border-[#1E3A8A] scale-110' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.bg }}
                            title={c.value.charAt(0).toUpperCase() + c.value.slice(1)}
                            aria-label={`Color ${c.value}`}
                        />
                    ))}
                </div>
                {errors.color && <p className="text-xs text-red-600 mt-1">{errors.color}</p>}
            </div>

            <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-[#1E3A8A]">
                    <input
                        type="checkbox"
                        className="h-3 w-3 rounded border-[#1E3A8A]/30 text-[#2563EB] focus:ring-[#2563EB]"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                    />
                    Active card
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60"
                    >
                        {isEdit ? 'Save changes' : 'Add card'}
                    </button>
                </div>
            </div>
        </form>
    );
}

function getCurrentStatementMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isSoaMonthAvailable(monthValue, statementDay) {
    if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) return false;
    const [yStr, mStr] = monthValue.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return false;
    const maxDay = new Date(y, m, 0).getDate();
    const sd = Math.max(1, Math.min(Number(statementDay || 1), maxDay));
    const statementDate = new Date(y, m - 1, sd, 23, 59, 59, 999);
    return new Date() >= statementDate;
}

export default function CardsIndex() {
    const { props } = usePage();
    const { cards, cardTypes, viewOnly = false } = props;
    const [modalState, setModalState] = useState({ open: false, card: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null });
    const [activeView, setActiveView] = useState('cards');
    const [selectedCard, setSelectedCard] = useState(null);
    const [statementMonthsList, setStatementMonthsList] = useState([]);
    const [monthTransactions, setMonthTransactions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [loadingMonths, setLoadingMonths] = useState(false);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [payingAll, setPayingAll] = useState(false);
    const [drilldownError, setDrilldownError] = useState('');
    const [soaModal, setSoaModal] = useState({
        open: false,
        card: null,
        months: [],
        loading: false,
        error: '',
    });

    const openModal = props?.openModal;
    useEffect(() => {
        if (openModal?.context !== 'cards') return;
        const list = cards ?? [];
        if (openModal.id != null) {
            const card = list.find((c) => c.id === openModal.id);
            setModalState({ open: true, card: card ?? null });
        } else {
            setModalState({ open: true, card: null });
        }
    }, [openModal?.context, openModal?.id, cards]);

    useEffect(() => {
        if (activeView !== 'months' || !selectedCard?.id) return;
        setLoadingMonths(true);
        setDrilldownError('');
        window.axios
            .get(`/cards/${selectedCard.id}/statement-months`, {
                headers: { Accept: 'application/json' },
            })
            .then(({ data }) => {
                if (data?.error) {
                    setDrilldownError(`Failed to load monthly installments: ${data.error}`);
                }
                setStatementMonthsList(data.statement_months ?? []);
            })
            .catch((error) => {
                if ([401, 403].includes(error?.response?.status)) {
                    setDrilldownError('Unauthorized access.');
                    return;
                }
                const backendError = error?.response?.data?.error || error?.message;
                setDrilldownError(backendError ? `Failed to load monthly installments: ${backendError}` : 'Failed to load monthly installments.');
            })
            .finally(() => setLoadingMonths(false));
    }, [activeView, selectedCard?.id]);

    useEffect(() => {
        if (activeView !== 'transactions' || !selectedCard?.id || !selectedMonth) return;
        setLoadingTransactions(true);
        setDrilldownError('');
        window.axios
            .get(`/cards/${selectedCard.id}/transactions`, {
                params: { month: selectedMonth },
                headers: { Accept: 'application/json' },
            })
            .then(({ data }) => setMonthTransactions(data.transactions ?? []))
            .catch((error) => {
                if ([401, 403].includes(error?.response?.status)) {
                    setDrilldownError('Unauthorized access.');
                    return;
                }
                setDrilldownError('Failed to load transactions for this month.');
            })
            .finally(() => setLoadingTransactions(false));
    }, [activeView, selectedCard?.id, selectedMonth]);

    // Keep months/transactions fresh when users pay from other pages (e.g. Expenses table).
    useEffect(() => {
        if (!selectedCard?.id) return;

        if (activeView === 'months') {
            const timer = window.setInterval(() => {
                window.axios
                    .get(`/cards/${selectedCard.id}/statement-months`, {
                        headers: { Accept: 'application/json' },
                    })
                    .then(({ data }) => setStatementMonthsList(data.statement_months ?? []))
                    .catch(() => {});
            }, 5000);

            return () => window.clearInterval(timer);
        }

        if (activeView === 'transactions' && selectedMonth) {
            const timer = window.setInterval(() => {
                window.axios
                    .get(`/cards/${selectedCard.id}/transactions`, {
                        params: { month: selectedMonth },
                        headers: { Accept: 'application/json' },
                    })
                    .then(({ data }) => setMonthTransactions(data.transactions ?? []))
                    .catch(() => {});
            }, 5000);

            return () => window.clearInterval(timer);
        }
    }, [activeView, selectedCard?.id, selectedMonth]);

    const getCardGradient = (card) => {
        const map = {
            blue: 'from-[#1E3A8A] via-[#1E3A8A] to-[#2563EB]',
            red: 'from-red-800 via-red-700 to-red-600',
            black: 'from-gray-900 via-gray-800 to-gray-700',
            platinum: 'from-gray-400 via-gray-300 to-gray-200',
            yellow: 'from-amber-500 via-amber-400 to-yellow-500',
            green: 'from-emerald-800 via-emerald-700 to-green-600',
        };
        return map[card.color] || map.blue;
    };

    const getCardTextClass = (color) => (color === 'platinum' ? 'text-gray-900' : 'text-[#F3F4F6]');

    const openCreate = () => setModalState({ open: true, card: null });
    const openEdit = (card, e) => {
        e?.stopPropagation?.();
        setModalState({ open: true, card });
    };
    const closeModal = () => setModalState({ open: false, card: null });
    const openViewModal = (card) => openCardMonths(card);
    const openCardMonths = (card) => {
        setSelectedCard(card);
        setSelectedMonth(null);
        setMonthTransactions([]);
        setActiveView('months');
    };
    const openMonthTransactions = (month) => {
        setSelectedMonth(month);
        setActiveView('transactions');
    };
    const statementUrl = (cardId, month) => `/cards/${cardId}/statement?month=${month || getCurrentStatementMonth()}`;
    const openSoaMonthList = async (card, e) => {
        e?.stopPropagation?.();
        setSoaModal({ open: true, card, months: [], loading: true, error: '' });
        try {
            const { data } = await window.axios.get(`/cards/${card.id}/statement-months`, {
                headers: { Accept: 'application/json' },
            });
            setSoaModal((prev) => ({
                ...prev,
                months: data?.statement_months ?? [],
                loading: false,
                error: data?.error ?? '',
            }));
        } catch (error) {
            const message = error?.response?.data?.error || 'Failed to load statement months.';
            setSoaModal((prev) => ({ ...prev, loading: false, error: message }));
        }
    };
    const openStatementPdfForMonth = (card, monthValue) => {
        if (!card?.id || !monthValue) return;
        const url = `/cards/${card.id}/statement-pdf?month=${encodeURIComponent(monthValue)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    const selectedMonthTotal = monthTransactions.reduce((sum, tx) => sum + Number(tx?.amount ?? 0), 0);
    const selectedMonthTotalFormatted = `₱${selectedMonthTotal.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
    const firstPendingMonthValue = [...statementMonthsList]
        .sort((a, b) => String(a?.value ?? '').localeCompare(String(b?.value ?? '')))
        .find((m) => Number(m?.total_due ?? 0) > 0)?.value ?? null;
    const isSelectedMonthPayLocked = Boolean(
        firstPendingMonthValue &&
        selectedMonth &&
        String(selectedMonth) !== String(firstPendingMonthValue) &&
        Number(selectedMonthTotal) > 0,
    );
    const availableSoaMonths = soaModal.months.filter((m) => isSoaMonthAvailable(m?.value, soaModal.card?.statement_day));

    const refreshCardMonthData = () => {
        if (!selectedCard?.id || !selectedMonth) return Promise.resolve();
        const reqTransactions = window.axios.get(`/cards/${selectedCard.id}/transactions`, {
            params: { month: selectedMonth },
            headers: { Accept: 'application/json' },
        });
        const reqMonths = window.axios.get(`/cards/${selectedCard.id}/statement-months`, {
            headers: { Accept: 'application/json' },
        });

        return Promise.all([reqTransactions, reqMonths]).then(([txRes, monthsRes]) => {
            setMonthTransactions(txRes?.data?.transactions ?? []);
            setStatementMonthsList(monthsRes?.data?.statement_months ?? []);
        });
    };

    const unpaidMonthItems = monthTransactions.filter(
        (tx) => Number(tx?.amount ?? 0) > 0 && tx?.expense_id && tx?.month_number,
    );

    const payAllForSelectedMonth = async () => {
        if (unpaidMonthItems.length === 0 || payingAll) return;
        setPayingAll(true);
        setDrilldownError('');
        try {
            for (const tx of unpaidMonthItems) {
                const payload = { month: Number(tx.month_number) };
                if ((tx?.type ?? '') === 'installment') {
                    payload.amount_paid = Number(tx.amount ?? 0);
                }
                await window.axios.post(`/expenses/${tx.expense_id}/paid-month`, payload, {
                    headers: { Accept: 'application/json' },
                });
            }
            await refreshCardMonthData();
        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to pay all month items.';
            setDrilldownError(message);
        } finally {
            setPayingAll(false);
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-lg font-semibold text-[#1E3A8A]">
                            {viewOnly ? 'Transactions & statements' : 'Manage Credit Cards'}
                        </h1>
                        {!viewOnly && (
                        <AddButton onClick={openCreate} ariaLabel="New card" className="shrink-0">Add card</AddButton>
                        )}
                    </div>
                    <p className="text-sm text-[#1E3A8A]/70 mt-1">
                        {viewOnly ? 'View transactions and download statements for your cards.' : 'Track multiple credit cards and limits.'}
                    </p>
                </div>
            </div>

            {viewOnly ? (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#F3F4F6] overflow-hidden">
                    {cards.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[#1E3A8A]/60">
                            No cards linked to your account.
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#1E3A8A]/10">
                            {cards.map((card) => (
                                <li key={card.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#1E3A8A]/5 cursor-pointer" onClick={() => openCardMonths(card)}>
                                    <div>
                                        <span className="font-medium text-[#1E3A8A]">{card.name}</span>
                                        {card.last_four && (
                                            <span className="ml-2 text-xs text-[#1E3A8A]/60">•••• {card.last_four}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); openCardMonths(card); }}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563EB] bg-[#2563EB]/10 px-3 py-1.5 text-xs font-medium text-[#2563EB] hover:bg-[#2563EB]/20"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View obligations
                                        </button>
                                        <a
                                            href={statementUrl(card.id, getCurrentStatementMonth())}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E3A8A]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Statement
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : cards.length === 0 ? (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#E5E7EB] border-dashed p-12 text-center">
                    <p className="text-sm text-[#1E3A8A]/60">No cards yet.</p>
                    <p className="text-sm text-[#1E3A8A]/50 mt-1">Add your first credit card to get started.</p>
                    <AddButton onClick={openCreate} ariaLabel="New card" className="mt-4">+ New card</AddButton>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="group relative flex flex-col rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                            onClick={() => openCardMonths(card)}
                        >
                            {/* Credit card front */}
                            <div
                                className={[
                                    'relative rounded-2xl min-h-[180px] p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-br',
                                    getCardGradient(card),
                                    !card.is_active && 'opacity-90',
                                ].join(' ')}
                            >
                                {/* Decorative circles */}
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 ${card.color === 'platinum' ? 'bg-gray-900/10' : 'bg-[#F3F4F6]/10'}`} />
                                <div className={`absolute bottom-0 left-0 w-16 h-16 rounded-full -translate-x-1/2 translate-y-1/2 ${card.color === 'platinum' ? 'bg-gray-900/5' : 'bg-[#F3F4F6]/5'}`} />
                                {/* Chip */}
                                <div className={`absolute top-4 right-4 w-10 h-8 rounded-md border ${card.color === 'platinum' ? 'bg-gray-900/20 border-gray-900/30' : 'bg-gradient-to-br from-[#F3F4F6]/30 to-[#F3F4F6]/10 border-[#F3F4F6]/20'}`} style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }} />
                                <div className={`relative ${getCardTextClass(card.color)}`}>
                                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-3">Credit Card</p>
                                    <p className={`font-mono text-lg font-semibold tracking-widest ${getCardTextClass(card.color)}`}>
                                        •••• •••• •••• {card.last_four || '····'}
                                    </p>
                                </div>
                                <div className={`relative flex items-end justify-between gap-2 mt-4 ${getCardTextClass(card.color)}`}>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider opacity-70">Cardholder</p>
                                        <p className="text-sm font-medium truncate">{card.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-wider opacity-70">Limit</p>
                                        <p className="text-sm font-semibold">{card.formatted_limit}</p>
                                    </div>
                                </div>
                                <div className={`relative mt-2 flex gap-3 text-[10px] opacity-80 ${getCardTextClass(card.color)}`}>
                                    {card.bank_name && <span>{card.bank_name}</span>}
                                    {card.card_type_name && <span>{card.card_type_name}</span>}
                                    {card.statement_day != null && <span>Statement day {card.statement_day}</span>}
                                    {card.due_day && <span>Due {card.due_day}</span>}
                                    {card.expenses_count != null && <span>{card.expenses_count} entries</span>}
                                </div>
                            </div>
                            {/* Actions bar below card */}
                            <div className="mt-2 flex items-center justify-between rounded-lg bg-white border border-[#1E3A8A]/10 px-3 py-2">
                                <span
                                    className={[
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                                        card.is_active
                                            ? 'bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/40'
                                            : 'bg-[#1E3A8A]/10 text-[#1E3A8A]/70 border border-[#1E3A8A]/20',
                                    ].join(' ')}
                                >
                                    <span className={['mr-1 h-1.5 w-1.5 rounded-full', card.is_active ? 'bg-[#2563EB]' : 'bg-[#1E3A8A]/40'].join(' ')} />
                                    {card.is_active ? 'Active' : 'Archived'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openViewModal(card)}
                                        className="p-2 rounded-lg text-[#1E3A8A]/70 hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A]"
                                        title="View transactions"
                                        aria-label="View transactions"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => openSoaMonthList(card, e)}
                                        className="p-2 rounded-lg text-[#1E3A8A] hover:bg-[#1E3A8A]/10 hover:text-[#2563EB]"
                                        title="Generate monthly SOA"
                                        aria-label="Generate monthly SOA"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3v6h6M9 13h6M9 17h6" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => openEdit(card, e)}
                                        className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]"
                                        title="Edit"
                                        aria-label="Edit card"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, url: `/cards/${card.id}` }); }}
                                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                        title="Remove"
                                        aria-label="Remove card"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                title={
                    activeView === 'cards'
                        ? 'Card obligations'
                        : activeView === 'months'
                            ? `${selectedCard?.name ?? 'Card'} — Monthly Installments`
                            : `${selectedCard?.name ?? 'Card'} — ${selectedMonth ?? ''} Transactions`
                }
                open={activeView !== 'cards'}
                onClose={() => {
                    setActiveView('cards');
                    setSelectedCard(null);
                    setSelectedMonth(null);
                    setMonthTransactions([]);
                }}
            >
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {drilldownError && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{drilldownError}</div>}
                    {activeView === 'months' && (
                        <>
                            <button type="button" onClick={() => setActiveView('cards')} className="text-xs text-[#2563EB] hover:text-[#1E3A8A]">← Back to cards</button>
                            {loadingMonths ? (
                                <p className="text-xs text-[#1E3A8A]/70">Loading monthly installments...</p>
                            ) : statementMonthsList.length === 0 ? (
                                <p className="text-xs text-[#1E3A8A]/70">No monthly obligations found.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {statementMonthsList.map((opt) => (
                                        <li key={opt.value} className="flex items-center justify-between rounded border border-[#1E3A8A]/15 bg-white px-3 py-2">
                                            <span className="text-xs text-[#1E3A8A]">
                                                {opt.label} - ₱{Number(opt.total_due ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <button type="button" onClick={() => openMonthTransactions(opt.value)} className="text-xs text-[#2563EB] hover:text-[#1E3A8A]">View items</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}

                    {activeView === 'transactions' && (
                        <>
                            <button type="button" onClick={() => setActiveView('months')} className="text-xs text-[#2563EB] hover:text-[#1E3A8A]">← Back to months</button>
                            {loadingTransactions ? (
                                <p className="text-xs text-[#1E3A8A]/70">Loading transactions...</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-[#1E3A8A]/15 text-left text-[#1E3A8A]/70">
                                                <th className="py-2 pr-2">Date</th>
                                                <th className="py-2 pr-2">Description</th>
                                                <th className="py-2 pr-2">Type</th>
                                                <th className="py-2">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthTransactions.map((tx) => (
                                                <tr key={tx.id} className="border-b border-[#1E3A8A]/10">
                                                    <td className="py-2 pr-2 text-[#1E3A8A]/80">{tx.transaction_date ?? '—'}</td>
                                                    <td className="py-2 pr-2 text-[#1E3A8A]">{tx.description ?? tx.expense_type_name ?? '—'}</td>
                                                    <td className="py-2 pr-2 text-[#1E3A8A]/70">{tx.type}</td>
                                                    <td className="py-2 text-[#2563EB] font-medium">{tx.formatted_amount}</td>
                                                </tr>
                                            ))}
                                            {monthTransactions.length === 0 && (
                                                <tr><td className="py-3 text-[#1E3A8A]/70" colSpan={4}>No items for this month.</td></tr>
                                            )}
                                        </tbody>
                                        {monthTransactions.length > 0 && (
                                            <tfoot>
                                                <tr className="border-t-2 border-[#1E3A8A]/20 bg-[#F3F4F6]">
                                                    <td className="py-2 pr-2" colSpan={3}>
                                                        <span className="font-semibold text-[#1E3A8A]">Total</span>
                                                    </td>
                                                    <td className="py-2">
                                                        <button
                                                            type="button"
                                                            onClick={payAllForSelectedMonth}
                                                            disabled={unpaidMonthItems.length === 0 || payingAll || isSelectedMonthPayLocked}
                                                            className="rounded-md bg-[#2563EB] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1E3A8A] disabled:opacity-60"
                                                            title={
                                                                isSelectedMonthPayLocked
                                                                    ? `Pay ${firstPendingMonthValue} first`
                                                                    : `Pay all for ${selectedMonth ?? 'selected month'}: ${selectedMonthTotalFormatted}`
                                                            }
                                                        >
                                                            {isSelectedMonthPayLocked
                                                                ? `Pay ${firstPendingMonthValue} first`
                                                                : (payingAll ? `Paying ${selectedMonthTotalFormatted}...` : `Pay ${selectedMonthTotalFormatted}`)}
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>

            <Modal
                title={modalState.card ? 'Edit card' : 'New card'}
                open={modalState.open}
                onClose={closeModal}
            >
                <CardForm initialData={modalState.card} isEdit={!!modalState.card} onClose={closeModal} cardTypes={cardTypes ?? []} />
            </Modal>
            <Modal
                title={soaModal.card ? `${soaModal.card.name ?? 'Card'} — Monthly SOA` : 'Monthly SOA'}
                open={soaModal.open}
                onClose={() => setSoaModal({ open: false, card: null, months: [], loading: false, error: '' })}
            >
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {soaModal.error && (
                        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {soaModal.error}
                        </div>
                    )}
                    {soaModal.loading ? (
                        <p className="text-xs text-[#1E3A8A]/70">Loading monthly SOA list...</p>
                    ) : soaModal.months.length === 0 ? (
                        <p className="text-xs text-[#1E3A8A]/70">SOA is not yet available. It will be generated on statement date.</p>
                    ) : availableSoaMonths.length === 0 ? (
                        <p className="text-xs text-[#1E3A8A]/70">SOA is not yet available. It will be generated on statement date.</p>
                    ) : (
                        <div className="grid gap-2">
                            {availableSoaMonths.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => openStatementPdfForMonth(soaModal.card, m.value)}
                                    className="inline-flex items-center rounded-lg border border-[#1E3A8A]/15 bg-white px-3 py-2 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3v6h6M9 13h6M9 17h6" />
                                        </svg>
                                        {m.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete card"
                message="Do you want to delete?"
                confirmLabel="Delete"
                onConfirm={() => {
                    if (deleteConfirm.url) {
                        router.delete(deleteConfirm.url, { preserveScroll: true });
                        setDeleteConfirm({ open: false, url: null });
                    }
                }}
                onCancel={() => setDeleteConfirm({ open: false, url: null })}
            />
        </AppLayout>
    );
}

