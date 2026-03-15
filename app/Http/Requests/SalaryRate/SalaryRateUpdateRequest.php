<?php

namespace App\Http\Requests\SalaryRate;

use Illuminate\Foundation\Http\FormRequest;

class SalaryRateUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rate = $this->route('salary_rate');
        $minDate = $rate ? $rate->rate_date->format('Y-m-d') : 'today';

        return [
            'rate_date' => ['required', 'date', 'after_or_equal:' . $minDate],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'urgent_rate' => ['required', 'numeric', 'min:0'],
        ];
    }
}
