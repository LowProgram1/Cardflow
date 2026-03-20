<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Full-Time Billing Statement {{ $from }} to {{ $to }}</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1f2937; margin: 0; background: #fff; }
        .header { border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 12px; }
        .brand { font-size: 18px; font-weight: 700; color: #1e40af; margin: 0; letter-spacing: 0.3px; }
        .subtitle { margin: 2px 0 0; font-size: 9px; color: #6b7280; }
        .title { margin: 8px 0 0; font-size: 14px; font-weight: 700; color: #111827; }
        .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .meta-grid td { border: 1px solid #d1d5db; padding: 6px 8px; }
        .label { display: block; font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
        .value { font-size: 10px; font-weight: 600; color: #111827; }
        table.tx { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .tx th { border: 1px solid #d1d5db; padding: 6px 8px; background: #f3f4f6; text-align: left; font-size: 9px; }
        .tx td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 9px; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { width: 42%; margin-left: auto; border-collapse: collapse; margin-top: 10px; }
        .totals td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 9px; }
        .totals .head { background: #f3f4f6; font-weight: 700; }
        .footer { margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 8px; color: #6b7280; font-size: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <p class="brand">CardFlow Payroll Services</p>
        <p class="subtitle">Full-Time Billing and Compensation Records</p>
        <p class="title">Full-Time Billing Statement</p>
    </div>

    <table class="meta-grid">
        <tr>
            <td style="width: 34%;">
                <span class="label">Teacher Name</span>
                <span class="value">{{ $teacherName ?? '—' }}</span>
            </td>
            <td style="width: 33%;">
                <span class="label">Class ID</span>
                <span class="value">{{ $classId ?? 'All classes' }}</span>
            </td>
            <td style="width: 33%;">
                <span class="label">Date Range</span>
                <span class="value">{{ \Carbon\Carbon::parse($from)->format('M-d-Y') }} to {{ \Carbon\Carbon::parse($to)->format('M-d-Y') }}</span>
            </td>
        </tr>
    </table>

    <table class="tx">
        <thead>
            <tr>
                <th>Class</th>
                <th>Duration</th>
                <th>Posted Date</th>
                <th>Minutes</th>
                <th>Hours</th>
                <th>Standard Rate</th>
                <th>Extra Amount</th>
                <th>Urgent Rate</th>
                <th class="amount">Amount Paid</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payments as $row)
            <tr>
                <td>{{ $row['class_name'] ?? '—' }}</td>
                <td>{{ $row['duration'] ?? '—' }}</td>
                <td>{{ !empty($row['schedule_date']) ? \Carbon\Carbon::parse($row['schedule_date'])->format('M-d-Y') : '—' }}</td>
                <td>{{ $row['minutes'] ?? 0 }}</td>
                <td>{{ number_format($row['hours'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ !empty($row['use_urgent_rate']) ? '—' : number_format($row['standard_rate'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ number_format($row['extra_amount'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ !empty($row['use_urgent_rate']) ? number_format($row['urgent_rate'] ?? 0, 2, '.', ',') : '—' }}</td>
                <td class="amount">{{ number_format($row['amount_paid_display'] ?? 0, 2, '.', ',') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="9" style="text-align:center;color:#6b7280">No payments in this date range.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="head">Total Amount</td>
            <td class="amount">{{ number_format($totalAmount, 2, '.', ',') }}</td>
        </tr>
    </table>

    <div class="footer">
        Generated on {{ now()->format('F j, Y h:i A') }}. This statement is system-generated.
    </div>
</body>
</html>
