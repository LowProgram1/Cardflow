<?php

namespace App\Http\Requests\SalaryRate;

use Illuminate\Foundation\Http\FormRequest;

class SalaryRateStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rate_date' => ['required', 'date', 'after_or_equal:today'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'urgent_rate' => ['required', 'numeric', 'min:0'],
        ];
    }
}
