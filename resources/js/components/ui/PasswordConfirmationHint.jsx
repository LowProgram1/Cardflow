import React from 'react';
import { getConfirmationMatch } from '../../utils/passwordStrength';

/**
 * Shows match / mismatch when both password and confirmation have value.
 */
export function PasswordConfirmationHint({ password, confirmation }) {
    const status = getConfirmationMatch(password ?? '', confirmation ?? '');
    if (status === 'empty') return null;
    if (status === 'match') {
        return <p className="text-xs text-green-600 mt-1">Passwords match</p>;
    }
    return <p className="text-xs text-red-600 mt-1">Passwords do not match</p>;
}
