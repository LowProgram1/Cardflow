import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Full-screen overlay: green for success, red for delete/error.
 * Shows briefly then fades out.
 */
export function FlashOverlay() {
    const { props } = usePage();
    const flash = props?.flash;
    const [visible, setVisible] = useState(false);
    const [fade, setFade] = useState(false);

    useEffect(() => {
        if (!flash?.message) return;
        // Only show overlay for success (green) or delete (red)
        if (flash.type !== 'success' && flash.type !== 'delete') return;
        if (flash.key == null) return;
        setVisible(true);
        setFade(false);
        const startFade = setTimeout(() => setFade(true), 400);
        const hide = setTimeout(() => setVisible(false), 900);
        return () => {
            clearTimeout(startFade);
            clearTimeout(hide);
        };
    }, [flash?.key]);

    if (!visible || !flash?.message) return null;

    const isDelete = flash.type === 'delete';
    const isRed = isDelete;

    return (
        <div
            className={[
                'fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300',
                isRed ? 'bg-red-500/30' : 'bg-green-500/30',
                fade ? 'opacity-0' : 'opacity-100',
            ].join(' ')}
            aria-hidden
        />
    );
}
