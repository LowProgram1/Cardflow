import React, { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * F-ACS Feature Manager: fetch features and user's active features via Axios,
 * display checkboxes, save selected feature IDs to the backend.
 */
export function FeatureManager({ userId }) {
    const { props } = usePage();
    const csrfToken = props?.csrf_token ?? '';
    const [features, setFeatures] = useState([]);
    const [userFeatureIds, setUserFeatureIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchFeatures = useCallback(() => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        window.axios
            .get(`/users/${userId}/features`, {
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken },
            })
            .then(({ data }) => {
                setFeatures(data.features ?? []);
                setUserFeatureIds(data.user_feature_ids ?? []);
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Failed to load features.');
            })
            .finally(() => setLoading(false));
    }, [userId, csrfToken]);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    const toggleFeature = (featureId) => {
        setUserFeatureIds((prev) =>
            prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
        );
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!userId) return;
        setSaving(true);
        setError(null);
        window.axios
            .put(`/users/${userId}/features`, { feature_ids: userFeatureIds }, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(() => {
                setSaving(false);
                // Refresh shared auth.features so sidebar updates
                window.location.reload();
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Failed to save features.');
            })
            .finally(() => setSaving(false));
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-[#1E3A8A]/20 bg-[#E5E7EB] p-8 text-center">
                <p className="text-sm text-[#1E3A8A]/60">Loading features…</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-4">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}
            <div className="space-y-3">
                {features.map((feature) => (
                    <label
                        key={feature.id}
                        className="flex items-center gap-3 cursor-pointer rounded-lg border border-[#1E3A8A]/20 bg-[#F3F4F6] px-4 py-3 hover:bg-[#E5E7EB]"
                    >
                        <input
                            type="checkbox"
                            checked={userFeatureIds.includes(feature.id)}
                            onChange={() => toggleFeature(feature.id)}
                            className="h-4 w-4 rounded border-[#1E3A8A]/30 text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <span className="text-sm font-medium text-[#1E3A8A]">{feature.display_name}</span>
                    </label>
                ))}
            </div>
            {features.length === 0 && (
                <p className="text-sm text-[#1E3A8A]/60">No features available.</p>
            )}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
