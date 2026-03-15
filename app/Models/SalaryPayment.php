<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryPayment extends Model
{
    protected $table = 'salary_payments';

    protected $fillable = [
        'salary_class_id',
        'salary_rate_id',
        'employment_type',
        'schedule',
        'time_start',
        'time_end',
        'minutes',
        'extra_amount',
        'use_urgent_rate',
        'amount_paid',
    ];

    protected function casts(): array
    {
        return [
            'schedule' => 'date',
            'minutes' => 'integer',
            'extra_amount' => 'decimal:2',
            'use_urgent_rate' => 'boolean',
            'amount_paid' => 'decimal:2',
        ];
    }

    public function salaryClass(): BelongsTo
    {
        return $this->belongsTo(SalaryClass::class);
    }

    public function salaryRate(): BelongsTo
    {
        return $this->belongsTo(SalaryRate::class);
    }
}
