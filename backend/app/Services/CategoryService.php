<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class CategoryService
{
    /**
     * Lista categorías con el número de sitios asociados.
     */
    public function all()
    {
        // websites_count lo mantiene un trigger de la BD (desnormalización).
        return Category::query()
            ->visibleTo(Auth::id())
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): Category
    {
        $data['user_id'] = Auth::id();

        return Category::create($data);
    }

    /**
     * Regla de negocio: una categoría con sitios asociados NO puede eliminarse.
     * Protegida además por la FK (restrictOnDelete) como red de seguridad.
     *
     * @throws ConflictHttpException 409 si la categoría tiene sitios.
     */
    public function delete(Category $category): void
    {
        $count = $category->websites()->count();

        if ($count > 0) {
            throw new ConflictHttpException(
                'No se puede eliminar la categoría porque tiene sitios asociados.'
            );
        }

        try {
            $category->delete();
        } catch (QueryException $e) {
            // Defensa en profundidad ante una condición de carrera con la FK.
            throw new ConflictHttpException(
                'No se puede eliminar la categoría porque tiene sitios asociados.',
                $e
            );
        }
    }
}
