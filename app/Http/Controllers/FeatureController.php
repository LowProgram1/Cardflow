<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use Illuminate\Http\JsonResponse;

class FeatureController extends Controller
{
    /**
     * Return all features (for Feature Manager UI).
     */
    public function index(): JsonResponse
    {
        $features = Feature::orderBy('display_name')->get(['id', 'name', 'display_name']);

        return response()->json(['features' => $features]);
    }
}
