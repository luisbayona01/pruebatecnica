<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PreviewUrlRequest;
use App\Http\Resources\WebsiteResource;
use App\Models\Website;
use App\Services\UrlMetadataService;
use App\Services\WebsiteImportExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;
use OpenApi\Attributes as OA;

class ImportExportController extends Controller
{
    public function __construct(
        private readonly UrlMetadataService $metadata,
        private readonly WebsiteImportExportService $importExport,
    ) {}

    public function preview(PreviewUrlRequest $request): JsonResponse
    {
        $metadata = $this->metadata->fetch($request->validated()['url']);

        return response()->json(['data' => $metadata]);
    }

    public function export(Request $request, string $format): StreamedResponse|JsonResponse
    {
        $websites = Website::query()
            ->with('category')
            ->visibleTo(Auth::id())
            ->orderBy('name')
            ->get();

        if ($format === 'json') {
            return response()->json([
                'data' => WebsiteResource::collection($websites),
            ]);
        }

        if ($format !== 'csv') {
            return response()->json(['message' => 'Formato no soportado. Usa "csv" o "json".'], 422);
        }

        return $this->importExport->exportCsv($websites);
    }

    public function import(Request $request): JsonResponse
    {
        $file = $request->file('file');

        if (! $file || ! $file->isValid()) {
            return response()->json(['message' => 'Debes adjuntar un archivo válido (CSV o JSON).'], 422);
        }

        $report = $this->importExport->import($file, Auth::id());

        return response()->json(['data' => $report], 201);
    }
}