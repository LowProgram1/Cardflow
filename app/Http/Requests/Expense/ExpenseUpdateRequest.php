<?php

namespace App\Http\Requests\Expense;

use App\Http\Requests\Concerns\FlashOpenModalOnValidationFailure;
use Illuminate\Foundation\Http\FormRequest;

class ExpenseUpdateRequest extends FormRequest
{
    use FlashOpenModalOnValidationFailure;
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('expense_type_id') && $this->expense_type_id === '') {
            $merge['expense_type_id'] = null;
        }
        if ($this->has('payment_term_id') && $this->payment_term_id === '') {
            $merge['payment_term_id'] = null;
        }
        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $paymentType = $this->input('payment_type', 'full');

        $rules = [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'card_id' => ['required', 'integer', 'exists:cards,id'],
            'expense_type_id' => ['nullable', 'integer', 'exists:expense_types,id'],
            'description' => ['nullable', 'string', 'max:500'],
            'type' => ['nullable', 'in:expense,payment'],
            'payment_type' => ['required', 'in:full,installment'],
            'transaction_date' => ['required', 'date'],
            'category' => ['nullable', 'string', 'max:100'],
        ];

        if ($paymentType === 'full') {
            $rules['amount'] = ['required', 'numeric', 'min:0.01'];
        } else {
            $rules['payment_term_id'] = ['required', 'integer', 'exists:payment_terms,id'];
            $rules['monthly_amortization'] = ['required', 'numeric', 'min:0.01'];
        }

        return $rules;
    }
}

