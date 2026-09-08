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
        $userId = Auth::id();

        $query = Website::query()
            ->with('category')
            ->orderBy('name');

        if ($userId !== null) {
            $query->visibleTo($userId);
        }

        $websites = $query->get();

        if ($format === 'json') {
            return response()->json([
                'data' => WebsiteResource::collection($websites),
            ], 200, [
                'Content-Disposition' => 'attachment; filename="websites.json"',
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

        \Illuminate\Support\Facades\Log::info('[import.controller] Request recibido', [
            'has_file' => $file !== null,
            'files' => array_keys($request->allFiles()),
            'content_type' => $request->header('Content-Type'),
        ]);

        if (! $file || ! $file->isValid()) {
            return response()->json(['message' => 'Debes adjuntar un archivo válido (CSV o JSON).'], 422);
        }

        try {
            $report = $this->importExport->import($file, Auth::id());
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[import.controller] Excepción durante import', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Error interno al importar.'], 500);
        }

        return response()->json(['data' => $report], 201);
    }
}