/**
 * Password strength calculation aligned with backend rules:
 * min 12 chars, letters, mixed case, numbers, symbols.
 *
 * @param {string} password
 * @returns {{ level: 'weak'|'fair'|'good'|'strong', score: number, label: string, color: string, segmentCount: number }}
 */
export function getPasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        return { level: 'weak', score: 0, label: 'Enter a password', color: 'text-[#1E3A8A]/50', segmentCount: 0 };
    }

    const len = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (len >= 12) score += 1;
    if (hasLower && hasUpper) score += 1;
    if (hasNumber) score += 1;
    if (hasSymbol) score += 1;

    const levels = [
        { level: 'weak', label: 'Weak', color: 'text-red-600', segmentCount: 1 },
        { level: 'fair', label: 'Fair', color: 'text-amber-600', segmentCount: 2 },
        { level: 'good', label: 'Good', color: 'text-blue-600', segmentCount: 3 },
        { level: 'strong', label: 'Strong', color: 'text-green-600', segmentCount: 4 },
    ];
    const index = Math.max(0, score - 1);
    const { level, label, color, segmentCount } = levels[Math.min(index, 3)];
    return { level, score, label, color, segmentCount };
}

/**
 * @param {string} password
 * @param {string} confirmation
 * @returns {'match'|'mismatch'|'empty'}
 */
export function getConfirmationMatch(password, confirmation) {
    if (!password || !confirmation) return 'empty';
    return password === confirmation ? 'match' : 'mismatch';
}
