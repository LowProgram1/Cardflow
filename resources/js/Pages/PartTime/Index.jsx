import React, { useState, useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormField } from '../../components/ui/FormField';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { AppDataTable } from '../../components/ui/DataTable';
import { AddButton } from '../../components/ui/AddButton';
import { useForm, usePage, router } from '@inertiajs/react';
import { formatAmount, formatNumber } from '../../utils/format';

function PartTimeForm({ initialData, onClose, isEdit }) {
    const { data, setData, post, put, processing, errors } = useForm({
        student_name: initialData?.student_name ?? '',
        schedule: initialData?.schedule ?? '',
        rate_per_hr: initialData?.rate_per_hr ?? '',
        duration_hr: initialData?.duration_hr ?? '',
    });

    const amountToBePaid = useMemo(() => {
        const rate = parseFloat(data.rate_per_hr);
        const duration = parseFloat(data.duration_hr);
        if (Number.isNaN(rate) || Number.isNaN(duration) || rate < 0 || duration < 0) return formatAmount(0);
        return formatAmount(rate * duration);
    }, [data.rate_per_hr, data.duration_hr]);

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/part-times/${initialData.id}`, { preserveScroll: true, onSuccess: onClose });
        } else {
            post('/part-times', { preserveScroll: true, onSuccess: onClose });
        }
    };

    const inputCls = (err) =>
        `w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${
            err ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'
        }`;

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Student's Name" name="student_name" error={errors.student_name} required>
                <input
                    className={inputCls(errors.student_name)}
                    value={data.student_name}
                    onChange={(e) => setData('student_name', e.target.value)}
                    placeholder="Full name"
                />
            </FormField>
            <FormField label="Schedule" name="schedule" error={errors.schedule} required>
                <input
                    type="date"
                    className={inputCls(errors.schedule)}
                    value={data.schedule}
                    onChange={(e) => setData('schedule', e.target.value)}
                />
            </FormField>
            <FormField label="Rate per hr" name="rate_per_hr" error={errors.rate_per_hr} required>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputCls(errors.rate_per_hr)}
                    value={data.rate_per_hr}
                    onChange={(e) => setData('rate_per_hr', e.target.value)}
                    placeholder="0.00"
                />
            </FormField>
            <FormField label="Duration (hr)" name="duration_hr" error={errors.duration_hr} required>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputCls(errors.duration_hr)}
                    value={data.duration_hr}
                    onChange={(e) => setData('duration_hr', e.target.value)}
                    placeholder="0.00"
                />
            </FormField>
            <FormField label="Amount to be Paid" name="amount_to_be_paid">
                <input
                    type="text"
                    readOnly
                    className={`${inputCls(false)} bg-[#E5E7EB]/50 cursor-default`}
                    value={amountToBePaid}
                    tabIndex={-1}
                    aria-readonly
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
                    className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-60"
                >
                    {isEdit ? 'Save changes' : 'Create entry'}
                </button>
            </div>
        </form>
    );
}

export default function PartTimeIndex() {
    const { props } = usePage();
    const partTimes = props?.partTimes ?? [];
    const [modalState, setModalState] = useState({ open: false, item: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null });

    const openCreate = () => setModalState({ open: true, item: null });
    const openEdit = (item) => setModalState({ open: true, item });
    const closeModal = () => setModalState({ open: false, item: null });

    const columns = [
        { name: "Student's Name", selector: (row) => row.student_name, sortable: true, minWidth: '160px' },
        { name: 'Schedule', selector: (row) => row.schedule_formatted, sortable: true, cell: (row) => row.schedule_formatted || '—', minWidth: '140px' },
        { name: 'Rate per hr', selector: (row) => row.rate_per_hr, sortable: true, cell: (row) => formatAmount(row.rate_per_hr), minWidth: '100px' },
        { name: 'Duration (hr)', selector: (row) => row.duration_hr, sortable: true, cell: (row) => formatNumber(row.duration_hr, 2), minWidth: '110px' },
        { name: 'Amount to be Paid', selector: (row) => row.amount_to_be_paid, sortable: true, cell: (row) => row.formatted_amount ?? formatAmount(row.amount_to_be_paid), minWidth: '140px' },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
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
                    <button
                        type="button"
                        onClick={() => setDeleteConfirm({ open: true, url: `/part-times/${row.id}` })}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Remove"
                        aria-label="Remove entry"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
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
                <h1 className="text-lg font-semibold text-[#1E3A8A]">Part-Time</h1>
                <p className="text-sm text-[#1E3A8A]/70 mt-1">Manage part-time students, schedule, rate and amount to be paid.</p>
            </div>

            <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                    <h2 className="text-sm font-semibold text-[#1E3A8A]">Part-Time Table</h2>
                    <AddButton onClick={openCreate} ariaLabel="New part-time entry">Add</AddButton>
                </div>
                <div className="p-4">
                    <AppDataTable
                        columns={columns}
                        data={partTimes}
                        searchPlaceholder="Search..."
                        paginationPerPage={10}
                    />
                </div>
            </div>

            <Modal
                title={modalState.item ? 'Edit part-time entry' : 'New part-time entry'}
                open={modalState.open}
                onClose={closeModal}
            >
                <PartTimeForm initialData={modalState.item} isEdit={!!modalState.item} onClose={closeModal} />
            </Modal>
            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete entry"
                message="Remove this part-time entry?"
                confirmLabel="Delete"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ open: false, url: null })}
            />
        </AppLayout>
    );
}
