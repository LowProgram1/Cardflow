/**
 * Format a number as amount with comma as thousands separator (e.g. 1,234.56).
 * @param {number|string|null|undefined} value
 * @param {{ decimals?: number }} options
 * @returns {string}
 */
export function formatAmount(value, options = {}) {
    const { decimals = 2 } = options;
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a number with optional decimals and comma thousands (e.g. 1,234 or 1,234.5).
 * @param {number|string|null|undefined} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    return n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
