<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Obtiene las estadísticas del dashboard desde el procedimiento
     * almacenado GetDashboardStats(user_id), aislado por usuario.
     */
    public function statistics(): array
    {
        $row = DB::selectOne('CALL GetDashboardStats(?)', [Auth::id()]);

        return [
            'total_websites' => (int) $row->total_websites,
            'total_categories' => (int) $row->total_categories,
            'total_favorites' => (int) $row->total_favorites,
            'top_category' => $row->top_category_name
                ? ['name' => $row->top_category_name, 'count' => (int) $row->top_category_count]
                : null,
        ];
    }
}