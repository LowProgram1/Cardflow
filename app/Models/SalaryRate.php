<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryRate extends Model
{
    protected $table = 'salary_rates';

    protected $fillable = [
        'user_id',
        'rate_date',
        'hourly_rate',
        'urgent_rate',
    ];

    protected function casts(): array
    {
        return [
            'rate_date' => 'date',
            'hourly_rate' => 'decimal:2',
            'urgent_rate' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalaryPayment::class, 'salary_rate_id');
    }
}
