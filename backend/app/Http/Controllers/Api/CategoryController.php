<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categories) {}

    #[OA\Get(path: '/api/categories', summary: 'Listar categorías (con número de sitios)', tags: ['Categories'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'OK')])]
    public function index(): AnonymousResourceCollection
    {
        return CategoryResource::collection($this->categories->all());
    }

    #[OA\Post(path: '/api/categories', summary: 'Crear categoría', tags: ['Categories'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 201, description: 'OK')])]
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categories->create($request->validated());

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Delete(path: '/api/categories/{id}', summary: 'Eliminar categoría (409 si tiene sitios)', tags: ['Categories'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 204, description: 'OK'), new OA\Response(response: 409, description: 'Tiene sitios asociados')])]
    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $this->categories->delete($category);

        return response()->json(null, 204);
    }
}
