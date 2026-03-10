<?php

namespace App\Http\Requests\CardType;

use App\Http\Requests\Concerns\FlashOpenModalOnValidationFailure;
use Illuminate\Foundation\Http\FormRequest;

class CardTypeStoreRequest extends FormRequest
{
    use FlashOpenModalOnValidationFailure;
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:card_types,name'],
        ];
    }
}
