<?php

namespace App\Services;

use App\Models\Website;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WebsiteService
{
    /**
     * Listado paginado con búsqueda, filtros y ordenación (todo en backend).
     */
    public function paginate(Request $request): LengthAwarePaginator
    {
        $perPage = min(max((int) $request->integer('per_page', 12), 1), 100);

        return Website::query()
            ->with('category')
            ->visibleTo(Auth::id())
            ->search($request->query('search'))
            ->category($request->integer('category_id') ?: null)
            ->favorite($this->favoriteFilter($request))
            ->sorted(
                (string) $request->query('sort', 'created_at'),
                (string) $request->query('dir', 'desc')
            )
            ->paginate($perPage);
    }

    public function create(array $data): Website
    {
        $data['user_id'] = Auth::id();

        $website = Website::create($data);

        return $website->load('category');
    }

    public function update(Website $website, array $data): Website
    {
        $website->update($data);

        return $website->refresh()->load('category');
    }

    public function toggleFavorite(Website $website): Website
    {
        $website->update(['is_favorite' => ! $website->is_favorite]);

        return $website->refresh()->load('category');
    }

    public function delete(Website $website): void
    {
        $website->delete();
    }

    private function favoriteFilter(Request $request): ?bool
    {
        if (! $request->has('is_favorite')) {
            return null;
        }

        return filter_var($request->query('is_favorite'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
}
