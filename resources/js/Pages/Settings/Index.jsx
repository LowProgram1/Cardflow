import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormField } from '../../components/ui/FormField';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { PasswordConfirmationHint } from '../../components/ui/PasswordConfirmationHint';
import { AppDataTable } from '../../components/ui/DataTable';
import { useForm, Link, usePage, router } from '@inertiajs/react';

function ProfileForm({ user, isAdmin, faviconUrl }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: user?.name ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch('/profile', {
            preserveScroll: true,
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 max-w-md">
            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Name</label>
                <input
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Email</label>
                <p className="rounded-lg bg-[#E5E7EB] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A]/80">
                    {user?.email ?? '—'}
                </p>
                <p className="text-[11px] text-[#1E3A8A]/50 mt-0.5">Email cannot be changed.</p>
            </div>
            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">New password (optional)</label>
                <PasswordInput
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Min 10 chars, upper & lower case, number, symbol"
                />
                <PasswordStrengthIndicator password={data.password} showOnlyWhenFilled />
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>
            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Confirm new password</label>
                <PasswordInput
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                />
                <PasswordConfirmationHint password={data.password} confirmation={data.password_confirmation} />
                {errors.password_confirmation && <p className="text-xs text-red-600 mt-1">{errors.password_confirmation}</p>}
            </div>
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60"
                >
                    Save profile
                </button>
            </div>
        </form>
    );
}

/** Admin-only: upload CardFlow favicon (.ico only). */
function FaviconForm({ faviconUrl }) {
    const { props } = usePage();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        setError(null);
        if (!f) {
            setFile(null);
            return;
        }
        if (!f.name.toLowerCase().endsWith('.ico')) {
            setError('Only .ico (favicon) files are allowed.');
            setFile(null);
            e.target.value = '';
            return;
        }
        setFile(f);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('favicon', file);
        formData.append('_token', props?.csrf_token ?? '');

        router.post('/settings/favicon', formData, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: () => setUploading(false),
            onError: (errors) => {
                setError(errors.favicon?.[0] || 'Upload failed.');
            },
        });
    };

    return (
        <div className="mt-8 pt-6 border-t border-[#1E3A8A]/20">
            <h3 className="text-sm font-semibold text-[#1E3A8A] mb-1">CardFlow logo / Favicon</h3>
            <p className="text-xs text-[#1E3A8A]/60 mb-3">Upload a .ico file to use as the browser tab icon (favicon) and the sidebar logo. One file is used for both—only .ico format is accepted.</p>
            <div className="flex flex-wrap items-end gap-4">
                {faviconUrl && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#1E3A8A]/60">Current:</span>
                        <img src={faviconUrl} alt="Current favicon" className="h-8 w-8 object-contain rounded border border-[#1E3A8A]/20" />
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ico,image/x-icon,image/vnd.microsoft.icon"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-[#1E3A8A] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#2563EB] file:text-[#F3F4F6] hover:file:bg-[#1E3A8A]"
                        />
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60"
                    >
                        {uploading ? 'Uploading…' : 'Upload favicon'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function CardTypeForm({ initialData, onClose, isEdit }) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: initialData?.name ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/card-types/${initialData.id}` : '/card-types';
        const method = isEdit ? put : post;
        method(route, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Name" name="name" error={errors.name} required>
                <input
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. VISA, Mastercard"
                />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
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
                    {isEdit ? 'Save changes' : 'Add card type'}
                </button>
            </div>
        </form>
    );
}

function CardTypesSection({ cardTypes, onRequestDelete, openModal }) {
    const [modalState, setModalState] = useState({ open: false, cardType: null });

    React.useEffect(() => {
        if (openModal?.context !== 'card-types') return;
        const list = cardTypes ?? [];
        if (openModal.id != null) {
            const item = list.find((c) => c.id === openModal.id);
            setModalState({ open: true, cardType: item ?? null });
        } else {
            setModalState({ open: true, cardType: null });
        }
    }, [openModal?.context, openModal?.id, cardTypes]);

    const openCreate = () => setModalState({ open: true, cardType: null });
    const openEdit = (cardType) => setModalState({ open: true, cardType });
    const closeModal = () => setModalState({ open: false, cardType: null });

    const columns = [
        { name: 'Name', selector: (row) => row.name, sortable: true },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => onRequestDelete?.(`/card-types/${row.id}`, 'Delete card type')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#1E3A8A]/70">Manage card types (e.g. VISA, Mastercard) for the credit card form.</p>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center rounded-lg bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]"
                >
                    + New card type
                </button>
            </div>

            {!cardTypes?.length ? (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#E5E7EB] border-dashed p-12 text-center">
                    <p className="text-sm text-[#1E3A8A]/60">No card types yet.</p>
                    <p className="text-sm text-[#1E3A8A]/50 mt-1">Add VISA, Mastercard, etc. to use in the credit card form.</p>
                    <button
                        onClick={openCreate}
                        className="mt-4 inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]"
                    >
                        + New card type
                    </button>
                </div>
            ) : (
                <AppDataTable columns={columns} data={cardTypes} searchPlaceholder="Search card types..." />
            )}

            <Modal
                title={modalState.cardType ? 'Edit card type' : 'New card type'}
                open={modalState.open}
                onClose={closeModal}
            >
                <CardTypeForm
                    initialData={modalState.cardType}
                    isEdit={!!modalState.cardType}
                    onClose={closeModal}
                />
            </Modal>
        </>
    );
}

function ExpenseTypeForm({ initialData, onClose, isEdit }) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: initialData?.name ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/expense-types/${initialData.id}` : '/expense-types';
        (isEdit ? put : post)(route, { preserveScroll: true, onSuccess: () => onClose() });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Name" name="name" error={errors.name} required>
                <input
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Airlines, Hotel, Restaurant, Grocery"
                />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">
                    {isEdit ? 'Save changes' : 'Add expense type'}
                </button>
            </div>
        </form>
    );
}

function ExpenseTypesSection({ expenseTypes, onRequestDelete, openModal }) {
    const [modalState, setModalState] = useState({ open: false, item: null });

    React.useEffect(() => {
        if (openModal?.context !== 'expense-types') return;
        const list = expenseTypes ?? [];
        if (openModal.id != null) {
            const item = list.find((e) => e.id === openModal.id);
            setModalState({ open: true, item: item ?? null });
        } else {
            setModalState({ open: true, item: null });
        }
    }, [openModal?.context, openModal?.id, expenseTypes]);

    const openEdit = (item) => setModalState({ open: true, item });
    const closeModal = () => setModalState({ open: false, item: null });

    const columns = [
        { name: 'Name', selector: (row) => row.name, sortable: true },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => onRequestDelete?.(`/expense-types/${row.id}`, 'Delete expense type')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#1E3A8A]/70">Manage types of expense (e.g. Airlines, Hotel, Restaurant, Grocery) for the expense form.</p>
                <button onClick={() => setModalState({ open: true, item: null })} className="inline-flex items-center rounded-lg bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]">
                    + New expense type
                </button>
            </div>
            {!expenseTypes?.length ? (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#E5E7EB] border-dashed p-12 text-center">
                    <p className="text-sm text-[#1E3A8A]/60">No expense types yet.</p>
                    <button onClick={() => setModalState({ open: true, item: null })} className="mt-4 inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]">+ New expense type</button>
                </div>
            ) : (
                <AppDataTable columns={columns} data={expenseTypes} searchPlaceholder="Search expense types..." />
            )}
            <Modal title={modalState.item ? 'Edit expense type' : 'New expense type'} open={modalState.open} onClose={() => setModalState({ open: false, item: null })}>
                <ExpenseTypeForm initialData={modalState.item} isEdit={!!modalState.item} onClose={() => setModalState({ open: false, item: null })} />
            </Modal>
        </>
    );
}

function PaymentTermForm({ initialData, onClose, isEdit }) {
    const { data, setData, post, put, processing, errors } = useForm({
        months: initialData?.months ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/payment-terms/${initialData.id}` : '/payment-terms';
        (isEdit ? put : post)(route, { preserveScroll: true, onSuccess: () => onClose() });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="No. of terms (months)" name="months" error={errors.months} required>
                <input
                    type="number"
                    min="1"
                    max="120"
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.months ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.months}
                    onChange={(e) => setData('months', e.target.value)}
                    placeholder="e.g. 3, 6, 9, 12"
                />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">
                    {isEdit ? 'Save changes' : 'Add payment term'}
                </button>
            </div>
        </form>
    );
}

function PaymentTermsSection({ paymentTerms, onRequestDelete, openModal }) {
    const [modalState, setModalState] = useState({ open: false, item: null });

    React.useEffect(() => {
        if (openModal?.context !== 'payment-terms') return;
        const list = paymentTerms ?? [];
        if (openModal.id != null) {
            const item = list.find((p) => p.id === openModal.id);
            setModalState({ open: true, item: item ?? null });
        } else {
            setModalState({ open: true, item: null });
        }
    }, [openModal?.context, openModal?.id, paymentTerms]);

    const openEdit = (item) => setModalState({ open: true, item });
    const closeModal = () => setModalState({ open: false, item: null });

    const columns = [
        { name: 'Months', selector: (row) => row.months, sortable: true, cell: (row) => `${row.months} months` },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => onRequestDelete?.(`/payment-terms/${row.id}`, 'Delete payment term')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#1E3A8A]/70">Manage number of terms for installment (e.g. 3, 6, 9, 12 months).</p>
                <button onClick={() => setModalState({ open: true, item: null })} className="inline-flex items-center rounded-lg bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]">
                    + New payment term
                </button>
            </div>
            {!paymentTerms?.length ? (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#E5E7EB] border-dashed p-12 text-center">
                    <p className="text-sm text-[#1E3A8A]/60">No payment terms yet.</p>
                    <button onClick={() => setModalState({ open: true, item: null })} className="mt-4 inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A]">+ New payment term</button>
                </div>
            ) : (
                <AppDataTable columns={columns} data={paymentTerms} searchPlaceholder="Search payment terms..." />
            )}
            <Modal title={modalState.item ? 'Edit payment term' : 'New payment term'} open={modalState.open} onClose={() => setModalState({ open: false, item: null })}>
                <PaymentTermForm initialData={modalState.item} isEdit={!!modalState.item} onClose={() => setModalState({ open: false, item: null })} />
            </Modal>
        </>
    );
}

export default function SettingsIndex() {
    const { props } = usePage();
    const { user, cardTypes, expenseTypes, paymentTerms, section = 'profile', isAdmin = true } = props;
    const openModal = props?.openModal ?? null;
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null, title: 'Confirm delete' });

    const handleDeleteConfirm = () => {
        if (deleteConfirm.url) {
            router.delete(deleteConfirm.url, { preserveScroll: true });
            setDeleteConfirm({ open: false, url: null, title: 'Confirm delete' });
        }
    };

    const sections = [
        { key: 'profile', label: 'Profile', href: '/settings?section=profile' },
        ...(isAdmin ? [
            { key: 'card-types', label: 'Card types', href: '/settings?section=card-types' },
            { key: 'expense-types', label: 'Expense types', href: '/settings?section=expense-types' },
            { key: 'payment-terms', label: 'Payment terms', href: '/settings?section=payment-terms' },
        ] : []),
    ];

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-[#1E3A8A]">Settings</h1>
                <p className="text-sm text-[#1E3A8A]/70 mt-1">Manage your profile and app categories.</p>
            </div>

            <nav className="flex gap-1 border-b border-[#1E3A8A]/20 mb-6">
                {sections.map((s) => (
                    <Link
                        key={s.key}
                        href={s.href}
                        className={[
                            'px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors',
                            section === s.key
                                ? 'border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5'
                                : 'border-transparent text-[#1E3A8A]/70 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5',
                        ].join(' ')}
                    >
                        {s.label}
                    </Link>
                ))}
            </nav>

            {section === 'profile' && (
                <div>
                    <h2 className="text-sm font-semibold text-[#1E3A8A] mb-1">Profile</h2>
                    <p className="text-xs text-[#1E3A8A]/60 mb-3">Your profile is linked to your user account. You can change your name and password below; email is displayed but cannot be edited.</p>
                    <ProfileForm user={user} isAdmin={isAdmin} faviconUrl={props.favicon_url} />
                    {isAdmin && <FaviconForm faviconUrl={props.favicon_url} />}
                </div>
            )}

            {section === 'card-types' && (
                <div>
                    <h2 className="text-sm font-semibold text-[#1E3A8A] mb-1">Card types</h2>
                    <CardTypesSection cardTypes={cardTypes ?? []} onRequestDelete={(url, title) => setDeleteConfirm({ open: true, url, title: title || 'Confirm delete' })} openModal={section === 'card-types' ? openModal : null} />
                </div>
            )}

            {section === 'expense-types' && (
                <div>
                    <h2 className="text-sm font-semibold text-[#1E3A8A] mb-1">Expense types</h2>
                    <ExpenseTypesSection expenseTypes={expenseTypes ?? []} onRequestDelete={(url, title) => setDeleteConfirm({ open: true, url, title: title || 'Confirm delete' })} openModal={section === 'expense-types' ? openModal : null} />
                </div>
            )}

            {section === 'payment-terms' && (
                <div>
                    <h2 className="text-sm font-semibold text-[#1E3A8A] mb-1">Payment terms</h2>
                    <PaymentTermsSection paymentTerms={paymentTerms ?? []} onRequestDelete={(url, title) => setDeleteConfirm({ open: true, url, title: title || 'Confirm delete' })} openModal={section === 'payment-terms' ? openModal : null} />
                </div>
            )}
            <ConfirmModal
                open={deleteConfirm.open}
                title={deleteConfirm.title}
                message="Do you want to delete?"
                confirmLabel="Delete"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ open: false, url: null, title: 'Confirm delete' })}
            />
        </AppLayout>
    );
}
