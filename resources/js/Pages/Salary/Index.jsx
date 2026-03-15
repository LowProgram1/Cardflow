import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FormField } from '../../components/ui/FormField';
import { FormValidationSummary } from '../../components/ui/FormValidationSummary';
import { AppDataTable } from '../../components/ui/DataTable';
import { AddButton } from '../../components/ui/AddButton';
import { useForm, usePage, router, Link } from '@inertiajs/react';
import { formatAmount, formatNumber } from '../../utils/format';

function CollapsibleSection({ title, open, onToggle, children }) {
    return (
        <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 text-left bg-[#F3F4F6] hover:bg-[#E5E7EB] border-b border-[#1E3A8A]/10"
            >
                <span className="text-sm font-semibold text-[#1E3A8A]">{title}</span>
                <svg
                    className={`w-5 h-5 text-[#1E3A8A] transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="p-4">{children}</div>}
        </div>
    );
}

function ClassForm({ initialData, onClose, isEdit, section }) {
    const { data, setData, post, put, processing, errors } = useForm({
        class_name: initialData?.class_name ?? '',
        section: section ?? '',
    });
    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/salary/classes/${initialData.id}` : '/salary/classes';
        (isEdit ? put : post)(route, { preserveScroll: true, onSuccess: () => onClose() });
    };
    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Class name" name="class_name" error={errors.class_name} required>
                <input
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.class_name ? 'border-red-500 bg-red-50/50' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.class_name}
                    onChange={(e) => setData('class_name', e.target.value)}
                    placeholder="e.g. Math 101"
                />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">{isEdit ? 'Save' : 'Add class'}</button>
            </div>
        </form>
    );
}

function todayYMD() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const SCHEDULE_DAYS = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

