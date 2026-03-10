import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormField } from '../../components/ui/FormField';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { AppDataTable } from '../../components/ui/DataTable';
import { useForm, usePage, router } from '@inertiajs/react';

const PAYMENT_TYPE_FULL = 'full';
const PAYMENT_TYPE_INSTALLMENT = 'installment';

function InstallmentPaidModal({ expense, onClose, onMonthToggled }) {
    const { props } = usePage();
    const csrfToken = props?.csrf_token ?? '';
    const months = expense?.payment_term_months ?? 0;
    const monthRequirements = Array.isArray(expense?.month_requirements) ? expense.month_requirements : [];
    const paidMonths = expense?.paid_months ?? [];
    const monthlyAmortization = expense?.monthly_amortization ?? 0;
    const formattedMonthly = expense?.formatted_monthly ?? '—';

    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState(null);
    const [payModalMonth, setPayModalMonth] = useState(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [unpayConfirmMonth, setUnpayConfirmMonth] = useState(null);

    const reqForMonth = (m) => monthRequirements.find((r) => r.month === m);
    const isPaid = (m) => paidMonths.includes(m);
    const canPayMonth = (m) => m === 1 || isPaid(m - 1);

    const submitPayMonth = async () => {
        if (payModalMonth == null || toggling) return;
        const req = reqForMonth(payModalMonth);
        const minAmount = req?.amount_required ?? monthlyAmortization;
        const val = parseFloat(amountPaid);
        if (Number.isNaN(val) || val < minAmount) {
            setError(`Amount must be at least ${req?.formatted_amount_required ?? formattedMonthly}.`);
            return;
        }
        setToggling(true);
        setError(null);
        try {
            const res = await fetch(`/expenses/${expense.id}/paid-month`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ month: payModalMonth, amount_paid: val }),
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || 'Unable to save. Please try again.');
                return;
            }
            if (onMonthToggled) {
                onMonthToggled(expense.id, {
                    paid_months: data.paid_months,
                    paid_month_amounts: data.paid_month_amounts,
                    month_requirements: data.month_requirements ?? monthRequirements,
                });
            }
            setPayModalMonth(null);
            setAmountPaid('');
        } finally {
            setToggling(false);
        }
    };

    const unpayMonth = async (month) => {
        if (toggling) return;
        setToggling(true);
        setError(null);
        setUnpayConfirmMonth(null);
        try {
            const res = await fetch(`/expenses/${expense.id}/paid-month`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ month }),
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || 'Unable to update.');
                return;
            }
            if (onMonthToggled) {
                onMonthToggled(expense.id, {
                    paid_months: data.paid_months,
                    paid_month_amounts: data.paid_month_amounts ?? {},
                    month_requirements: data.month_requirements ?? monthRequirements,
                });
            }
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#1E3A8A]/80">
                Pay months in order. Amount paid can be higher than the due amount; excess is applied to the next month.
            </p>
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: months }, (_, i) => i + 1).map((m) => {
                    const req = reqForMonth(m);
                    const paid = isPaid(m);
                    const canPay = canPayMonth(m);
                    const amountDue = req?.formatted_amount_required ?? formattedMonthly;
                    const amountPaidStr = req?.formatted_amount_paid;

                    return (
                        <div key={m} className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                disabled={!paid && !canPay}
                                onClick={() => {
                                    if (paid) {
                                        setUnpayConfirmMonth(m);
                                    } else {
                                        setPayModalMonth(m);
                                        setAmountPaid(String(req?.amount_required ?? monthlyAmortization));
                                        setError(null);
                                    }
                                }}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                    paid
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : canPay
                                            ? 'border-[#1E3A8A]/20 bg-[#F3F4F6] text-[#1E3A8A]/70 hover:bg-[#1E3A8A]/5'
                                            : 'border-[#1E3A8A]/10 bg-[#F3F4F6] text-[#1E3A8A]/40 cursor-not-allowed'
                                }`}
                                title={!paid && !canPay ? `Pay month ${m - 1} first` : paid ? `Month ${m}: ${amountPaidStr} paid` : `Pay month ${m}`}
                            >
                                {paid ? (
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <span className="w-4 h-4 rounded-full border-2 border-[#1E3A8A]/30" />
                                )}
                                Month {m}
                            </button>
                            {paid && amountPaidStr && (
                                <span className="text-[10px] text-green-700">{amountPaidStr} paid</span>
                            )}
                            {!paid && canPay && (
                                <span className="text-[10px] text-[#1E3A8A]/60">Due: {amountDue}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {payModalMonth != null && (
                <div className="rounded-lg border border-[#1E3A8A]/30 bg-[#F3F4F6] p-4 space-y-3">
                    <p className="text-xs font-medium text-[#1E3A8A]">Month {payModalMonth} — Enter amount paid</p>
                    <div className="text-xs text-[#1E3A8A]/80">
                        <span className="font-medium">Amount due for this month:</span>{' '}
                        {reqForMonth(payModalMonth)?.formatted_amount_required ?? formattedMonthly}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#1E3A8A] mb-1">Amount paid (cannot be lower than due)</label>
                        <input
                            type="number"
                            step="0.01"
                            min={reqForMonth(payModalMonth)?.amount_required ?? monthlyAmortization}
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="w-full rounded-lg border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => { setPayModalMonth(null); setAmountPaid(''); setError(null); }}
                            className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submitPayMonth}
                            disabled={toggling}
                            className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-60"
                        >
                            {toggling ? 'Saving…' : 'Record payment'}
                        </button>
                    </div>
                </div>
            )}

            {unpayConfirmMonth != null && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-800">Remove payment for month {unpayConfirmMonth}?</span>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => setUnpayConfirmMonth(null)}
                            className="rounded border border-amber-300 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => unpayMonth(unpayConfirmMonth)}
                            disabled={toggling}
                            className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                            Yes, remove
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

function ExpenseForm({ initialData, cardOptions, users, expenseTypes, paymentTerms, onClose, isEdit }) {
    const [paymentType, setPaymentType] = useState(initialData?.payment_type ?? PAYMENT_TYPE_FULL);

    const { data, setData, post, put, processing, errors } = useForm({
        user_id: initialData?.user_id ?? (Array.isArray(users) && users.length ? users[0].id : ''),
        card_id: initialData?.card_id ?? '',
        expense_type_id: initialData?.expense_type_id ?? '',
        amount: initialData?.amount ?? '',
        payment_type: initialData?.payment_type ?? PAYMENT_TYPE_FULL,
        payment_term_id: initialData?.payment_term_id ?? '',
        monthly_amortization: initialData?.monthly_amortization ?? '',
        transaction_date: initialData?.transaction_date ?? new Date().toISOString().slice(0, 10),
    });

    const selectedTerm = useMemo(() => paymentTerms?.find((t) => String(t.id) === String(data.payment_term_id)), [paymentTerms, data.payment_term_id]);
    const computedTotal = paymentType === PAYMENT_TYPE_INSTALLMENT && selectedTerm && data.monthly_amortization
        ? Number(selectedTerm.months) * Number(data.monthly_amortization)
        : null;

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/expenses/${initialData.id}` : '/expenses';
        const method = isEdit ? put : post;
        const payload = { ...data };
        if (payload.expense_type_id === '') payload.expense_type_id = null;
        if (payload.payment_term_id === '') payload.payment_term_id = null;
        if (paymentType === PAYMENT_TYPE_INSTALLMENT) {
            payload.amount = computedTotal ?? 0;
        }
        method(route, {
            data: payload,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const handlePaymentTypeChange = (v) => {
        setPaymentType(v);
        setData('payment_type', v);
        if (v === PAYMENT_TYPE_FULL) {
            setData('payment_term_id', '');
            setData('monthly_amortization', '');
        } else {
            setData('amount', '');
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="User" name="user_id" error={errors.user_id} required>
                <select
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.user_id ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.user_id}
                    onChange={(e) => setData('user_id', e.target.value)}
                >
                    <option value="">Select user</option>
                    {(users ?? []).map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
            </FormField>
            <FormField label="Card" name="card_id" error={errors.card_id} required>
                <select
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.card_id ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.card_id}
                    onChange={(e) => setData('card_id', e.target.value)}
                >
                    <option value="">Select card</option>
                    {(cardOptions ?? []).map((card) => (
                        <option key={card.id} value={card.id}>
                            {card.label}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField label="Type of expense" name="expense_type_id" error={errors.expense_type_id}>
                <select
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.expense_type_id ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.expense_type_id}
                    onChange={(e) => setData('expense_type_id', e.target.value)}
                >
                    <option value="">Select type</option>
                    {(expenseTypes ?? []).map((et) => (
                        <option key={et.id} value={et.id}>{et.name}</option>
                    ))}
                </select>
            </FormField>

            <FormField label="Date" name="transaction_date" error={errors.transaction_date} required>
                <input
                    type="date"
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.transaction_date ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.transaction_date}
                    onChange={(e) => setData('transaction_date', e.target.value)}
                />
            </FormField>

            <div className="space-y-1">
                <label className="block text-xs font-medium text-[#1E3A8A]">Type of payment</label>
                <select
                    className="w-full rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={paymentType}
                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                >
                    <option value={PAYMENT_TYPE_FULL}>Full Payment</option>
                    <option value={PAYMENT_TYPE_INSTALLMENT}>Installment</option>
                </select>
            </div>

            {paymentType === PAYMENT_TYPE_FULL && (
                <FormField label="Amount" name="amount" error={errors.amount} required>
                    <input
                        type="number"
                        step="any"
                        min="0"
                        className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.amount ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                    />
                </FormField>
            )}

            {paymentType === PAYMENT_TYPE_INSTALLMENT && (
                <>
                    <FormField label="No. of terms" name="payment_term_id" error={errors.payment_term_id} required>
                        <select
                            className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.payment_term_id ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                            value={data.payment_term_id}
                            onChange={(e) => setData('payment_term_id', e.target.value)}
                        >
                            <option value="">Select terms</option>
                            {(paymentTerms ?? []).map((pt) => (
                                <option key={pt.id} value={pt.id}>{pt.months} months</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="Monthly amortization" name="monthly_amortization" error={errors.monthly_amortization} required>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.monthly_amortization ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                            value={data.monthly_amortization}
                            onChange={(e) => setData('monthly_amortization', e.target.value)}
                        />
                    </FormField>
                    {computedTotal != null && !Number.isNaN(computedTotal) && (
                        <div className="rounded-lg bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A]">
                            <span className="font-medium">Total (Terms × Monthly amortization): </span>
                            <span className="font-semibold">₱{computedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#F3F4F6]"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60"
                >
                    {isEdit ? 'Save changes' : 'Log entry'}
                </button>
            </div>
        </form>
    );
}

export default function ExpensesIndex() {
    const { props } = usePage();
    const { expenses, cardOptions, users, expenseTypes, paymentTerms } = props;
    const [localExpenses, setLocalExpenses] = useState(expenses ?? []);
    const [modalState, setModalState] = useState({ open: false, expense: null });
    const [paidModalExpense, setPaidModalExpense] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null });
    const [confirmPaid, setConfirmPaid] = useState({ open: false, row: null });

    useEffect(() => {
        setLocalExpenses(expenses ?? []);
    }, [expenses]);

    // Reopen modal when validation fails so user always sees errors
    const openModal = props?.openModal;
    useEffect(() => {
        if (openModal?.context !== 'expenses') return;
        const list = expenses ?? [];
        if (openModal.id != null) {
            const expense = list.find((e) => e.id === openModal.id);
            setModalState({ open: true, expense: expense ?? null });
        } else {
            setModalState({ open: true, expense: null });
        }
    }, [openModal?.context, openModal?.id, expenses]);

    const openCreate = () => setModalState({ open: true, expense: null });
    const openEdit = (expense) => setModalState({ open: true, expense });
    const closeModal = () => setModalState({ open: false, expense: null });

    const handleMonthToggled = (expenseId, payload) => {
        const isObject = payload && typeof payload === 'object' && !Array.isArray(payload);
        const paidMonths = isObject ? payload.paid_months : payload;
        const paidMonthAmounts = isObject ? payload.paid_month_amounts : undefined;
        const monthReqs = isObject ? payload.month_requirements : undefined;
        setLocalExpenses((prev) =>
            prev.map((e) => {
                if (e.id !== expenseId) return e;
                const next = { ...e, paid_months: paidMonths };
                if (paidMonthAmounts != null) next.paid_month_amounts = paidMonthAmounts;
                if (monthReqs != null) next.month_requirements = monthReqs;
                return next;
            })
        );
        setPaidModalExpense((prev) => {
            if (!prev || prev.id !== expenseId) return prev;
            const next = { ...prev, paid_months: paidMonths };
            if (paidMonthAmounts != null) next.paid_month_amounts = paidMonthAmounts;
            if (monthReqs != null) next.month_requirements = monthReqs;
            return next;
        });
    };

    const handleFullPaymentPaidClick = async (row) => {
        const csrfToken = props?.csrf_token ?? '';
        try {
            const res = await fetch(`/expenses/${row.id}/paid-month`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ month: 1 }),
                credentials: 'same-origin',
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.paid_months) {
                handleMonthToggled(row.id, data.paid_months);
            }
        } catch (_) {}
    };

    const columns = [
        { name: 'User', selector: (row) => row.user_name, sortable: true, cell: (row) => row.user_name || '—' },
        { name: 'Card', selector: (row) => row.card_name, sortable: true },
        { name: 'Card No.', selector: (row) => row.card_last_four, sortable: true, cell: (row) => row.card_last_four ? `**** ${row.card_last_four}` : '—' },
        { name: 'Type of expense', selector: (row) => row.expense_type_name, sortable: true, cell: (row) => row.expense_type_name || '—' },
        { name: 'Date', selector: (row) => row.transaction_date, sortable: true },
        {
            name: 'Payment',
            cell: (row) =>
                row.payment_type === 'installment'
                    ? `Installment (${row.payment_term_months ?? '?'} mo)`
                    : 'Full',
        },
        {
            name: 'Paid / Remaining',
            cell: (row) => {
                if (row.payment_type === 'installment') {
                    const total = row.payment_term_months ?? 0;
                    const paid = (row.paid_months ?? []).length;
                    return (
                        <span className="text-[#1E3A8A]/80">
                            {paid}/{total}
                        </span>
                    );
                }
                const paid = (row.paid_months ?? []).length;
                return <span className="text-[#1E3A8A]/80">{paid}/1</span>;
            },
            sortable: true,
            sortFunction: (a, b) => {
                const paidA = (a.paid_months ?? []).length;
                const totalA = a.payment_type === 'installment' ? (a.payment_term_months ?? 0) : 1;
                const paidB = (b.paid_months ?? []).length;
                const totalB = b.payment_type === 'installment' ? (b.payment_term_months ?? 0) : 1;
                const ratioA = totalA ? paidA / totalA : 0;
                const ratioB = totalB ? paidB / totalB : 0;
                return ratioA - ratioB;
            },
        },
        { name: 'Amount', selector: (row) => row.formatted_amount, sortable: true, cell: (row) => (
            <span className="font-medium">
                {row.payment_type === 'installment' && row.formatted_monthly
                    ? `${row.formatted_monthly}/mo`
                    : row.formatted_amount}
            </span>
        ) },
        {
            name: 'Actions',
            cell: (row) => {
                const paidCount = (row.paid_months ?? []).length;
                const totalMonths = row.payment_type === 'installment' ? (row.payment_term_months ?? 0) : 1;
                const isFullyPaid = totalMonths > 0 && paidCount >= totalMonths;

                return (
                    <div className="flex items-center justify-end gap-1">
                        {!isFullyPaid && (
                            <>
                                {row.payment_type === 'installment' ? (
                                    <button
                                        type="button"
                                        onClick={() => setPaidModalExpense(row)}
                                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700"
                                        title="Months paid"
                                        aria-label="View / edit months paid"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmPaid({ open: true, row })}
                                        className={`p-2 rounded-lg hover:bg-green-50 ${
                                            paidCount > 0 ? 'text-green-600' : 'text-[#1E3A8A]/40 hover:text-green-600'
                                        }`}
                                        title="Mark as paid / unpaid"
                                        aria-label="Toggle paid"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => openEdit(row)}
                                    className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]"
                                    title="Edit"
                                    aria-label="Edit entry"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm({ open: true, url: `/expenses/${row.id}` })}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Remove"
                            aria-label="Remove entry"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                );
            },
            ignoreRowClick: true,
            width: '140px',
        },
    ];

    const handleDeleteConfirm = () => {
        if (deleteConfirm.url) {
            router.delete(deleteConfirm.url, { preserveScroll: true });
            setDeleteConfirm({ open: false, url: null });
        }
    };

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-semibold text-[#1E3A8A]">Expenses & payments</h1>
                    <p className="text-sm text-[#1E3A8A]/70 mt-1">
                        Log transactions linked to specific cards for an accurate balance.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center rounded-lg bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]"
                >
                    + Add
                </button>
            </div>

            <AppDataTable columns={columns} data={localExpenses ?? []} searchPlaceholder="Search expenses..." />

            <Modal
                title={modalState.expense ? 'Edit entry' : 'New entry'}
                open={modalState.open}
                onClose={closeModal}
            >
                <ExpenseForm
                    initialData={modalState.expense}
                    cardOptions={cardOptions}
                    users={users}
                    expenseTypes={expenseTypes}
                    paymentTerms={paymentTerms}
                    isEdit={!!modalState.expense}
                    onClose={closeModal}
                />
            </Modal>

            <Modal
                title="Months paid"
                open={!!paidModalExpense}
                onClose={() => setPaidModalExpense(null)}
            >
                {paidModalExpense && (
                    <InstallmentPaidModal
                        expense={paidModalExpense}
                        onClose={() => setPaidModalExpense(null)}
                        onMonthToggled={handleMonthToggled}
                    />
                )}
            </Modal>
            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete entry"
                message="Do you want to delete?"
                confirmLabel="Delete"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ open: false, url: null })}
            />
            <ConfirmModal
                open={confirmPaid.open}
                title="Confirm paid"
                message="Are you sure it's already paid?"
                confirmLabel="Yes, paid"
                confirmClassName="bg-green-600 hover:bg-green-700 text-white"
                onConfirm={() => {
                    if (confirmPaid.row) {
                        handleFullPaymentPaidClick(confirmPaid.row);
                        setConfirmPaid({ open: false, row: null });
                    }
                }}
                onCancel={() => setConfirmPaid({ open: false, row: null })}
            />
        </AppLayout>
    );
}
