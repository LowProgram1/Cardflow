<?php

namespace App\Http\Requests\User;

use App\Http\Requests\Concerns\FlashOpenModalOnValidationFailure;
use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    use FlashOpenModalOnValidationFailure;
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', 'in:admin,user'],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', 'exists:features,id'],
        ];
    }
}

