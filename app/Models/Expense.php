<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_id',
        'user_id',
        'created_by',
        'expense_type_id',
        'description',
        'amount',
        'monthly_amortization',
        'type',
        'payment_type',
        'payment_term_id',
        'transaction_date',
        'paid_months',
        'paid_month_amounts',
        'last_paid_at',
        'category',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'monthly_amortization' => 'decimal:2',
        'transaction_date' => 'date',
        'paid_months' => 'array',
        'paid_month_amounts' => 'array',
        'last_paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function card()
    {
        return $this->belongsTo(Card::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeAdminCreated($query, ?array $adminIds)
    {
        if ($adminIds === null || $adminIds === []) {
            return $query;
        }

        return $query->where(function ($q) use ($adminIds) {
            $q->whereNull('created_by')->orWhereIn('created_by', $adminIds);
        });
    }

    public function expenseType()
    {
        return $this->belongsTo(ExpenseType::class);
    }

    public function paymentTerm()
    {
        return $this->belongsTo(PaymentTerm::class);
    }
}

