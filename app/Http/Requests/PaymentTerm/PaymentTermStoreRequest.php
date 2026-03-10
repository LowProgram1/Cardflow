<?php

namespace App\Http\Requests\PaymentTerm;

use App\Http\Requests\Concerns\FlashOpenModalOnValidationFailure;
use Illuminate\Foundation\Http\FormRequest;

class PaymentTermStoreRequest extends FormRequest
{
    use FlashOpenModalOnValidationFailure;
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'months' => ['required', 'integer', 'min:1', 'max:120', 'unique:payment_terms,months'],
        ];
    }
}
