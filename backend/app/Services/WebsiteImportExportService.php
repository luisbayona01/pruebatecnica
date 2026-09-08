<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Website;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WebsiteImportExportService
{
    public function __construct(
        private readonly UrlMetadataService $metadata,
    ) {}

    public function exportCsv(Collection $websites): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="websites.csv"',
        ];

        $callback = function () use ($websites) {
            $out = fopen('php://output', 'w');
            fputs($out, "\xEF\xBB\xBF"); // BOM para Excel

            fputcsv($out, ['name', 'url', 'description', 'category', 'is_favorite']);

            foreach ($websites as $w) {
                fputcsv($out, [
                    $w->name,
                    $w->url,
                    $w->description,
                    $w->category?->name,
                    $w->is_favorite ? '1' : '0',
                ]);
            }

            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Importa sitios desde CSV o JSON, validando cada fila de forma
     * independiente y devolviendo un reporte con errores por fila.
     */
    public function import(UploadedFile $file, int $userId): array
    {
        Log::info('[import] Iniciando importación', [
            'user_id' => $userId,
            'original_name' => $file->getClientOriginalName(),
            'extension' => $file->getClientOriginalExtension(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
        ]);

        try {
            $rows = $this->parseFile($file);
        } catch (\Throwable $e) {
            Log::error('[import] Error parseando archivo', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            throw $e;
        }

        Log::info('[import] Archivo parseado', ['rows' => count($rows)]);

        $imported = 0;
        $errors = [];

        try {
            DB::transaction(function () use ($rows, $userId, &$imported, &$errors) {
                $categoryIds = $this->loadCategoryIds($userId);
                $batch = [];

                foreach ($rows as $index => $row) {
                    try {
                        $data = $this->buildRow($row, $userId, $categoryIds);
                    } catch (\Throwable $e) {
                        Log::error("[import] Error en fila {$index}", [
                            'message' => $e->getMessage(),
                            'row' => $row,
                        ]);

                        $errors[] = ['row' => $index + 1, 'message' => $e->getMessage()];
                        continue;
                    }

                    if (isset($data['error'])) {
                        $errors[] = ['row' => $index + 1, 'message' => $data['error']];
                        continue;
                    }

                    $batch[] = $data;
                    $imported++;

                    if (count($batch) >= 500) {
                        Website::insert($batch);
                        $batch = [];
                    }
                }

                if ($batch) {
                    Website::insert($batch);
                }
            });
        } catch (\Throwable $e) {
            Log::error('[import] Error fatal durante la transacción', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            throw $e;
        }

        Log::info('[import] Finalizado', [
            'total' => count($rows),
            'imported' => $imported,
            'errors' => count($errors),
        ]);

        return [
            'total' => count($rows),
            'imported' => $imported,
            'errors' => $errors,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseFile(\Illuminate\Http\UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return $extension === 'json'
            ? $this->parseJson($file)
            : $this->parseCsv($file);
    }

    private function parseJson(\Illuminate\Http\UploadedFile $file): array
    {
        $decoded = json_decode($file->getContent(), true);

        if (! is_array($decoded)) {
            return [];
        }

        // Soporta tanto un array plano como { "data": [...] }.
        if (isset($decoded['data']) && is_array($decoded['data'])) {
            $decoded = $decoded['data'];
        }

        return array_values(array_filter($decoded, 'is_array'));
    }

    private function parseCsv(\Illuminate\Http\UploadedFile $file): array
    {
        $rows = [];
        $header = null;

        $handle = fopen($file->getRealPath(), 'r');

        while (($data = fgetcsv($handle)) !== false) {
            if ($header === null) {
                $header = array_map(
                    fn ($h) => strtolower(trim(str_replace("\xEF\xBB\xBF", '', $h))),
                    $data
                );
                continue;
            }

            if (count(array_filter($data, fn ($v) => $v !== '' && $v !== null)) === 0) {
                continue;
            }

            $row = [];
            foreach ($header as $i => $key) {
                $row[$key] = $data[$i] ?? null;
            }
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function buildRow(array $row, int $userId, array &$categoryIds): array
    {
        $validator = Validator::make($row, $this->rowRules());

        if ($validator->fails()) {
            return ['error' => $validator->errors()->first()];
        }

        $categoryId = $this->resolveCategoryId($row['category'] ?? null, $userId, $categoryIds);

        if ($categoryId === null && isset($row['category'])) {
            return ['error' => "La categoría \"{$row['category']}\" no existe y no se puede crear."];
        }

        $isFavorite = filter_var($row['is_favorite'] ?? false, FILTER_VALIDATE_BOOLEAN);

        return [
            'user_id' => $userId,
            'category_id' => $categoryId,
            'name' => $row['name'],
            'url' => $row['url'],
            'description' => $row['description'] ?? null,
            'is_favorite' => $isFavorite ? 1 : 0,
            'favicon' => $this->faviconFor($row['url']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function rowRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'url' => ['required', 'string', 'max:2048', 'url:http,https'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:80'],
            'is_favorite' => ['nullable', 'boolean'],
        ];
    }

    private function loadCategoryIds(int $userId): array
    {
        return Category::where('user_id', $userId)->pluck('id', 'name')->all();
    }

    private function resolveCategoryId(?string $name, int $userId, array &$categoryIds): ?int
    {
        $key = blank($name) ? 'Sin categoría' : $name;

        if (isset($categoryIds[$key])) {
            return $categoryIds[$key];
        }

        $category = Category::firstOrCreate(
            ['name' => $key, 'user_id' => $userId],
            ['name' => $key, 'user_id' => $userId]
        );

        $categoryIds[$key] = $category->id;

        return $category->id;
    }

    private function faviconFor(?string $url): ?string
    {
        if (blank($url)) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return $host
            ? "https://www.google.com/s2/favicons?domain={$host}&sz=64"
            : null;
    }
}