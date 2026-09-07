<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class DashboardController extends Controller
{
    #[OA\Get(path: '/api/dashboard/statistics', summary: 'Estadísticas del dashboard', tags: ['Dashboard'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'OK')])]
    public function statistics(DashboardService $dashboard): JsonResponse
    {
        return response()->json(['data' => $dashboard->statistics()]);
    }
}