<?php

namespace App\Http\Requests\Card;

use App\Http\Requests\Concerns\FlashOpenModalOnValidationFailure;
use Illuminate\Foundation\Http\FormRequest;

class CardStoreRequest extends FormRequest
{
    use FlashOpenModalOnValidationFailure;
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('card_type_id') && $this->card_type_id === '') {
            $this->merge(['card_type_id' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['nullable', 'string', 'max:255'],
            'card_type_id' => ['nullable', 'integer', 'exists:card_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'last_four' => ['nullable', 'digits:4'],
            'limit' => ['required', 'numeric', 'min:0'],
            'statement_day' => ['nullable', 'integer', 'between:1,31'],
            'due_day' => ['nullable', 'integer', 'between:1,31'],
            'is_active' => ['boolean'],
            'color' => ['nullable', 'string', 'in:red,blue,black,platinum,yellow,green'],
        ];
    }
}

