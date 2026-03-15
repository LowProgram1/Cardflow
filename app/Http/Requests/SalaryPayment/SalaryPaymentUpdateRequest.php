<?php

namespace App\Http\Requests\SalaryPayment;

use Illuminate\Foundation\Http\FormRequest;

class SalaryPaymentUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'salary_class_id' => ['required', 'integer', 'exists:salary_classes,id'],
            'salary_rate_id' => ['required', 'integer', 'exists:salary_rates,id'],
            'employment_type' => ['nullable', 'string', 'in:full_time,part_time'],
            'schedule' => ['required', 'date'],
            'time_start' => ['required', 'date_format:H:i'],
            'time_end' => ['required', 'date_format:H:i', 'after:time_start'],
            'minutes' => ['required', 'integer', 'min:0'],
            'extra_amount' => ['nullable', 'numeric', 'min:0'],
            'use_urgent_rate' => ['boolean'],
        ];
    }
}
