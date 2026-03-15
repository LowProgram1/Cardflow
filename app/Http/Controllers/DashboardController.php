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
        $data['isAdmin'] = ($user->role ?? '') === 'admin';

        return $this->inertia('Dashboard', $data);
    }
}

