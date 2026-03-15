<?php

namespace App\Http\Requests\PartTime;

use Illuminate\Foundation\Http\FormRequest;

class PartTimeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_name' => ['required', 'string', 'max:255'],
            'schedule_days' => ['required', 'array'],
            'schedule_days.*' => ['string', 'in:mon,tue,wed,thu,fri,sat,sun'],
            'rate_per_hr' => ['required', 'numeric', 'min:0'],
            'duration_hr' => ['required', 'numeric', 'min:0'],
        ];
    }
}
