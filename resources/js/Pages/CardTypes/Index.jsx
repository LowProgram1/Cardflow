import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AddButton } from '../../components/ui/AddButton';
import { useForm, usePage, router } from '@inertiajs/react';

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
            <div className="space-y-1">
                <label className="text-xs text-[#1E3A8A]">Name</label>
                <input
                    className="w-full rounded-lg bg-[#F3F4F6] border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. VISA, Mastercard"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
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
                    {isEdit ? 'Save changes' : 'Add card type'}
                </button>
            </div>
        </form>
    );
}

export default function CardTypesIndex() {
    const { props } = usePage();
    const { cardTypes } = props;
    const [modalState, setModalState] = useState({ open: false, cardType: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null });

    const openCreate = () => setModalState({ open: true, cardType: null });
    const openEdit = (cardType) => setModalState({ open: true, cardType });
    const closeModal = () => setModalState({ open: false, cardType: null });

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-semibold text-[#1E3A8A]">Card types</h1>
                    <p className="text-sm text-[#1E3A8A]/70 mt-1">Manage card types (e.g. VISA, Mastercard) for the credit card form.</p>
                </div>
                <AddButton onClick={openCreate} ariaLabel="New card type">+ New card type</AddButton>
            </div>

            {!cardTypes?.length ? (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#E5E7EB] border-dashed p-12 text-center">
                    <p className="text-sm text-[#1E3A8A]/60">No card types yet.</p>
                    <p className="text-sm text-[#1E3A8A]/50 mt-1">Add VISA, Mastercard, etc. to use in the credit card form.</p>
                    <AddButton onClick={openCreate} ariaLabel="New card type" className="mt-4">+ New card type</AddButton>
                </div>
            ) : (
                <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                    <table className="w-full text-sm text-left text-[#1E3A8A]">
                        <thead className="bg-[#1E3A8A]/10 text-xs uppercase tracking-wider text-[#1E3A8A]">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cardTypes.map((ct) => (
                                <tr key={ct.id} className="border-t border-[#1E3A8A]/10 hover:bg-[#1E3A8A]/5">
                                    <td className="px-4 py-3 font-medium">{ct.name}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(ct)}
                                            className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]"
                                            title="Edit"
                                            aria-label="Edit card type"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirm({ open: true, url: `/card-types/${ct.id}` })}
                                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                            title="Remove"
                                            aria-label="Remove card type"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
            <ConfirmModal
                open={deleteConfirm.open}
                title="Delete card type"
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
