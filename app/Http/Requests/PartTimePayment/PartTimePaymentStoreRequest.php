<?php

namespace App\Http\Requests\PartTimePayment;

use Illuminate\Foundation\Http\FormRequest;

class PartTimePaymentStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'part_time_id' => ['required', 'integer', 'exists:part_times,id'],
            'schedule' => ['required', 'date'],
            'hours' => ['required', 'numeric', 'min:0'],
        ];
    }
}
