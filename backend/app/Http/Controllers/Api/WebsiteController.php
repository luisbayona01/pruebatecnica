<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWebsiteRequest;
use App\Http\Requests\UpdateWebsiteRequest;
use App\Http\Resources\WebsiteResource;
use App\Models\Website;
use App\Services\WebsiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;

class WebsiteController extends Controller
{
    public function __construct(private readonly WebsiteService $websites) {}

    #[OA\Get(
        path: '/api/websites',
        summary: 'Listar sitios (búsqueda, filtros, orden y paginación)',
        tags: ['Websites'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'category_id', in: 'query', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'is_favorite', in: 'query', schema: new OA\Schema(type: 'boolean')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string', enum: ['name', 'created_at', 'category_id'])),
            new OA\Parameter(name: 'dir', in: 'query', schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'])),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'per_page', in: 'query', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [new OA\Response(response: 200, description: 'OK')],
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        return WebsiteResource::collection($this->websites->paginate($request));
    }

    #[OA\Post(path: '/api/websites', summary: 'Crear sitio', tags: ['Websites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 201, description: 'OK')])]
    public function store(StoreWebsiteRequest $request): JsonResponse
    {
        $website = $this->websites->create($request->validated());

        return (new WebsiteResource($website))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Website $website): WebsiteResource
    {
        $this->authorize('view', $website);

        return new WebsiteResource($website->load('category'));
    }

    #[OA\Put(path: '/api/websites/{id}', summary: 'Actualizar sitio', tags: ['Websites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'OK')])]
    public function update(UpdateWebsiteRequest $request, Website $website): WebsiteResource
    {
        $this->authorize('update', $website);

        return new WebsiteResource($this->websites->update($website, $request->validated()));
    }

    public function toggleFavorite(Website $website): WebsiteResource
    {
        $this->authorize('update', $website);

        return new WebsiteResource($this->websites->toggleFavorite($website));
    }

    #[OA\Delete(path: '/api/websites/{id}', summary: 'Eliminar sitio', tags: ['Websites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 204, description: 'OK')])]
    public function destroy(Website $website): JsonResponse
    {
        $this->authorize('delete', $website);

        $this->websites->delete($website);

        return response()->json(null, 204);
    }
}
