import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormField } from '../../components/ui/FormField';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { AppDataTable } from '../../components/ui/DataTable';
import { AddButton } from '../../components/ui/AddButton';
import { useForm, usePage, router } from '@inertiajs/react';

const PAYMENT_TYPE_FULL = 'full';
const PAYMENT_TYPE_INSTALLMENT = 'installment';

function InstallmentPaidModal({ expense, onClose, onMonthToggled, initialMonth = null }) {
    const { props } = usePage();
    const csrfToken = props?.csrf_token ?? '';
    const months = expense?.payment_term_months ?? 0;
    const monthRequirements = Array.isArray(expense?.month_requirements) ? expense.month_requirements : [];
    const paidMonths = expense?.paid_months ?? [];
    const monthlyAmortization = expense?.monthly_amortization ?? 0;
    const formattedMonthly = expense?.formatted_monthly ?? '—';

    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [payModalMonth, setPayModalMonth] = useState(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [unpayConfirmMonth, setUnpayConfirmMonth] = useState(null);

    const reqForMonth = (m) => monthRequirements.find((r) => Number(r.month) === Number(m));
    const isCoveredByCredit = (m) => !!reqForMonth(m)?.is_covered_by_credit;
    const isPaid = (m) => paidMonths.includes(m) || isCoveredByCredit(m);
    const hasUserPayment = (m) => paidMonths.includes(m);
    const canPayMonth = (m) => m === 1 || isPaid(m - 1);

    const amountRequiredForMonth = (m) => {
        const req = reqForMonth(m);
        if (req == null) return monthlyAmortization;
        const a = req.amount_required;
        if (typeof a === 'number' && !Number.isNaN(a)) return a;
        if (typeof a === 'string') return parseFloat(a) || monthlyAmortization;
        return monthlyAmortization;
    };

    const formattedAmountRequiredForMonth = (m) => {
        const req = reqForMonth(m);
        if (req?.formatted_amount_required != null) return req.formatted_amount_required;
        return formattedMonthly;
    };

    const isExtraPayment = payModalMonth != null && payModalMonth > months;

    useEffect(() => {
        if (!initialMonth || !expense) return;
        const m = Number(initialMonth);
        if (!Number.isFinite(m) || m < 1 || m > months) return;
        if (isPaid(m)) return;
        if (!canPayMonth(m)) return;
        setPayModalMonth(m);
        setAmountPaid(String(amountRequiredForMonth(m)));
        setError(null);
    }, [initialMonth, expense?.id]);
    const submitPayMonth = async () => {
        if (payModalMonth == null || toggling) return;
        const minAmount = isExtraPayment ? 0 : amountRequiredForMonth(payModalMonth);
        const val = parseFloat(amountPaid);
        if (Number.isNaN(val) || val < minAmount) {
            setError(isExtraPayment ? 'Enter an amount.' : `Amount must be at least ${formattedAmountRequiredForMonth(payModalMonth)}.`);
            return;
        }
        setToggling(true);
        setError(null);
        setSuccess(null);
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
                onMonthToggled(expense.id, data);
            }
            setSuccess(data.message || 'Payment recorded successfully.');
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
        setSuccess(null);
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
                onMonthToggled(expense.id, data);
            }
            setSuccess(data.message || 'Payment updated successfully.');
        } finally {
            setToggling(false);
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-xs text-[#1E3A8A]/80">
                Pay months in order. Overpayment in one month carries forward (waterfall) to the next; months fully covered by credit are auto-marked as paid. No need to pay $0.
            </p>
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    {success}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: months }, (_, i) => i + 1).map((m) => {
                    const req = reqForMonth(m);
                    const paid = isPaid(m);
                    const coveredOnly = isCoveredByCredit(m) && !hasUserPayment(m);
                    const canPay = canPayMonth(m);
                    const amountDue = formattedAmountRequiredForMonth(m);
                    const amountPaidStr = req?.formatted_amount_paid;
                    const canUnpay = paid && hasUserPayment(m);

                    return (
                        <div key={m} className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                disabled={!paid && !canPay}
                                onClick={() => {
                                    if (canUnpay) {
                                        setUnpayConfirmMonth(m);
                                    } else if (canPay && !paid) {
                                        setPayModalMonth(m);
                                        setAmountPaid(String(amountRequiredForMonth(m)));
                                        setError(null);
                                    }
                                }}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                    paid
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : canPay
                                            ? 'border-[#1E3A8A]/20 bg-[#F3F4F6] text-[#1E3A8A]/70 hover:bg-[#1E3A8A]/5'
                                            : 'border-[#1E3A8A]/10 bg-[#F3F4F6] text-[#1E3A8A]/40 cursor-not-allowed'
                                } ${coveredOnly ? 'cursor-default' : ''}`}
                                title={
                                    coveredOnly
                                        ? `Month ${m}: covered by prior credit (no payment needed)`
                                        : !paid && !canPay
                                            ? `Pay month ${m - 1} first`
                                            : paid
                                                ? `Month ${m}: ${amountPaidStr}`
                                                : `Pay month ${m}`
                                }
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
                                <span className="text-[10px] text-green-700">{amountPaidStr}</span>
                            )}
                            {!paid && canPay && (
                                <span className="text-[10px] text-[#1E3A8A]/60">Due: {amountDue}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {months > 0 && paidMonths.length >= months && (expense?.remaining ?? 0) < 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setPayModalMonth(months + 1);
                            setAmountPaid('0');
                            setError(null);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                        title="Record an extra payment (balance will show as credit)"
                    >
                        Record extra payment (credit)
                    </button>
                </div>
            )}

            {payModalMonth != null && (
                <div className="rounded-lg border border-[#1E3A8A]/30 bg-[#F3F4F6] p-4 space-y-3">
                    <p className="text-xs font-medium text-[#1E3A8A]">
                        {isExtraPayment ? 'Extra Payment' : `Month ${payModalMonth} — Payment`}
                    </p>
                    {!isExtraPayment && (
                        <div className="text-xs text-[#1E3A8A]/80">
                            <span className="font-medium">Amount due for this month:</span>{' '}
                            {formattedAmountRequiredForMonth(payModalMonth)}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-[#1E3A8A] mb-1">
                            {isExtraPayment ? 'Amount paid (optional; creates credit if overpaid)' : 'Amount paid (exact amount due)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min={isExtraPayment ? 0 : amountRequiredForMonth(payModalMonth)}
                            max={isExtraPayment ? undefined : amountRequiredForMonth(payModalMonth)}
                            value={amountPaid}
                            onChange={(e) => {
                                if (!isExtraPayment) return;
                                setAmountPaid(e.target.value);
                            }}
                            readOnly={!isExtraPayment}
                            className="w-full rounded-lg border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                        {!isExtraPayment && (
                            <p className="mt-1 text-[11px] text-[#1E3A8A]/70">
                                Monthly installment payment is fixed and cannot be edited.
                            </p>
                        )}
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

function ExpenseForm({ initialData, cardOptions, users, expenseTypes, paymentTerms, onClose, isEdit, isAdmin = true }) {
    const [paymentType, setPaymentType] = useState(initialData?.payment_type ?? PAYMENT_TYPE_FULL);

    const { data, setData, post, put, processing, errors } = useForm({
        user_id: initialData?.user_id ?? (Array.isArray(users) && users.length ? users[0].id : ''),
        card_id: initialData?.card_id ?? '',
        expense_type_id: initialData?.expense_type_id ?? '',
        description: initialData?.description ?? '',
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
            {isAdmin && (
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
            )}
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

            <FormField label="Description" name="description" error={errors.description}>
                <input
                    type="text"
                    placeholder="e.g. Merchant, notes, etc."
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.description ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                />
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
    const { expenses, cardOptions, users, expenseTypes, paymentTerms, isAdmin = true } = props;
    const authUserId = props?.auth?.user?.id ?? null;
    const [localExpenses, setLocalExpenses] = useState(expenses ?? []);
    const [modalState, setModalState] = useState({ open: false, expense: null });
    const [paidModalExpense, setPaidModalExpense] = useState(null);
    const [paidModalInitialMonth, setPaidModalInitialMonth] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null });
    const [confirmPaid, setConfirmPaid] = useState({ open: false, row: null });

    useEffect(() => {
        setLocalExpenses(expenses ?? []);
    }, [expenses]);

    // When client view: refetch expenses on window focus and periodically so admin payment updates appear
    useEffect(() => {
        if (isAdmin) return;
        const onFocus = () => router.reload({ only: ['expenses', 'pagination'] });
        window.addEventListener('focus', onFocus);
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                router.reload({ only: ['expenses', 'pagination'] });
            }
        }, 45000);
        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(interval);
        };
    }, [isAdmin]);

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

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const expenseParam = params.get('expense');
        const monthParam = params.get('month');
        if (!expenseParam) return;
        const targetId = Number(expenseParam);
        if (!Number.isFinite(targetId)) return;
        const target = (expenses ?? []).find((e) => Number(e.id) === targetId);
        if (!target) return;
        if (target.payment_type !== 'installment') return;

        setPaidModalExpense(target);
        const monthNum = monthParam ? Number(monthParam) : null;
        setPaidModalInitialMonth(Number.isFinite(monthNum) ? monthNum : null);

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
    }, [expenses]);

    const openCreate = () => setModalState({ open: true, expense: null });
    const openEdit = (expense) => setModalState({ open: true, expense });
    const closeModal = () => setModalState({ open: false, expense: null });

    const handleMonthToggled = (expenseId, payload) => {
        const isObject = payload && typeof payload === 'object' && !Array.isArray(payload);
        const paidMonths = isObject ? payload.paid_months : payload;
        const paidMonthAmounts = isObject ? payload.paid_month_amounts : undefined;
        const monthReqs = isObject ? payload.month_requirements : undefined;
        const remaining = isObject && (payload.remaining !== undefined && payload.remaining !== null) ? Number(payload.remaining) : undefined;
        const formattedRemaining = isObject && payload.formatted_remaining != null ? payload.formatted_remaining : undefined;
        const totalPaid = isObject && (payload.total_paid !== undefined && payload.total_paid !== null) ? Number(payload.total_paid) : undefined;
        const formattedTotalPaid = isObject && payload.formatted_total_paid != null ? payload.formatted_total_paid : undefined;
        const idNum = Number(expenseId);
        setLocalExpenses((prev) =>
            prev.map((e) => {
                if (Number(e.id) !== idNum) return e;
                const next = { ...e, paid_months: paidMonths };
                if (paidMonthAmounts != null) next.paid_month_amounts = paidMonthAmounts;
                if (monthReqs != null) next.month_requirements = monthReqs;
                if (remaining !== undefined) next.remaining = remaining;
                if (formattedRemaining !== undefined) next.formatted_remaining = formattedRemaining;
                if (totalPaid !== undefined) next.total_paid = totalPaid;
                if (formattedTotalPaid !== undefined) next.formatted_total_paid = formattedTotalPaid;
                return next;
            })
        );
        setPaidModalExpense((prev) => {
            if (!prev || Number(prev.id) !== idNum) return prev;
            const next = { ...prev, paid_months: paidMonths };
            if (paidMonthAmounts != null) next.paid_month_amounts = paidMonthAmounts;
            if (monthReqs != null) next.month_requirements = monthReqs;
            if (remaining !== undefined) next.remaining = remaining;
            if (formattedRemaining !== undefined) next.formatted_remaining = formattedRemaining;
            if (totalPaid !== undefined) next.total_paid = totalPaid;
            if (formattedTotalPaid !== undefined) next.formatted_total_paid = formattedTotalPaid;
            return next;
        });
    };

    const effectivePaidCount = (row) => {
        const reqs = row.month_requirements ?? [];
        if (row.payment_type !== 'installment' || reqs.length === 0) {
            return (row.paid_months ?? []).length;
        }
        return reqs.filter((r) => r.amount_paid != null || r.is_covered_by_credit).length;
    };

    const effectiveTotalPaidForRow = (row) => {
        if (row.total_paid != null && typeof row.total_paid === 'number' && !Number.isNaN(row.total_paid)) return row.total_paid;
        if (row.payment_type === 'installment' && Array.isArray(row.month_requirements) && row.month_requirements.length > 0) {
            const sumFromReqs = row.month_requirements.reduce((sum, r) => {
                if (r.effective_paid != null && !Number.isNaN(Number(r.effective_paid))) return sum + Number(r.effective_paid);
                if (r.amount_paid != null) return sum + Number(r.amount_paid);
                if (r.is_covered_by_credit) return sum + (Number(row.monthly_amortization) || 0);
                return sum;
            }, 0);
            return Math.round(sumFromReqs * 100) / 100;
        }
        const amt = Number(row.amount) || 0;
        const paid = (row.paid_months ?? []).length > 0 ? 1 : 0;
        return row.payment_type === 'full' && paid ? amt : 0;
    };

    const remainingForRow = (row) => {
        if (row.remaining !== undefined && row.remaining !== null && !Number.isNaN(Number(row.remaining))) return Number(row.remaining);
        if (row.payment_type === 'installment' && Array.isArray(row.month_requirements) && row.month_requirements.length > 0) {
            return round2(row.month_requirements.reduce((sum, r) => sum + Number(r.balance ?? 0), 0));
        }
        return row.remaining != null ? Number(row.remaining) : 0;
    };

    const round2 = (n) => Math.round(Number(n) * 100) / 100;

    const isFullyPaidRow = (row) => Math.abs(remainingForRow(row)) < 0.01;

    const tableTotals = useMemo(() => {
        const rows = localExpenses ?? [];
        let totalAmountPaid = 0;
        let totalOutstanding = 0;
        let totalToPay = 0;
        rows.forEach((row) => {
            totalAmountPaid += effectiveTotalPaidForRow(row);
            totalOutstanding += remainingForRow(row);
            totalToPay += Number(row.amount ?? 0);
        });
        return { totalAmountPaid, totalOutstanding, totalToPay };
    }, [localExpenses]);

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
                handleMonthToggled(row.id, data);
            }
        } catch (_) {}
    };

    const columns = [
        ...(isAdmin ? [{ name: 'User', selector: (row) => row.user_name, sortable: true, cell: (row) => row.user_name || '—' }] : []),
        { name: isAdmin ? 'Card No.' : 'Card name', selector: (row) => row.card_name ?? row.card_last_four, sortable: true, cell: (row) => row.card_name || (row.card_last_four ? `**** ${row.card_last_four}` : '—') },
        { name: 'Type of expense', selector: (row) => row.expense_type_name, sortable: true, cell: (row) => row.expense_type_name || '—' },
        { name: 'Description', selector: (row) => row.description, sortable: true, cell: (row) => <span className="text-[#1E3A8A]/80">{(row.description || '—').toString().trim() || '—'}</span> },
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
                    const paid = effectivePaidCount(row);
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
                const paidA = effectivePaidCount(a);
                const totalA = a.payment_type === 'installment' ? (a.payment_term_months ?? 0) : 1;
                const paidB = effectivePaidCount(b);
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
            name: 'Total paid',
            selector: (row) => effectiveTotalPaidForRow(row),
            sortable: true,
            cell: (row) => {
                const total = effectiveTotalPaidForRow(row);
                const formatted = row.formatted_total_paid ?? `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                return <span className="font-medium text-green-700">{formatted}</span>;
            },
        },
        {
            name: 'Balance',
            selector: (row) => remainingForRow(row),
            sortable: true,
            cell: (row) => {
                const rem = remainingForRow(row);
                const formatted = row.formatted_remaining ?? `₱${rem.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                if (rem < 0) {
                    return <span className="text-emerald-600 font-medium" title="Credit (overpaid)">{formatted} (credit)</span>;
                }
                return <span className="text-[#1E3A8A]/80">{formatted}</span>;
            },
        },
        {
            name: 'Total to pay',
            selector: (row) => row.amount ?? 0,
            sortable: true,
            cell: (row) => {
                const total = row.amount != null ? Number(row.amount) : 0;
                const formatted = row.formatted_amount ?? `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                return <span className="font-medium text-[#1E3A8A]">{formatted}</span>;
            },
        },
        {
            name: 'Actions',
            cell: (row) => {
                const canManage = isAdmin || (row.user_id === authUserId && (row.created_by == null || row.created_by === authUserId));
                if (!canManage) {
                    return <span className="text-[#1E3A8A]/40 text-xs">—</span>;
                }
                const isFullyPaid = isFullyPaidRow(row);
                const isInstallment = row.payment_type === 'installment';
                const showPaidButton = !isFullyPaid;
                const showEditButton = !isFullyPaid;

                return (
                    <div className="flex items-center justify-end gap-1">
                        {showPaidButton && (
                            isInstallment ? (
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
                                        (row.paid_months ?? []).length > 0 ? 'text-green-600' : 'text-[#1E3A8A]/40 hover:text-green-600'
                                    }`}
                                    title="Mark as paid / unpaid"
                                    aria-label="Toggle paid"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            )
                        )}
                        {showEditButton && (
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
            <div className="mb-4">
                <h1 className="text-lg font-semibold text-[#1E3A8A]">Expenses & payments</h1>
                <p className="text-sm text-[#1E3A8A]/70 mt-1">
                    Log transactions linked to specific cards for an accurate balance.
                </p>
            </div>

            <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                    <h2 className="text-sm font-semibold text-[#1E3A8A]">Expenses</h2>
                    <AddButton onClick={openCreate} ariaLabel="Add entry">Add Expense</AddButton>
                </div>
                <div className="p-4">
                    <AppDataTable columns={columns} data={localExpenses ?? []} searchPlaceholder="Search expenses..." />
                    {(localExpenses ?? []).length > 0 && (
                        <div
                            className="mt-0 border-t-2 border-[#1E3A8A]/30 bg-[#1E3A8A]/8 px-4 py-3 flex flex-wrap items-center justify-end gap-6 text-sm"
                            role="row"
                            aria-label="Summary totals"
                        >
                            <span className="font-semibold text-[#1E3A8A]">
                                Total to pay:{' '}
                                <span className="font-bold">
                                    ₱{tableTotals.totalToPay.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </span>
                            <span className="font-semibold text-[#1E3A8A]">
                                Total amount paid:{' '}
                                <span className="font-bold">
                                    ₱{tableTotals.totalAmountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </span>
                            <span className="font-semibold text-[#1E3A8A]">
                                Total outstanding balance:{' '}
                                <span className={`font-bold ${tableTotals.totalOutstanding < 0 ? 'text-emerald-600' : tableTotals.totalOutstanding > 0 ? 'text-amber-700' : 'text-[#1E3A8A]'}`}>
                                    ₱{tableTotals.totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {tableTotals.totalOutstanding < 0 ? ' (credit)' : ''}
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>

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
                    isAdmin={isAdmin}
                />
            </Modal>

            <Modal
                title="Months paid"
                open={!!paidModalExpense}
                onClose={() => {
                    setPaidModalExpense(null);
                    setPaidModalInitialMonth(null);
                }}
            >
                {paidModalExpense && (
                    <InstallmentPaidModal
                        expense={paidModalExpense}
                        onClose={() => {
                            setPaidModalExpense(null);
                            setPaidModalInitialMonth(null);
                        }}
                        onMonthToggled={handleMonthToggled}
                        initialMonth={paidModalInitialMonth}
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
