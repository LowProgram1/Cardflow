import React from 'react';
import { getPasswordStrength } from '../../utils/passwordStrength';

const SEGMENT_BG = 'bg-[#1E3A8A]/20';
const SEGMENT_ACTIVE = {
    weak: 'bg-red-500',
    fair: 'bg-amber-500',
    good: 'bg-blue-500',
    strong: 'bg-green-600',
};

/**
 * Shows a 4-segment strength bar and label. Use when user is typing a new password.
 * Only show when password has content (optional).
 */
export function PasswordStrengthIndicator({ password, showOnlyWhenFilled = true }) {
    const strength = getPasswordStrength(password ?? '');
    if (showOnlyWhenFilled && !password) return null;

    return (
        <div className="mt-1.5 space-y-1">
            <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-sm transition-colors ${
                            i <= strength.segmentCount ? SEGMENT_ACTIVE[strength.level] : SEGMENT_BG
                        }`}
                    />
                ))}
            </div>
            <p className={`text-xs ${strength.color}`}>{strength.label}</p>
        </div>
    );
}
