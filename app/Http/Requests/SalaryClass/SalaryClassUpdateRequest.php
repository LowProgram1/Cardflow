<?php

namespace App\Http\Requests\SalaryClass;

use Illuminate\Foundation\Http\FormRequest;

class SalaryClassUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_name' => ['required', 'string', 'max:255'],
        ];
    }
}
