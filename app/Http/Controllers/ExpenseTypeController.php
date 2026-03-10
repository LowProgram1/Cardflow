<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseType\ExpenseTypeStoreRequest;
use App\Http\Requests\ExpenseType\ExpenseTypeUpdateRequest;
use App\Models\ExpenseType;
use Illuminate\Http\RedirectResponse;

class ExpenseTypeController extends Controller
{
    public function store(ExpenseTypeStoreRequest $request): RedirectResponse
    {
        ExpenseType::query()->create($request->validated());

        return redirect()->route('settings.index', ['section' => 'expense-types'])->with('flash', [
            'type' => 'success',
            'message' => 'Expense type created successfully.',
        ]);
    }

    public function update(ExpenseTypeUpdateRequest $request, ExpenseType $expense_type): RedirectResponse
    {
        $expense_type->update($request->validated());

        return redirect()->route('settings.index', ['section' => 'expense-types'])->with('flash', [
            'type' => 'success',
            'message' => 'Expense type updated successfully.',
        ]);
    }

    public function destroy(ExpenseType $expense_type): RedirectResponse
    {
        $expense_type->delete();

        return redirect()->route('settings.index', ['section' => 'expense-types'])->with('flash', [
            'type' => 'delete',
            'message' => 'Expense type removed.',
        ]);
    }
}
