<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Contracts\Validation\Validator;

trait FlashOpenModalOnValidationFailure
{
    protected function failedValidation(Validator $validator): void
    {
        $route = $this->route();
        $name = $route ? $route->getName() : '';
        $context = null;
        $id = null;

        if (preg_match('/^expenses\.(store|update)$/', $name)) {
            $context = 'expenses';
            $id = $route->parameter('expense')?->id ?? null;
        } elseif (preg_match('/^users\.(store|update)$/', $name)) {
            $context = 'users';
            $id = $route->parameter('user')?->id ?? null;
        } elseif (preg_match('/^cards\.(store|update)$/', $name)) {
            $context = 'cards';
            $id = $route->parameter('card')?->id ?? null;
        } elseif (preg_match('/^card-types\.(store|update)$/', $name)) {
            $context = 'card-types';
            $id = $route->parameter('card_type')?->id ?? null;
        } elseif (preg_match('/^expense-types\.(store|update)$/', $name)) {
            $context = 'expense-types';
            $id = $route->parameter('expense_type')?->id ?? null;
        } elseif (preg_match('/^payment-terms\.(store|update)$/', $name)) {
            $context = 'payment-terms';
            $id = $route->parameter('payment_term')?->id ?? null;
        }

        if ($context !== null) {
            $this->session()->flash('openModal', ['context' => $context, 'id' => $id]);
        }

        $this->session()->flash('flash', [
            'type' => 'error',
            'message' => 'Please correct the errors below.',
        ]);

        parent::failedValidation($validator);
    }
}
