<?php

namespace App\Http\Requests\PaymentTerm;

use App\Http\Requests\Concerns\FlashOpenModalOnValidationFailure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentTermUpdateRequest extends FormRequest
{
    use FlashOpenModalOnValidationFailure;
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'months' => [
                'required',
                'integer',
                'min:1',
                'max:120',
                Rule::unique('payment_terms', 'months')->ignore($this->route('payment_term')),
            ],
        ];
    }
}
