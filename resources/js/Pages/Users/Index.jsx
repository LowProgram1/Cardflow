import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormField } from '../../components/ui/FormField';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { AppDataTable } from '../../components/ui/DataTable';
import { AddButton } from '../../components/ui/AddButton';
import { useForm, usePage, router } from '@inertiajs/react';

function UserForm({ initialData, onClose, isEdit, features = [] }) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: initialData?.name ?? '',
        email: initialData?.email ?? '',
        role: initialData?.role ?? 'admin',
        feature_ids: initialData?.feature_ids ?? [],
    });

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/users/${initialData.id}` : '/users';
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
                />
            </FormField>
            <FormField label="Email" name="email" error={errors.email} required>
                <input
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
            </FormField>
            <p className="text-[11px] text-[#1E3A8A]/60">The user will set their password via Forgot Password or the registration verification link.</p>
            <FormField label="Role" name="role" error={errors.role} required>
                <select
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.role ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.role}
                    onChange={(e) => setData('role', e.target.value)}
                >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </FormField>

            <div className="space-y-2">
                <span className="text-xs font-medium text-[#1E3A8A]">Feature access</span>
                <p className="text-[11px] text-[#1E3A8A]/60">Enable Cards, Expense Tracker, and/or Salary Monitoring for this user.</p>
                <div className="space-y-2 pt-1">
                    {features.map((feature) => (
                        <label
                            key={feature.id}
                            className="flex items-center gap-3 cursor-pointer rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-3 py-2 hover:bg-[#E5E7EB]"
                        >
                            <input
                                type="checkbox"
                                checked={data.feature_ids.includes(feature.id)}
                                onChange={(e) => {
                                    const next = e.target.checked
                                        ? [...data.feature_ids, feature.id]
                                        : data.feature_ids.filter((id) => id !== feature.id);
                                    setData('feature_ids', next);
                                }}
                                className="h-4 w-4 rounded border-[#1E3A8A]/30 text-[#2563EB] focus:ring-[#2563EB]"
                            />
                            <span className="text-xs font-medium text-[#1E3A8A]">{feature.display_name}</span>
                        </label>
                    ))}
                </div>
                {errors.feature_ids && <p className="text-xs text-red-600 mt-1">{errors.feature_ids}</p>}
            </div>

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
                    {isEdit ? 'Save changes' : 'Create user'}
                </button>
            </div>
        </form>
    );
}

export default function UsersIndex() {
    const { props } = usePage();
    const { users, features = [] } = props;
    const [modalState, setModalState] = useState({ open: false, user: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null });

    const openModal = props?.openModal;
    useEffect(() => {
        if (openModal?.context !== 'users') return;
        const list = users ?? [];
        if (openModal.id != null) {
            const user = list.find((u) => u.id === openModal.id);
            setModalState({ open: true, user: user ?? null });
        } else {
            setModalState({ open: true, user: null });
        }
    }, [openModal?.context, openModal?.id, users]);

    const openCreate = () => setModalState({ open: true, user: null });
    const openEdit = (user) => setModalState({ open: true, user });
    const closeModal = () => setModalState({ open: false, user: null });

    const featureNamesByKey = (features || []).reduce((acc, f) => ({ ...acc, [f.id]: f.display_name }), {});

    const columns = [
        { name: 'Name', selector: (row) => row.name, sortable: true },
        { name: 'Email', selector: (row) => row.email, sortable: true },
        { name: 'Role', selector: (row) => row.role, sortable: true, cell: (row) => <span className="uppercase text-xs tracking-wide">{row.role}</span> },
        {
            name: 'Features',
            cell: (row) => (
                <span className="text-xs text-[#1E3A8A]/80">
                    {(row.feature_ids || []).map((id) => featureNamesByKey[id]).filter(Boolean).join(', ') || '—'}
                </span>
            ),
        },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]"
                        title="Edit"
                        aria-label="Edit user"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeleteConfirm({ open: true, url: `/users/${row.id}` })}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Remove"
                        aria-label="Remove user"
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
                <h1 className="text-lg font-semibold text-[#1E3A8A]">Users Management</h1>
                <p className="text-sm text-[#1E3A8A]/70 mt-1">Manage who can access CardFlow.</p>
            </div>

            <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                    <h2 className="text-sm font-semibold text-[#1E3A8A]">Users</h2>
                    <AddButton onClick={openCreate} ariaLabel="New user">Add user</AddButton>
                </div>
                <div className="p-4">
                    <AppDataTable columns={columns} data={users ?? []} searchPlaceholder="Search users..." />
                </div>
            </div>

            <Modal
                title={modalState.user ? 'Edit user' : 'New user'}
                open={modalState.open}
                onClose={closeModal}
            >
                <UserForm initialData={modalState.user} isEdit={!!modalState.user} onClose={closeModal} features={features} />
            </Modal>
            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete user"
                message="Do you want to delete?"
                confirmLabel="Delete"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ open: false, url: null })}
            />
        </AppLayout>
    );
}
