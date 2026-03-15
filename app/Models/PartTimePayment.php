<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartTimePayment extends Model
{
    protected $table = 'part_time_payments';

    protected $fillable = [
        'user_id',
        'part_time_id',
        'schedule',
        'hours',
        'amount_paid',
    ];

    protected function casts(): array
    {
        return [
            'schedule' => 'date',
            'hours' => 'decimal:2',
            'amount_paid' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function partTime(): BelongsTo
    {
        return $this->belongsTo(PartTime::class);
    }
}
