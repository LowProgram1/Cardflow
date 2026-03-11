<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response as InertiaResponse;

class SettingsController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $role = $user->role ?? 'admin';
        $isAdmin = $role === 'admin';
        $section = $request->query('section', 'profile');

        if (! $isAdmin) {
            $section = 'profile'; // Non-admin can only access profile
        }

        $payload = [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
            'section' => $section,
            'isAdmin' => $isAdmin,
        ];

        if ($isAdmin) {
            $payload['cardTypes'] = \App\Models\CardType::query()->orderBy('name')->get(['id', 'name']);
            $payload['expenseTypes'] = \App\Models\ExpenseType::query()->orderBy('name')->get(['id', 'name']);
            $payload['paymentTerms'] = \App\Models\PaymentTerm::query()->orderBy('months')->get(['id', 'months']);
        }

        return $this->inertia('Settings/Index', $payload);
    }

    /**
     * Upload CardFlow favicon (admin only). Accepts .ico only.
     */
    public function updateFavicon(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'favicon' => [
                'required',
                'file',
                'mimes:ico',
                'max:1024', // 1MB
                'mimetypes:image/x-icon,image/vnd.microsoft.icon',
            ],
        ], [
            'favicon.required' => 'Please select a .ico file.',
            'favicon.mimes' => 'Only .ico (favicon) files are allowed.',
            'favicon.mimetypes' => 'Only favicon (.ico) files are allowed.',
        ]);

        $request->file('favicon')->move(public_path(), 'favicon.ico');

        return redirect()->route('settings.index', ['section' => 'profile'])->with('flash', [
            'type' => 'success',
            'message' => 'CardFlow favicon updated successfully.',
        ]);
    }
}
