<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use App\Models\Website;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Usuario de demostración (idempotente)
        $demo = User::updateOrCreate(
            ['email' => 'demo@linkhub.test'],
            ['name' => 'Demo', 'password' => 'password']
        );

        // Evitar duplicar datos de demo en reinicios
        if (Category::exists()) {
            return;
        }

        $categories = collect([
            'Tecnología' => [
                ['MDN Web Docs', 'https://developer.mozilla.org', 'Referencia técnica de la web moderna.'],
                ['Stack Overflow', 'https://stackoverflow.com', 'Preguntas y respuestas para desarrolladores.'],
            ],
            'Desarrollo' => [
                ['GitHub', 'https://github.com', 'Donde el mundo construye software.', true],
                ['Laravel', 'https://laravel.com', 'El framework PHP para artesanos web.', true],
                ['Angular', 'https://angular.dev', 'Framework web de Google con TypeScript.'],
            ],
            'Educación' => [
                ['freeCodeCamp', 'https://www.freecodecamp.org', 'Aprende a programar gratis.'],
                ['Khan Academy', 'https://www.khanacademy.org', 'Educación gratuita para todos.'],
            ],
            'Noticias' => [
                ['BBC News', 'https://www.bbc.com/news', 'Noticias internacionales.'],
                ['El País', 'https://elpais.com', 'Diario global en español.'],
                ['Hacker News', 'https://news.ycombinator.com', 'Noticias de tecnología y startups.', true],
            ],
            'Entretenimiento' => [
                ['YouTube', 'https://www.youtube.com', 'Vídeos, música y directos.'],
                ['Spotify', 'https://open.spotify.com', 'Música y podcasts en streaming.'],
            ],
            'Compras' => [
                ['Amazon', 'https://www.amazon.com', 'Compra casi de todo.'],
            ],
        ]);

        foreach ($categories as $categoryName => $sites) {
            $category = Category::create(['name' => $categoryName, 'user_id' => $demo->id]);

            foreach ($sites as $site) {
                [$name, $url, $description] = $site;
                $favorite = $site[3] ?? false;
                Website::create([
                    'user_id' => $demo->id,
                    'category_id' => $category->id,
                    'name' => $name,
                    'url' => $url,
                    'description' => $description,
                    'favicon' => 'https://www.google.com/s2/favicons?domain='.parse_url($url, PHP_URL_HOST).'&sz=64',
                    'is_favorite' => (bool) $favorite,
                    'created_at' => now()->subDays(rand(0, 12)),
                ]);
            }
        }
    }
}