function PartTimeTableForm({ initialData, onClose, isEdit }) {
    const { data, setData, post, put, processing, errors } = useForm({
        student_name: initialData?.student_name ?? '',
        schedule_days: Array.isArray(initialData?.schedule_days) ? initialData.schedule_days : [],
        rate_per_hr: initialData?.rate_per_hr ?? '',
        duration_hr: initialData?.duration_hr ?? '',
    });
    const toggleDay = (key) => {
        const next = data.schedule_days.includes(key)
            ? data.schedule_days.filter((d) => d !== key)
            : [...data.schedule_days, key].sort((a, b) => SCHEDULE_DAYS.findIndex((x) => x.key === a) - SCHEDULE_DAYS.findIndex((x) => x.key === b));
        setData('schedule_days', next);
    };
    const submit = (e) => {
        e.preventDefault();
        if (isEdit) put(`/part-times/${initialData.id}`, { preserveScroll: true, onSuccess: onClose });
        else post('/part-times', { preserveScroll: true, onSuccess: onClose });
    };
    const inputCls = (err) =>
        `w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${err ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`;
    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Student Name" name="student_name" error={errors.student_name} required>
                <input className={inputCls(errors.student_name)} value={data.student_name} onChange={(e) => setData('student_name', e.target.value)} placeholder="Full name" />
            </FormField>
            <FormField label="Schedule" name="schedule_days" error={errors.schedule_days} required>
                <p className="text-[11px] text-[#1E3A8A]/60 mb-2">Select the days this student is scheduled.</p>
                <div className="flex flex-wrap gap-2">
                    {SCHEDULE_DAYS.map(({ key, label }) => {
                        const selected = data.schedule_days.includes(key);
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleDay(key)}
                                className={`min-w-[3.5rem] rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                                    selected
                                        ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                                        : 'border-[#1E3A8A]/20 bg-[#F3F4F6] text-[#1E3A8A]/70 hover:border-[#1E3A8A]/40 hover:bg-[#E5E7EB]'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </FormField>
            <FormField label="Rate" name="rate_per_hr" error={errors.rate_per_hr} required>
                <input type="number" step="0.01" min="0" className={inputCls(errors.rate_per_hr)} value={data.rate_per_hr} onChange={(e) => setData('rate_per_hr', e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="Hours" name="duration_hr" error={errors.duration_hr} required>
                <input type="number" step="0.5" min="0" className={inputCls(errors.duration_hr)} value={data.duration_hr} onChange={(e) => setData('duration_hr', e.target.value)} placeholder="e.g. 1.5 for 1½ hours" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">{isEdit ? 'Save changes' : 'Create entry'}</button>
            </div>
        </form>
    );
}

function RateForm({ initialData, onClose, isEdit, section }) {
    const { data, setData, post, put, processing, errors } = useForm({
        rate_date: initialData?.rate_date ?? todayYMD(),
        hourly_rate: String(initialData?.hourly_rate ?? ''),
        urgent_rate: String(initialData?.urgent_rate ?? ''),
        section: section ?? '',
    });
    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/salary/rates/${initialData.id}` : '/salary/rates';
        (isEdit ? put : post)(route, { preserveScroll: true, onSuccess: () => onClose() });
    };
    const minDate = isEdit && initialData?.rate_date ? initialData.rate_date : todayYMD();
    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Date" name="rate_date" error={errors.rate_date} required>
                <input
                    type="date"
                    min={minDate}
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.rate_date ? 'border-red-500 bg-red-50/50' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.rate_date}
                    onChange={(e) => setData('rate_date', e.target.value)}
                />
            </FormField>
            <FormField label="Standard rate" name="hourly_rate" error={errors.hourly_rate} required>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.hourly_rate ? 'border-red-500 bg-red-50/50' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.hourly_rate}
                    onChange={(e) => setData('hourly_rate', e.target.value)}
                />
            </FormField>
            <FormField label="Urgent rate" name="urgent_rate" error={errors.urgent_rate} required>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${errors.urgent_rate ? 'border-red-500 bg-red-50/50' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`}
                    value={data.urgent_rate}
                    onChange={(e) => setData('urgent_rate', e.target.value)}
                />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">{isEdit ? 'Save' : 'Add rate'}</button>
            </div>
        </form>
    );
}

function timeToMinutes(h, m) {
    return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
}
function minutesFromTimeRange(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':');
    const [eh, em] = end.split(':');
    const startM = timeToMinutes(sh, sm);
    let endM = timeToMinutes(eh, em);
    if (endM <= startM) endM += 24 * 60;
    return endM - startM;
}

function PaymentForm({ initialData, onClose, isEdit, classes, rates, section, employmentType = 'full_time' }) {
    const [minutesEditable, setMinutesEditable] = useState(!!initialData?.minutes);
    const [classSearch, setClassSearch] = useState('');
    const [classDropdownOpen, setClassDropdownOpen] = useState(false);
    const latestRate = (rates && rates.length > 0) ? rates[0] : null;
    const effectiveRateId = isEdit ? (initialData?.salary_rate_id ?? latestRate?.id) : (latestRate?.id ?? null);
    const effectiveEmploymentType = initialData?.employment_type ?? employmentType ?? 'full_time';
    const { data, setData, post, put, processing, errors } = useForm({
        salary_class_id: String(initialData?.salary_class_id ?? ''),
        salary_rate_id: String(effectiveRateId ?? ''),
        employment_type: effectiveEmploymentType,
        schedule: initialData?.schedule_date ?? '',
        time_start: initialData?.time_start ?? '09:00',
        time_end: initialData?.time_end ?? '10:00',
        minutes: String(initialData?.minutes ?? 60),
        extra_amount: String(initialData?.extra_amount ?? '0'),
        use_urgent_rate: initialData?.use_urgent_rate ?? false,
        section: section ?? '',
    });

    const computedMinutes = minutesFromTimeRange(data.time_start, data.time_end);
    const minutesValue = minutesEditable ? (parseInt(data.minutes, 10) || 0) : computedMinutes;
    const hoursValue = minutesValue > 0 ? formatNumber(minutesValue / 60, 2) : '0.00';
    const selectedClass = (classes || []).find((c) => String(c.id) === data.salary_class_id) ?? null;
    const filteredClasses = useMemo(() => {
        if (!classes?.length) return [];
        const q = (classSearch || '').trim().toLowerCase();
        if (!q) return classes;
        return classes.filter((c) => (c.class_name || '').toLowerCase().includes(q));
    }, [classes, classSearch]);
    const selectedRate = (rates || []).find((r) => String(r.id) === data.salary_rate_id);
    const rateUsed = data.use_urgent_rate ? (selectedRate?.urgent_rate ?? 0) : (selectedRate?.hourly_rate ?? 0);
    const amountPeriodNum = parseFloat(rateUsed) * (minutesValue / 60);
    const amountPeriod = formatAmount(amountPeriodNum);
    const amountPaid = formatAmount(amountPeriodNum + (parseFloat(data.extra_amount) || 0));

    useEffect(() => {
        if (!minutesEditable) setData('minutes', String(computedMinutes));
    }, [minutesEditable, computedMinutes, setData]);

    const handleTimeChange = (field, value) => {
        setData(field, value);
        if (!minutesEditable) setData('minutes', String(minutesFromTimeRange(field === 'time_start' ? value : data.time_start, field === 'time_end' ? value : data.time_end)));
    };

    const submit = (e) => {
        e.preventDefault();
        const route = isEdit ? `/salary/payments/${initialData.id}` : '/salary/payments';
        (isEdit ? put : post)(route, { preserveScroll: true, onSuccess: () => onClose() });
    };

    const inputCls = (err) => `w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${err ? 'border-red-500 bg-red-50/50' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`;

    return (
        <form onSubmit={submit} className="space-y-4 w-full">
            <FormValidationSummary errors={errors} />
            <FormField label="Class" name="salary_class_id" error={errors.salary_class_id} required>
                <div className="relative">
                    <input
                        type="text"
                        className={inputCls(errors.salary_class_id)}
                        placeholder="Search class..."
                        value={classDropdownOpen ? classSearch : (selectedClass?.class_name ?? '')}
                        onChange={(e) => {
                            setClassSearch(e.target.value);
                            setClassDropdownOpen(true);
                            if (!e.target.value) setData('salary_class_id', '');
                        }}
                        onFocus={() => setClassDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setClassDropdownOpen(false), 200)}
                        autoComplete="off"
                    />
                    {classDropdownOpen && filteredClasses.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-auto rounded-lg border border-[#1E3A8A]/20 bg-white shadow-lg py-1 text-xs">
                            {filteredClasses.map((c) => (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-[#2563EB]/10 text-[#1E3A8A]"
                                        onClick={() => {
                                            setData('salary_class_id', String(c.id));
                                            setClassSearch('');
                                            setClassDropdownOpen(false);
                                        }}
                                    >
                                        {c.class_name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
        
            </FormField>
            <div className="grid grid-cols-2 gap-4 w-full items-end">
                {selectedRate ? (
                    <FormField label="Rate (latest)" name="salary_rate_id" className="w-full">
                        <input
                            type="text"
                            readOnly
                            className={`${inputCls(errors.salary_rate_id)} bg-[#E5E7EB] h-[2.5rem]`}
                            value={`${selectedRate.rate_date} — Std: ${formatAmount(selectedRate.hourly_rate ?? 0)} / Urg: ${formatAmount(selectedRate.urgent_rate ?? 0)}`}
                        />
                    </FormField>
                ) : (
                    <div className="space-y-1 w-full">
                        <label className="block text-xs font-medium text-[#1E3A8A]">Rate (latest)</label>
                        <div className="relative flex items-center min-h-[2.5rem]">
                            <p className="text-xs text-amber-600">Add a rate in Categories first.</p>
                        </div>
                    </div>
                )}
                <div className="space-y-1 w-full">
                    <span className="block text-xs font-medium h-4" aria-hidden="true">&nbsp;</span>
                    <div className="relative flex items-center gap-2 min-h-[2.5rem]">
                        <input type="checkbox" id="use_urgent" checked={data.use_urgent_rate} onChange={(e) => setData('use_urgent_rate', e.target.checked)} className="rounded border-[#1E3A8A]/30" aria-label="Urgent rate" />
                        <span className="text-[11px] text-[#1E3A8A]/60">Urgent rate</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                <FormField label="Schedule" name="schedule" error={errors.schedule} required className="w-full" placeholder="Choose Date">
                    <input type="date" className={`${inputCls(errors.schedule)} h-[2.5rem]`} value={data.schedule} onChange={(e) => setData('schedule', e.target.value)} />
                </FormField>
                <FormField label="Time range" name="time_range" error={errors.time_start || errors.time_end} className="w-full">
                    <div className="flex items-center gap-2 min-h-[2.5rem] w-full">
                        <input
                            type="time"
                            className={`${inputCls(errors.time_start)} h-[2.5rem] flex-1 min-w-0`}
                            value={data.time_start}
                            onChange={(e) => handleTimeChange('time_start', e.target.value)}
                            aria-label="Time start"
                        />
                        <span className="text-[#1E3A8A]/50 text-xs shrink-0">–</span>
                        <input
                            type="time"
                            className={`${inputCls(errors.time_end)} h-[2.5rem] flex-1 min-w-0`}
                            value={data.time_end}
                            onChange={(e) => handleTimeChange('time_end', e.target.value)}
                            aria-label="Time end"
                        />
                    </div>
                </FormField>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="edit_min" checked={minutesEditable} onChange={(e) => { setMinutesEditable(e.target.checked); if (!e.target.checked) setData('minutes', String(minutesFromTimeRange(data.time_start, data.time_end))); }} className="rounded border-[#1E3A8A]/30" />
                <label htmlFor="edit_min" className="text-xs text-[#1E3A8A]">Allow editing minutes</label>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                <FormField label="Minutes" name="minutes" error={errors.minutes} required className="w-full">
                    <input type="number" min="0" className={`${inputCls(errors.minutes)} h-[2.5rem]`} value={minutesValue} onChange={(e) => setData('minutes', e.target.value)} readOnly={!minutesEditable} />
                </FormField>
                <FormField label="Hours (auto)" className="w-full">
                    <input type="text" readOnly className={`${inputCls(false)} bg-[#E5E7EB] h-[2.5rem]`} value={hoursValue} tabIndex={-1} aria-readonly />
                </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
                <FormField label="Extra amount" name="extra_amount" error={errors.extra_amount} className="w-full">
                    <input type="number" min="0" step="0.01" className={`${inputCls(errors.extra_amount)} h-[2.5rem]`} value={data.extra_amount} onChange={(e) => setData('extra_amount', e.target.value)} />
                </FormField>
                <FormField label="Total" className="w-full">
                    <input type="text" readOnly className={`${inputCls(false)} bg-[#E5E7EB] font-medium h-[2.5rem]`} value={amountPaid} tabIndex={-1} aria-readonly />
                </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing || !selectedRate} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">{isEdit ? 'Save' : 'Add payment'}</button>
            </div>
        </form>
    );
}

