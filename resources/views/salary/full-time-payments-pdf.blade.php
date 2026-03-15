<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Full-time Salary Payment {{ $from }} to {{ $to }}</title>
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
    <h1>Full-time Salary Payment</h1>
    <p class="meta">From {{ $from }} to {{ $to }}</p>

    <table>
        <thead>
            <tr>
                <th>Class</th>
                <th>Duration</th>
                <th>Schedule</th>
                <th>Minutes</th>
                <th>Hours</th>
                <th>Standard Rate</th>
                <th>Extra Amount</th>
                <th>Urgent Rate</th>
                <th>Amount Paid</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payments as $row)
            <tr>
                <td>{{ $row['class_name'] ?? '—' }}</td>
                <td>{{ $row['duration'] ?? '—' }}</td>
                <td>{{ $row['schedule'] ?? '—' }}</td>
                <td>{{ $row['minutes'] ?? 0 }}</td>
                <td>{{ number_format($row['hours'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ !empty($row['use_urgent_rate']) ? '—' : number_format($row['standard_rate'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ number_format($row['extra_amount'] ?? 0, 2, '.', ',') }}</td>
                <td>{{ !empty($row['use_urgent_rate']) ? number_format($row['urgent_rate'] ?? 0, 2, '.', ',') : '—' }}</td>
                <td>{{ number_format($row['amount_paid_display'] ?? 0, 2, '.', ',') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="9">No payments in this date range.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    @if($payments->isNotEmpty())
    <p class="total">Total: {{ number_format($totalAmount, 2, '.', ',') }}</p>
    @endif
</body>
</html>
