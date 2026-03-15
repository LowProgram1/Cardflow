<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statement of Account — {{ $card->name }}</title>
    <style>
        body { font-family: system-ui, sans-serif; font-size: 12px; color: #1e3a8a; max-width: 800px; margin: 0 auto; padding: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .amount { text-align: right; }
        .footer { margin-top: 32px; font-size: 11px; color: #64748b; }
        @media print { body { padding: 16px; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 16px;">
        <button type="button" onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">Download / Print PDF</button>
    </div>

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
    <h2 style="font-size: 14px; margin-top: 20px; margin-bottom: 8px;">Payment history</h2>
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
        Generated on {{ now()->format('F j, Y') }}. Use your browser’s Print option and “Save as PDF” to download.
    </div>

    <script>
        // Optional: auto-open print dialog when opened in new window for PDF
        if (window.location.search.indexOf('print=1') !== -1) {
            window.onload = function() { window.print(); };
        }
    </script>
</body>
</html>
