import React, { useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';

const defaultTheme = {
    base: {
        fontFamily: 'inherit',
    },
    header: {
        style: {
            minHeight: '52px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1E3A8A',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid rgba(30, 58, 138, 0.2)',
        },
    },
    rows: {
        style: {
            fontSize: '13px',
            color: '#1E3A8A',
            minHeight: '48px',
            '&:not(:last-of-type)': {
                borderBottom: '1px solid rgba(30, 58, 138, 0.1)',
            },
        },
    },
    pagination: {
        style: {
            borderTop: '1px solid rgba(30, 58, 138, 0.1)',
            fontSize: '12px',
            color: '#1E3A8A',
        },
    },
};

export function AppDataTable({ columns, data, title, searchPlaceholder = 'Search...', pagination = true, paginationPerPage = 10, ...rest }) {
    const [filterText, setFilterText] = useState('');

    const filteredData = useMemo(() => {
        if (!filterText.trim()) return data;
        const lower = filterText.toLowerCase();
        return data.filter((row) =>
            columns.some((col) => {
                if (!col.selector) return false;
                const val = typeof col.selector === 'function' ? col.selector(row) : row[col.selector];
                return val != null && String(val).toLowerCase().includes(lower);
            })
        );
    }, [data, filterText, columns]);

    return (
        <div className="app-data-table rounded-2xl border border-[#1E3A8A]/20 bg-white shadow-sm overflow-hidden">
            {(title || searchPlaceholder) && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#1E3A8A]/20 bg-white">
                    {title && <h3 className="text-sm font-semibold text-[#1E3A8A]">{title}</h3>}
                    {searchPlaceholder && (
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] w-48 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                    )}
                </div>
            )}
            <DataTable
                columns={columns}
                data={filteredData}
                theme="default"
                customStyles={defaultTheme}
                pagination={pagination}
                paginationPerPage={paginationPerPage}
                paginationRowsPerPageOptions={[5, 10, 25, 50]}
                noDataComponent={<div className="py-8 text-center text-[#1E3A8A]/60 text-sm">No data.</div>}
                dense
                {...rest}
            />
        </div>
    );
}
