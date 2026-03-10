<?php

namespace App\Http\Controllers;

use App\Models\CardType;
use App\Models\ExpenseType;
use App\Models\PaymentTerm;
use Illuminate\Http\Request;
use Inertia\Response as InertiaResponse;

class SettingsController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        return $this->inertia('Settings/Index', [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
            'cardTypes' => CardType::query()->orderBy('name')->get(['id', 'name']),
            'expenseTypes' => ExpenseType::query()->orderBy('name')->get(['id', 'name']),
            'paymentTerms' => PaymentTerm::query()->orderBy('months')->get(['id', 'months']),
            'section' => $request->query('section', 'profile'),
        ]);
    }
}
