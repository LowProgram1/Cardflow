<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Statement of Account — {{ $card->name }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #1e3a8a; margin: 0; padding: 16px; }
        h1 { font-size: 14px; margin-bottom: 4px; }
        .meta { font-size: 9px; color: #555; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .amount { text-align: right; }
        .footer { margin-top: 20px; font-size: 9px; color: #64748b; }
    </style>
</head>
<body>
    <h1>Statement of Account</h1>
    <p class="meta">{{ $card->name }} @if($card->last_four) •••• {{ $card->last_four }} @endif</p>
    <p class="meta"><strong>Cardholder:</strong> {{ $userName }}</p>
    <p class="meta"><strong>Billing period:</strong> {{ $periodStart }} – {{ $periodEnd }}</p>
    <p class="meta"><strong>Payment due date:</strong> {{ $dueDateLabel }}</p>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th class="amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $row)
            <tr>
                <td>{{ $row['date'] }}</td>
                <td>{{ $row['description'] }}</td>
                <td>{{ ucfirst($row['type']) }}</td>
                <td class="amount">{{ $row['formatted_amount'] }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #64748b;">No transactions in this period.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    @if(isset($paymentHistory) && count($paymentHistory) > 0)
    <h2 style="font-size: 12px; margin-top: 16px; margin-bottom: 6px;">Payment history</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th class="amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($paymentHistory as $row)
            <tr>
                <td>{{ $row['date'] }}</td>
                <td>{{ $row['description'] }}</td>
                <td class="amount">{{ $row['formatted_amount'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        Generated on {{ now()->format('F j, Y') }}.
    </div>
</body>
</html>
