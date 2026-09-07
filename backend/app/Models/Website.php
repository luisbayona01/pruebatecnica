<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Website extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'user_id',
        'name',
        'url',
        'description',
        'favicon',
        'is_favorite',
    ];

    protected function casts(): array
    {
        return ['is_favorite' => 'boolean'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ---- Query scopes -------------------------------------------------

    /**
     * Registros visibles únicamente para el usuario autenticado.
     * Aislamiento estricto por usuario (multi-tenancy).
     */
    public function scopeVisibleTo(Builder $query, ?int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (blank($term)) {
            return $query;
        }

        $term = trim($term);

        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('url', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%");
        });
    }

    public function scopeCategory(Builder $query, ?int $categoryId): Builder
    {
        return $query->when($categoryId, fn (Builder $q) => $q->where('category_id', $categoryId));
    }

    public function scopeFavorite(Builder $query, ?bool $favorite): Builder
    {
        return $query->when(! is_null($favorite), fn (Builder $q) => $q->where('is_favorite', $favorite));
    }

    public function scopeSorted(Builder $query, string $sort = 'created_at', string $dir = 'desc'): Builder
    {
        $sort = in_array($sort, ['name', 'created_at', 'category_id'], true) ? $sort : 'created_at';
        $dir = strtolower($dir) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $dir)->orderBy('id');
    }
}
