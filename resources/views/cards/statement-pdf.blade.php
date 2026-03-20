<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Statement of Account — {{ $card->name }}</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1f2937;
            margin: 0;
            background: #ffffff;
        }
        .page {
            width: 100%;
            background: #ffffff;
        }
        .header {
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .bank-name {
            font-size: 18px;
            font-weight: 700;
            color: #1e40af;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .bank-sub {
            margin: 2px 0 0;
            color: #6b7280;
            font-size: 9px;
        }
        .statement-title {
            margin: 8px 0 0;
            font-size: 14px;
            font-weight: 700;
            color: #111827;
        }
        .grid {
            width: 100%;
            margin-bottom: 10px;
            border: 1px solid #d1d5db;
            border-collapse: collapse;
        }
        .grid td {
            border: 1px solid #e5e7eb;
            padding: 6px 8px;
            vertical-align: top;
        }
        .label {
            color: #6b7280;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            display: block;
            margin-bottom: 2px;
        }
        .value {
            color: #111827;
            font-size: 10px;
            font-weight: 600;
        }
        table.tx {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 6px;
        }
        .tx th {
            text-align: left;
            background: #f3f4f6;
            color: #111827;
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            font-size: 9px;
        }
        .tx td {
            border: 1px solid #e5e7eb;
            padding: 6px 8px;
            font-size: 9px;
        }
        .amount { text-align: right; white-space: nowrap; }
        .section-title {
            margin: 12px 0 4px;
            font-size: 11px;
            font-weight: 700;
            color: #111827;
        }
        .totals {
            width: 45%;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .totals td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            font-size: 9px;
        }
        .totals .head {
            background: #f3f4f6;
            font-weight: 700;
        }
        .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 8px;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <p class="bank-name">CardFlow Bank Services</p>
            <p class="bank-sub">Credit Card Billing and Statement Services</p>
            <p class="statement-title">Statement of Account</p>
        </div>

        <table class="grid">
            <tr>
                <td style="width: 50%;">
                    <span class="label">Cardholder</span>
                    <span class="value">{{ $userName }}</span>
                </td>
                <td style="width: 50%;">
                    <span class="label">Card</span>
                    <span class="value">{{ $card->name }} @if($card->last_four) •••• {{ $card->last_four }} @endif</span>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="label">Statement Month</span>
                    <span class="value">{{ $statementMonthLabel ?? '—' }}</span>
                </td>
                <td>
                    <span class="label">Statement Period</span>
                    <span class="value">{{ $periodStart }} - {{ $periodEnd }}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span class="label">Payment Due Date</span>
                    <span class="value">{{ $dueDateLabel }}</span>
                </td>
            </tr>
        </table>

        <p class="section-title">Monthly Transactions</p>
        <table class="tx">
            <thead>
                <tr>
                    <th style="width: 18%;">Posted Date</th>
                    <th style="width: 30%;">Description</th>
                    <th style="width: 12%;">Type</th>
                    <th style="width: 12%;">Status</th>
                    <th style="width: 14%;" class="amount">Amount</th>
                    <th style="width: 14%;" class="amount">Paid Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse(($timeline ?? $transactions) as $row)
                <tr>
                    <td>{{ $row['date'] }}</td>
                    <td>{{ $row['description'] }}</td>
                    <td>{{ ucfirst((string) ($row['type'] ?? '')) }}</td>
                    <td>{{ $row['status'] ?? (((float) ($row['amount'] ?? 0)) > 0 ? 'Unpaid' : 'Paid') }}</td>
                    <td class="amount">{{ $row['formatted_amount'] }}</td>
                    <td class="amount">{{ $row['formatted_paid_amount'] ?? \App\Helpers\CurrencyHelper::formatCurrency((float) ($row['paid_amount'] ?? 0)) }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280;">No transactions in this billing period.</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <table class="totals">
            <tr>
                <td class="head">Total Payments</td>
                <td class="amount">{{ \App\Helpers\CurrencyHelper::formatCurrency($paymentTotal) }}</td>
            </tr>
        </table>

        <div class="footer">
            This Statement of Account is system-generated and based on transactions recorded within the selected statement period.
            <br>
            Generated on {{ now()->format('F j, Y h:i A') }}.
        </div>
    </div>
</body>
</html>
