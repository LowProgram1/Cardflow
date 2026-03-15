<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartTime extends Model
{
    protected $fillable = [
        'student_name',
        'schedule',
        'schedule_days',
        'rate_per_hr',
        'duration_hr',
        'amount_to_be_paid',
    ];

    protected $casts = [
        'schedule' => 'date',
        'schedule_days' => 'array',
        'rate_per_hr' => 'decimal:2',
        'duration_hr' => 'decimal:2',
        'amount_to_be_paid' => 'decimal:2',
    ];

    public static function formatScheduleDays(?array $days): string
    {
        if (empty($days)) {
            return '—';
        }
        $labels = ['mon' => 'Mon', 'tue' => 'Tue', 'wed' => 'Wed', 'thu' => 'Thu', 'fri' => 'Fri', 'sat' => 'Sat', 'sun' => 'Sun'];
        $order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $out = [];
        foreach ($order as $key) {
            if (in_array($key, $days, true)) {
                $out[] = $labels[$key];
            }
        }
        return implode(', ', $out);
    }

    public static function computeAmount(float $ratePerHr, float $durationHr): float
    {
        return round($ratePerHr * $durationHr, 2);
    }

    public function partTimePayments(): HasMany
    {
        return $this->hasMany(PartTimePayment::class);
    }
}
