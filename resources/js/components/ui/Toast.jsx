import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export function Toast() {
    const { props } = usePage();
    const flash = props.flash;
    const [visible, setVisible] = React.useState(!!flash?.message);

    useEffect(() => {
        if (flash?.message) {
            setVisible(true);
            const id = setTimeout(() => setVisible(false), 2600);
            return () => clearTimeout(id);
        }
    }, [flash?.message]);

    if (!flash?.message || !visible) return null;

    const isError = flash.type === 'error';

    return (
        <div className="fixed inset-x-0 top-4 flex justify-center z-50 px-4">
            <div
                className={[
                    'w-full max-w-sm rounded-lg border px-4 py-2 text-xs shadow-lg flex items-center gap-2',
                    isError
                        ? 'bg-[#1E3A8A]/10 border-[#1E3A8A]/30 text-[#1E3A8A]'
                        : 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#1E3A8A]',
                ].join(' ')}
            >
                <span
                    className={[
                        'h-1.5 w-1.5 rounded-full',
                        isError ? 'bg-[#1E3A8A]' : 'bg-[#2563EB]',
                    ].join(' ')}
                />
                <span className="truncate">{flash.message}</span>
            </div>
        </div>
    );
}

