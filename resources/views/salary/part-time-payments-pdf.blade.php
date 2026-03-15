<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Part-Time Salary Payments {{ $from }} to {{ $to }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1E3A8A; }
        h1 { font-size: 14px; margin-bottom: 4px; }
        .meta { font-size: 9px; color: #666; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #1E3A8A; padding: 5px 6px; text-align: left; }
        th { background: #E5E7EB; font-weight: 600; }
        tr:nth-child(even) { background: #F9FAFB; }
        .total { font-weight: 600; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Part-Time Salary Payments</h1>
    <p class="meta">From {{ $from }} to {{ $to }}</p>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Hours</th>
                <th>Rate per hr</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payments as $row)
            <tr>
                <td>{{ $row['schedule'] ?? '—' }}</td>
                <td>{{ $row['student_name'] ?? '—' }}</td>
                <td>{{ number_format($row['hours'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ number_format($row['rate_per_hr'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ number_format($row['amount_paid'] ?? 0, 2, '.', ',') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5">No part-time payments in this date range.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    @if(count($payments) > 0)
    <p class="total">Total: {{ number_format($totalAmount, 2, '.', ',') }}</p>
    @endif
</body>
</html>
