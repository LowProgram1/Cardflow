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
            '&:hover': {
                backgroundColor: 'rgba(37, 99, 235, 0.06)',
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

const rowNumberColumn = {
    name: '#',
    width: '56px',
    minWidth: '56px',
    selector: (row, index) => index + 1,
    sortable: false,
    cell: (row, index) => index + 1,
    center: true,
};

export function AppDataTable({ columns, data, title, actions, searchPlaceholder = 'Search...', emptyContent, pagination = true, paginationPerPage = 10, ...rest }) {
    const [filterText, setFilterText] = useState('');
    const columnsWithRowNum = useMemo(() => [rowNumberColumn, ...(columns || [])], [columns]);
    const colCount = columnsWithRowNum.length;
    const hasData = data != null && data.length > 0;
    const showSearch = searchPlaceholder && hasData;

    const filteredData = useMemo(() => {
        if (!filterText.trim()) return data ?? [];
        const lower = filterText.toLowerCase();
        return (data ?? []).filter((row) =>
            columns.some((col) => {
                if (!col.selector) return false;
                const val = typeof col.selector === 'function' ? col.selector(row) : row[col.selector];
                return val != null && String(val).toLowerCase().includes(lower);
            })
        );
    }, [data, filterText, columns]);

    const customStyles = useMemo(() => ({
        ...defaultTheme,
        headCells: {
            style: (row, col, colIndex) => {
                const base = { textAlign: 'center', paddingLeft: colIndex === 0 ? '1.25rem' : undefined };
                if (colIndex === 0) return { ...base, textAlign: 'center' };
                if (colCount > 0 && colIndex === colCount - 1) {
                    return { ...base, position: 'sticky', right: 0, background: '#f8fafc', zIndex: 2, boxShadow: '-4px 0 6px rgba(0,0,0,0.08)' };
                }
                return base;
            },
        },
        cells: {
            style: (row, col, colIndex) => {
                const base = { whiteSpace: 'normal', wordWrap: 'break-word', paddingLeft: colIndex === 0 ? '1.25rem' : undefined };
                if (colIndex === 0) return { ...base, textAlign: 'center' };
                if (colCount > 0 && colIndex === colCount - 1) {
                    return { ...base, position: 'sticky', right: 0, background: '#fff', zIndex: 1, boxShadow: '-4px 0 6px rgba(0,0,0,0.08)' };
                }
                return base;
            },
        },
    }), [colCount]);

    return (
        <div className="app-data-table rounded-2xl border border-[#1E3A8A]/20 bg-white shadow-sm overflow-hidden">
            {(title || showSearch || actions) && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#1E3A8A]/20 bg-white">
                    {title && <h3 className="text-sm font-semibold text-[#1E3A8A]">{title}</h3>}
                    <div className="flex items-center gap-2">
                        {showSearch && (
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] w-48 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            />
                        )}
                        {actions}
                    </div>
                </div>
            )}
            {hasData ? (
                <div className="overflow-x-auto overflow-y-hidden">
                    <DataTable
                        columns={columnsWithRowNum}
                        data={filteredData}
                        theme="default"
                        customStyles={customStyles}
                        pagination={pagination}
                        paginationPerPage={paginationPerPage}
                        paginationRowsPerPageOptions={[5, 10, 25, 50]}
                        noDataComponent={<div className="py-8 text-center text-[#1E3A8A]/60 text-sm">No data.</div>}
                        dense
                        {...rest}
                    />
                </div>
            ) : emptyContent != null ? (
                <div className="py-8">
                    {emptyContent}
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-hidden">
                    <DataTable
                        columns={columnsWithRowNum}
                        data={[]}
                        theme="default"
                        customStyles={customStyles}
                        pagination={false}
                        noDataComponent={<div className="py-8 text-center text-[#1E3A8A]/60 text-sm">No data.</div>}
                        dense
                        {...rest}
                    />
                </div>
            )}
        </div>
    );
}
