<?php

namespace App\Http\Controllers;

use App\Services\Contracts\DashboardServiceInterface;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardServiceInterface $dashboard,
    ) {
    }

    public function index(): InertiaResponse
    {
        $user = auth()->user();
        $userId = ($user->role ?? '') === 'admin' ? null : $user->id;
        $data = $this->dashboard->dashboardData($userId, (int) $user->id);
        $isAdmin = ($user->role ?? '') === 'admin';
        $canViewCards = $isAdmin || $user->hasFeature('cards');
        $canViewExpenses = $isAdmin || $user->hasFeature('expense_tracker');

        if (! $canViewCards) {
            $data['cards'] = [];
            $data['remainingByCard'] = [];
        }

        if (! $canViewExpenses) {
            $data['installmentExpenses'] = [];
            $data['transactionHistory'] = [];
            $data['installmentSummary'] = [
                'total_paid' => 0,
                'total_remaining' => 0,
                'formatted_total_paid' => '₱0.00',
                'formatted_total_remaining' => '₱0.00',
                'monthlyRows' => [],
                'monthlyTotals' => [],
            ];
            $data['metrics']['total_outstanding'] = 0.0;
            $data['metrics']['formatted_total_outstanding'] = '₱0.00';
        }

        $data['isAdmin'] = $isAdmin;
        $data['canViewCards'] = $canViewCards;
        $data['canViewExpenses'] = $canViewExpenses;

        return $this->inertia('Dashboard', $data);
    }
}

