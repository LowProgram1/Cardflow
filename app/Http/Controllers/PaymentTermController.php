<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentTerm\PaymentTermStoreRequest;
use App\Http\Requests\PaymentTerm\PaymentTermUpdateRequest;
use App\Models\PaymentTerm;
use Illuminate\Http\RedirectResponse;

class PaymentTermController extends Controller
{
    public function store(PaymentTermStoreRequest $request): RedirectResponse
    {
        PaymentTerm::query()->create($request->validated());

        return redirect()->route('settings.index', ['section' => 'payment-terms'])->with('flash', [
            'type' => 'success',
            'message' => 'Payment term created successfully.',
        ]);
    }

    public function update(PaymentTermUpdateRequest $request, PaymentTerm $payment_term): RedirectResponse
    {
        $payment_term->update($request->validated());

        return redirect()->route('settings.index', ['section' => 'payment-terms'])->with('flash', [
            'type' => 'success',
            'message' => 'Payment term updated successfully.',
        ]);
    }

    public function destroy(PaymentTerm $payment_term): RedirectResponse
    {
        $payment_term->delete();

        return redirect()->route('settings.index', ['section' => 'payment-terms'])->with('flash', [
            'type' => 'delete',
            'message' => 'Payment term removed.',
        ]);
    }
}
