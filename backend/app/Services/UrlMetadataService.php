<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UrlMetadataService
{
    /**
     * Intenta extraer metadata básica (título, descripción, favicon) de una URL.
     *
     * NUNCA lanza excepción: si la URL no responde o no tiene metadata,
     * devuelve valores null. El guardado del sitio no depende de esto.
     */
    public function fetch(string $url): array
    {
        $result = [
            'title' => null,
            'description' => null,
            'favicon' => null,
            'suggested_category' => null,
        ];

        if (! $this->isSafeUrl($url)) {
            return $result;
        }

        try {
            $response = Http::withOptions(['verify' => false])
                ->timeout(5)
                ->withHeaders(['User-Agent' => 'LinkHubBot/1.0'])
                ->get($url);

            if (! $response->successful()) {
                return $result;
            }

            $html = $response->body();
            $host = parse_url($url, PHP_URL_HOST);

            $result['title'] = $this->parseTitle($html);
            $result['description'] = $this->parseMeta($html, 'description')
                ?? $this->parseMeta($html, 'og:description');
            $result['favicon'] = $this->defaultFavicon($host);
            $result['suggested_category'] = $this->suggestCategory($result['title'], $host);
        } catch (\Throwable) {
            // Fallback silencioso: se devuelve el array vacío.
        }

        return $result;
    }

    private function isSafeUrl(string $url): bool
    {
        $scheme = strtolower(parse_url($url, PHP_URL_SCHEME) ?? '');

        return in_array($scheme, ['http', 'https'], true);
    }

    private function parseTitle(string $html): ?string
    {
        if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $m)) {
            return html_entity_decode(trim($m[1]));
        }

        return null;
    }

    private function parseMeta(string $html, string $name): ?string
    {
        $pattern = '/<meta[^>]+(?:name|property)=["\']' . preg_quote($name, '/') . '["\'][^>]+content=["\'](.*?)["\']/is';
        if (preg_match($pattern, $html, $m)) {
            return html_entity_decode(trim($m[1]));
        }

        return null;
    }

    private function defaultFavicon(?string $host): ?string
    {
        return $host
            ? "https://www.google.com/s2/favicons?domain={$host}&sz=64"
            : null;
    }

    /**
     * Heurística simple de categoría sugerida basada en palabras clave.
     */
    private function suggestCategory(?string $title, ?string $host): ?string
    {
        $haystack = Str::lower(($title ?? '') . ' ' . ($host ?? ''));

        $rules = [
            'Desarrollo' => ['github', 'stackoverflow', 'gitlab', 'angular', 'react', 'laravel', 'code', 'dev'],
            'Tecnología' => ['tech', 'microsoft', 'apple', 'google', 'software', 'api'],
            'Noticias' => ['news', 'noticias', 'bbc', 'cnn', 'periódico', 'diario'],
            'Educación' => ['course', 'learn', 'educación', 'university', 'academy', 'khan'],
            'Entretenimiento' => ['youtube', 'netflix', 'spotify', 'movies', 'game', 'music'],
            'Compras' => ['shop', 'amazon', 'ebay', 'store', 'tienda', 'compra'],
        ];

        foreach ($rules as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($haystack, $keyword)) {
                    return $category;
                }
            }
        }

        return null;
    }
}