function PartTimePaymentForm({ initialData, onClose, isEdit, partTimes, section }) {
    const [studentSearch, setStudentSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { data, setData, post, put, processing, errors } = useForm({
        part_time_id: String(initialData?.part_time_id ?? ''),
        schedule: initialData?.schedule_date ?? '',
        hours: String(initialData?.hours ?? ''),
        section: section ?? '',
    });

    const selectedPartTime = partTimes?.find((p) => String(p.id) === data.part_time_id) ?? null;
    const filteredStudents = useMemo(() => {
        if (!partTimes?.length) return [];
        const q = (studentSearch || '').trim().toLowerCase();
        if (!q) return partTimes;
        return partTimes.filter((p) => (p.student_name || '').toLowerCase().includes(q));
    }, [partTimes, studentSearch]);

    const hoursNum = parseFloat(data.hours) || 0;
    const amountDisplay = formatAmount(selectedPartTime ? selectedPartTime.rate_per_hr * hoursNum : 0);

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/salary/part-time-payments/${initialData.id}`, { preserveScroll: true, onSuccess: () => onClose() });
        } else {
            post('/salary/part-time-payments', { preserveScroll: true, onSuccess: () => onClose() });
        }
    };

    const inputCls = (err) =>
        `w-full rounded-lg border px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 ${err ? 'border-red-500 bg-red-50/50 focus:ring-red-500' : 'border-[#1E3A8A]/20 bg-[#F3F4F6] focus:ring-[#2563EB]'}`;

    return (
        <form onSubmit={submit} className="space-y-4">
            <FormValidationSummary errors={errors} />
            <FormField label="Date" name="schedule" error={errors.schedule} required hint="Choose Date">
                <input
                    type="date"
                    className={inputCls(errors.schedule)}
                    value={data.schedule}
                    onChange={(e) => setData('schedule', e.target.value)}
                    placeholder="Choose Date"
                />
            </FormField>
            <FormField label="Student Name" name="part_time_id" error={errors.part_time_id} required>
                <div className="relative">
                    <input
                        type="text"
                        className={inputCls(errors.part_time_id)}
                        placeholder="Search student..."
                        value={dropdownOpen ? studentSearch : (selectedPartTime?.student_name ?? '')}
                        onChange={(e) => {
                            setStudentSearch(e.target.value);
                            setDropdownOpen(true);
                            if (!e.target.value) setData('part_time_id', '');
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                        autoComplete="off"
                    />
                    {dropdownOpen && filteredStudents.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-auto rounded-lg border border-[#1E3A8A]/20 bg-white shadow-lg py-1 text-xs">
                            {filteredStudents.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 hover:bg-[#2563EB]/10 text-[#1E3A8A]"
                                        onClick={() => {
                                            setData('part_time_id', String(p.id));
                                            setStudentSearch('');
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        {p.student_name} — {formatAmount(p.rate_per_hr)}/hr
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <p className="text-[11px] text-[#1E3A8A]/60 mt-1">Choose from Part-Time Rates. Type to search.</p>
            </FormField>
            <FormField label="Hours" name="hours" error={errors.hours} required>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputCls(errors.hours)}
                    value={data.hours}
                    onChange={(e) => setData('hours', e.target.value)}
                    placeholder="e.g. 1.5 for 1½ hours"
                />
            </FormField>
            <FormField label="Amount (rate × hours)" name="amount">
                <input
                    type="text"
                    readOnly
                    className={`${inputCls(false)} bg-[#E5E7EB]/50 cursor-default`}
                    value={amountDisplay}
                    tabIndex={-1}
                    aria-readonly
                />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                <button type="submit" disabled={processing || !selectedPartTime} className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-[#F3F4F6] hover:bg-[#1E3A8A] disabled:opacity-60">{isEdit ? 'Save' : 'Add payment'}</button>
            </div>
        </form>
    );
}

const SALARY_HUB_LINKS = [
    { name: 'Payments', href: '/salary?section=payments', description: 'Payments table' },
    { name: 'Categories', href: '/salary?section=classes-rates', description: 'Classes and rates tables' },
];

export default function SalaryIndex() {
    const { props } = usePage();
    const { classes = [], rates = [], payments = [], partTimes = [], partTimePayments = [], section } = props;
    const fullTimePayments = (payments || []).filter((p) => (p.employment_type || 'full_time') === 'full_time');
    const [partTimeModal, setPartTimeModal] = useState({ open: false, item: null });
    const [partTimeDeleteConfirm, setPartTimeDeleteConfirm] = useState({ open: false, url: null });
    const [classModal, setClassModal] = useState({ open: false, item: null });
    const [rateModal, setRateModal] = useState({ open: false, item: null });
    const [paymentModal, setPaymentModal] = useState({ open: false, item: null, employmentType: 'full_time' });
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [pdfRange, setPdfRange] = useState({ from: '', to: '' });
    const [pdfEmploymentType, setPdfEmploymentType] = useState('full_time');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, url: null, title: '' });
    const [partTimePaymentModal, setPartTimePaymentModal] = useState({ open: false, item: null });
    const [partTimePaymentDeleteConfirm, setPartTimePaymentDeleteConfirm] = useState({ open: false, url: null });

    const classColumns = [
        { name: 'Class name', selector: (row) => row.class_name, sortable: true },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setClassModal({ open: true, item: row })} className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]" title="Edit" aria-label="Edit class">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button type="button" onClick={() => setDeleteConfirm({ open: true, url: `/salary/classes/${row.id}`, title: 'Delete class' })} className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Remove" aria-label="Remove class">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];
    const rateColumns = [
        { name: 'Date', selector: (row) => row.rate_date, sortable: true },
        { name: 'Standard rate', selector: (row) => row.hourly_rate, sortable: true, cell: (row) => formatAmount(row.hourly_rate) },
        { name: 'Urgent rate', selector: (row) => row.urgent_rate, sortable: true, cell: (row) => formatAmount(row.urgent_rate) },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setRateModal({ open: true, item: row })} className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]" title="Edit" aria-label="Edit rate">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button type="button" onClick={() => setDeleteConfirm({ open: true, url: `/salary/rates/${row.id}`, title: 'Delete rate' })} className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Remove" aria-label="Remove rate">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];
    const paymentColumns = [
        { name: 'Class', selector: (row) => row.class_name, minWidth: '100px' },
        { name: 'Duration', selector: (row) => row.duration, minWidth: '120px' },
        { name: 'Schedule', selector: (row) => row.schedule, minWidth: '140px' },
        { name: 'Minutes', selector: (row) => row.minutes, minWidth: '90px' },
        { name: 'Hours', selector: (row) => row.hours, cell: (row) => formatNumber(row.hours, 2), minWidth: '80px' },
        { name: 'Standard Rate', selector: (row) => row.standard_rate, cell: (row) => row.use_urgent_rate ? '—' : formatAmount(row.standard_rate), minWidth: '110px' },
        { name: 'Extra Amount', selector: (row) => row.extra_amount, cell: (row) => formatAmount(row.extra_amount), minWidth: '110px' },
        { name: 'Urgent Rate', selector: (row) => row.urgent_rate, cell: (row) => row.use_urgent_rate ? formatAmount(row.urgent_rate) : '—', minWidth: '100px' },
        { name: 'Amount paid', selector: (row) => row.amount_paid_display ?? row.amount_paid, cell: (row) => formatAmount(row.amount_paid_display ?? row.amount_paid), minWidth: '100px' },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setPaymentModal({ open: true, item: row })} className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]" title="Edit" aria-label="Edit payment">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button type="button" onClick={() => setDeleteConfirm({ open: true, url: `/salary/payments/${row.id}`, title: 'Delete payment' })} className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Remove" aria-label="Remove payment">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];

    const handleDeleteConfirm = () => {
        if (deleteConfirm.url) {
            const url = section && !deleteConfirm.url.includes('/part-times/') ? `${deleteConfirm.url}${deleteConfirm.url.includes('?') ? '&' : '?'}section=${encodeURIComponent(section)}` : deleteConfirm.url;
            router.delete(url, { preserveScroll: true });
            setDeleteConfirm({ open: false, url: null, title: '' });
        }
    };
    const handlePartTimeDeleteConfirm = () => {
        if (partTimeDeleteConfirm.url) {
            router.delete(partTimeDeleteConfirm.url, { preserveScroll: true });
            setPartTimeDeleteConfirm({ open: false, url: null });
        }
    };
    const partTimeCategoriesColumns = [
        { name: "Student's Name", selector: (row) => row.student_name, sortable: true, minWidth: '160px' },
        { name: 'Schedule', selector: (row) => row.schedule_formatted, sortable: true, cell: (row) => row.schedule_formatted || '—', minWidth: '160px' },
        { name: 'Rate', selector: (row) => row.rate_per_hr, sortable: true, cell: (row) => formatAmount(row.rate_per_hr), minWidth: '90px' },
        { name: 'Hours', selector: (row) => row.duration_hr, sortable: true, cell: (row) => formatNumber(row.duration_hr, 2), minWidth: '90px' },
        { name: 'Amount to be Paid', selector: (row) => row.amount_to_be_paid, sortable: true, cell: (row) => row.formatted_amount ?? formatAmount(row.amount_to_be_paid), minWidth: '120px' },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setPartTimeModal({ open: true, item: row })} className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10" title="Edit" aria-label="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => setPartTimeDeleteConfirm({ open: true, url: `/part-times/${row.id}` })} className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Remove" aria-label="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];

    const partTimePaymentColumns = [
        { name: 'Date', selector: (row) => row.schedule, sortable: true, cell: (row) => row.schedule, minWidth: '140px' },
        { name: 'Student Name', selector: (row) => row.student_name, sortable: true, minWidth: '160px' },
        { name: 'Hours', selector: (row) => row.hours, sortable: true, cell: (row) => formatNumber(row.hours, 2), minWidth: '90px' },
        { name: 'Amount', selector: (row) => row.amount_paid, sortable: true, cell: (row) => row.formatted_amount ?? formatAmount(row.amount_paid), minWidth: '110px' },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setPartTimePaymentModal({ open: true, item: row })} className="p-2 rounded-lg text-[#2563EB] hover:bg-[#2563EB]/10" title="Edit" aria-label="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => setPartTimePaymentDeleteConfirm({ open: true, url: `/salary/part-time-payments/${row.id}?section=payments` })} className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" title="Remove" aria-label="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V7a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            width: '100px',
        },
    ];

    const handlePartTimePaymentDeleteConfirm = () => {
        if (partTimePaymentDeleteConfirm.url) {
            router.delete(partTimePaymentDeleteConfirm.url, { preserveScroll: true });
            setPartTimePaymentDeleteConfirm({ open: false, url: null });
        }
    };

    const showHub = !section;
    const showPaymentsOnly = section === 'payments';
    const showClassesRates = section === 'classes-rates';

    return (
        <AppLayout>
            <div className="mb-6 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    {section && (
                        <Link
                            href="/salary"
                            className="md:hidden flex items-center justify-center rounded-lg p-2 text-[#2563EB] hover:bg-[#2563EB]/10"
                            aria-label="Go back"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                    )}
                    <h1 className="text-lg font-semibold text-[#1E3A8A]">Salary</h1>
                </div>
                <p className="text-sm text-[#1E3A8A]/70 mt-0">Manage payments, classes, and rates.</p>
            </div>

            {showHub ? (
                <div className="space-y-3">
                    <p className="text-sm text-[#1E3A8A]/70">Choose a section:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SALARY_HUB_LINKS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col rounded-2xl border border-[#1E3A8A]/20 bg-white p-4 hover:bg-[#F3F4F6] hover:border-[#2563EB]/30 transition-colors"
                            >
                                <span className="text-sm font-semibold text-[#1E3A8A]">{item.name}</span>
                                <span className="text-xs text-[#1E3A8A]/60 mt-0.5">{item.description}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : showPaymentsOnly ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden min-w-0">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                            <h2 className="text-sm font-semibold text-[#1E3A8A]">Full-Time</h2>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const d = new Date();
                                        const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                                        setPdfRange({ from, to: todayYMD() });
                                        setPdfEmploymentType('full_time');
                                        setPdfModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-[#1E3A8A]/80 hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A]"
                                    title="Export PDF"
                                    aria-label="Export full-time salary list as PDF"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                <AddButton type="button" onClick={() => setPaymentModal({ open: true, item: null, employmentType: 'full_time' })} ariaLabel="New full-time payment">Add</AddButton>
                            </div>
                        </div>
                        <div className="p-4">
                            {fullTimePayments.length === 0 ? (
                                <p className="text-sm text-[#1E3A8A]/50 py-4">No full-time payments yet. Add a class and rate first, then record a payment.</p>
                            ) : (
                                <AppDataTable columns={paymentColumns} data={fullTimePayments} searchPlaceholder="Search..." paginationPerPage={10} />
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden min-w-0">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                            <h2 className="text-sm font-semibold text-[#1E3A8A]">Part-Time</h2>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const d = new Date();
                                        const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                                        setPdfRange({ from, to: todayYMD() });
                                        setPdfEmploymentType('part_time');
                                        setPdfModalOpen(true);
                                    }}
                                    className="p-2 rounded-lg text-[#1E3A8A]/80 hover:bg-[#1E3A8A]/10 hover:text-[#1E3A8A]"
                                    title="Export PDF"
                                    aria-label="Export part-time salary list as PDF"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                <AddButton type="button" onClick={() => setPartTimePaymentModal({ open: true, item: null })} ariaLabel="New part-time payment" disabled={!partTimes?.length}>
                                    Add
                                </AddButton>
                            </div>
                        </div>
                        <div className="p-4">
                            {partTimes?.length === 0 ? (
                                <p className="text-sm text-[#1E3A8A]/50 py-4">Add students in Categories → Part-Time Rates first, then record part-time payments here.</p>
                            ) : partTimePayments.length === 0 ? (
                                <p className="text-sm text-[#1E3A8A]/50 py-4">No part-time payments yet. Click Add to record a payment (date, student, hours).</p>
                            ) : (
                                <AppDataTable columns={partTimePaymentColumns} data={partTimePayments} searchPlaceholder="Search..." paginationPerPage={10} />
                            )}
                        </div>
                    </div>
                </div>
            ) : showClassesRates ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                            <h2 className="text-sm font-semibold text-[#1E3A8A]">Full Time Classes Name</h2>
                            <AddButton type="button" onClick={() => setClassModal({ open: true, item: null })} ariaLabel="New class">Add class</AddButton>
                        </div>
                        <div className="p-4">
                            {classes.length === 0 ? (
                                <p className="text-sm text-[#1E3A8A]/50 py-4">No classes yet. Add one to get started.</p>
                            ) : (
                                <AppDataTable columns={classColumns} data={classes} searchPlaceholder="Search classes..." paginationPerPage={5} />
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                            <h2 className="text-sm font-semibold text-[#1E3A8A]">Full Time Rates</h2>
                            <AddButton type="button" onClick={() => setRateModal({ open: true, item: null })} ariaLabel="New rate">New rate</AddButton>
                        </div>
                        <div className="p-4">
                            {rates.length === 0 ? (
                                <p className="text-sm text-[#1E3A8A]/50 py-4">No rates yet. Add a rate (date and hourly rate).</p>
                            ) : (
                                <AppDataTable columns={rateColumns} data={rates} searchPlaceholder="Search rates..." paginationPerPage={5} />
                            )}
                        </div>
                    </div>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="rounded-2xl border border-[#1E3A8A]/20 bg-white overflow-hidden">
                            <div className="flex justify-between items-center px-4 py-3 border-b border-[#1E3A8A]/10 bg-[#F3F4F6]">
                                <h2 className="text-sm font-semibold text-[#1E3A8A]">Part-Time Rates</h2>
                                <AddButton type="button" onClick={() => setPartTimeModal({ open: true, item: null })} ariaLabel="New part-time entry">Add</AddButton>
                            </div>
                            <div className="p-4">
                                {partTimes.length === 0 ? (
                                    <p className="text-sm text-[#1E3A8A]/50 py-4">No part-time rates yet. Add a student with schedule, rate and hours.</p>
                                ) : (
                                    <AppDataTable columns={partTimeCategoriesColumns} data={partTimes} searchPlaceholder="Search..." paginationPerPage={5} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <Modal title={classModal.item ? 'Edit class' : 'New class'} open={classModal.open} onClose={() => setClassModal({ open: false, item: null })}>
                <ClassForm initialData={classModal.item} isEdit={!!classModal.item} onClose={() => setClassModal({ open: false, item: null })} section={section} />
            </Modal>
            <Modal title={rateModal.item ? 'Edit rate' : 'New rate'} open={rateModal.open} onClose={() => setRateModal({ open: false, item: null })}>
                <RateForm initialData={rateModal.item} isEdit={!!rateModal.item} onClose={() => setRateModal({ open: false, item: null })} section={section} />
            </Modal>
            <Modal title={paymentModal.item ? 'Edit payment' : 'New payment'} open={paymentModal.open} onClose={() => setPaymentModal({ open: false, item: null, employmentType: 'full_time' })}>
                <PaymentForm initialData={paymentModal.item} isEdit={!!paymentModal.item} onClose={() => setPaymentModal({ open: false, item: null, employmentType: 'full_time' })} classes={classes} rates={rates} section={section} employmentType={paymentModal.employmentType} />
            </Modal>
            <Modal title={pdfEmploymentType === 'part_time' ? 'Export Part-Time salary list (PDF)' : 'Export Full-Time salary list (PDF)'} open={pdfModalOpen} onClose={() => setPdfModalOpen(false)}>
                <div className="space-y-4">
                    <p className="text-xs text-[#1E3A8A]/70">Select a date range to generate a PDF of {pdfEmploymentType === 'part_time' ? 'part-time' : 'full-time'} payments (by schedule date).</p>
                    <FormField label="From date" error={null}>
                        <input
                            type="date"
                            value={pdfRange.from}
                            onChange={(e) => setPdfRange((r) => ({ ...r, from: e.target.value }))}
                            className="w-full rounded-lg border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                    </FormField>
                    <FormField label="To date" error={null}>
                        <input
                            type="date"
                            value={pdfRange.to}
                            onChange={(e) => setPdfRange((r) => ({ ...r, to: e.target.value }))}
                            className="w-full rounded-lg border border-[#1E3A8A]/20 px-3 py-2 text-xs text-[#1E3A8A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        />
                    </FormField>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setPdfModalOpen(false)} className="rounded-lg border border-[#1E3A8A]/20 px-3 py-1.5 text-xs text-[#1E3A8A] hover:bg-[#1E3A8A]/10">Cancel</button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!pdfRange.from || !pdfRange.to) return;
                                const url = `/salary/export-pdf?from=${encodeURIComponent(pdfRange.from)}&to=${encodeURIComponent(pdfRange.to)}&employment_type=${encodeURIComponent(pdfEmploymentType)}`;
                                window.open(url, '_blank');
                                setPdfModalOpen(false);
                            }}
                            disabled={!pdfRange.from || !pdfRange.to}
                            className="rounded-lg bg-[#2563EB] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#1E3A8A] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate PDF
                        </button>
                    </div>
                </div>
            </Modal>
            <ConfirmModal open={deleteConfirm.open} title={deleteConfirm.title} message="Do you want to delete?" confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setDeleteConfirm({ open: false, url: null, title: '' })} />
            <Modal title={partTimeModal.item ? 'Edit part-time entry' : 'New part-time entry'} open={partTimeModal.open} onClose={() => setPartTimeModal({ open: false, item: null })}>
                <PartTimeTableForm initialData={partTimeModal.item} isEdit={!!partTimeModal.item} onClose={() => setPartTimeModal({ open: false, item: null })} />
            </Modal>
            <ConfirmModal open={partTimeDeleteConfirm.open} title="Delete part-time entry" message="Remove this entry?" confirmLabel="Delete" onConfirm={handlePartTimeDeleteConfirm} onCancel={() => setPartTimeDeleteConfirm({ open: false, url: null })} />
            <Modal title={partTimePaymentModal.item ? 'Edit part-time payment' : 'New part-time payment'} open={partTimePaymentModal.open} onClose={() => setPartTimePaymentModal({ open: false, item: null })}>
                <PartTimePaymentForm
                    initialData={partTimePaymentModal.item}
                    isEdit={!!partTimePaymentModal.item}
                    onClose={() => setPartTimePaymentModal({ open: false, item: null })}
                    partTimes={partTimes}
                    section={section}
                />
            </Modal>
            <ConfirmModal open={partTimePaymentDeleteConfirm.open} title="Delete part-time payment" message="Remove this payment?" confirmLabel="Delete" onConfirm={handlePartTimePaymentDeleteConfirm} onCancel={() => setPartTimePaymentDeleteConfirm({ open: false, url: null })} />
        </AppLayout>
    );
}
