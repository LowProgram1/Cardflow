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
        $data = $this->dashboard->dashboardData();

        return $this->inertia('Dashboard', $data);
    }
}

