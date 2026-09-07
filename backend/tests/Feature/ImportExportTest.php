<?php

use App\Models\Category;
use App\Models\Website;
use Illuminate\Http\UploadedFile;

beforeEach(fn () => actingAsAuthenticated());

it('exporta los sitios a CSV', function () {
    $category = Category::factory()->create(['name' => 'Tech']);
    Website::factory()->for($category)->create(['name' => 'GitHub', 'url' => 'https://github.com']);

    $response = $this->get('/api/websites/export/csv')->assertOk();

    expect($response->headers->get('content-type'))->toContain('text/csv');
    expect($response->streamedContent())->toContain('GitHub');
});

it('exporta los sitios a JSON', function () {
    $website = Website::factory()->forCategory()->create();

    $this->getJson('/api/websites/export/json')
        ->assertOk()
        ->assertJsonPath('data.0.id', $website->id);
});

it('rechaza un formato de exportación no soportado', function () {
    $this->getJson('/api/websites/export/xml')->assertStatus(404);
});

it('importa sitios desde JSON y reporta errores por fila', function () {
    $payload = [
        ['name' => 'Válido', 'url' => 'https://valid.com', 'category' => 'Importados'],
        ['name' => '', 'url' => 'https://sin-nombre.com'],              // error: falta nombre
        ['name' => 'URL mala', 'url' => 'no-es-url'],                   // error: URL inválida
    ];

    $file = UploadedFile::fake()->createWithContent('websites.json', json_encode($payload));

    $response = $this->postJson('/api/websites/import', ['file' => $file])
        ->assertStatus(201);

    expect($response->json('data.total'))->toBe(3)
        ->and($response->json('data.imported'))->toBe(1)
        ->and($response->json('data.errors'))->toHaveCount(2)
        ->and($response->json('data.errors.0.row'))->toBe(2);

    $this->assertDatabaseHas('websites', ['name' => 'Válido']);
    $this->assertDatabaseHas('categories', ['name' => 'Importados']);
});

it('importa sitios desde CSV', function () {
    $content = "name,url,category\nCSV Site,https://csv.example.com,MiCat\n";
    $file = UploadedFile::fake()->createWithContent('websites.csv', $content);

    $this->postJson('/api/websites/import', ['file' => $file])
        ->assertStatus(201)
        ->assertJsonPath('data.imported', 1);

    $this->assertDatabaseHas('websites', ['name' => 'CSV Site']);
});

it('requiere un archivo para importar', function () {
    $this->postJson('/api/websites/import', [])
        ->assertUnprocessable();
});

it('devuelve metadata (o null) al hacer preview de una URL', function () {
    $this->postJson('/api/websites/preview-url', ['url' => 'https://github.com'])
        ->assertOk()
        ->assertJsonStructure(['data' => ['title', 'description', 'favicon', 'suggested_category']]);
});

it('rechaza una URL no válida en el preview', function () {
    $this->postJson('/api/websites/preview-url', ['url' => 'sin-protocolo'])
        ->assertUnprocessable();
});