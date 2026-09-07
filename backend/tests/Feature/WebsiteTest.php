<?php

use App\Models\Category;
use App\Models\Website;

beforeEach(fn () => actingAsAuthenticated());

/**
 * Helpers
 */
function makeWebsitePayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'GitHub',
        'url' => 'https://github.com',
        'description' => 'Repositorios de código',
        'category_id' => Category::factory()->create()->id,
        'is_favorite' => false,
    ], $overrides);
}

it('puede crear un sitio', function () {
    $payload = makeWebsitePayload();

    $this->postJson('/api/websites', $payload)
        ->assertCreated()
        ->assertJsonPath('data.name', 'GitHub')
        ->assertJsonPath('data.url', 'https://github.com');

    $this->assertDatabaseHas('websites', ['name' => 'GitHub', 'url' => 'https://github.com']);
});

it('devuelve el nombre, url y categoría en el listado', function () {
    $website = Website::factory()->forCategory()->create();

    $this->getJson('/api/websites')
        ->assertOk()
        ->assertJsonPath('data.0.id', $website->id)
        ->assertJsonPath('data.0.category.id', $website->category_id);
});

it('no permite una URL inválida', function (string $url) {
    $this->postJson('/api/websites', makeWebsitePayload(['url' => $url]))
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('url');
})->with([
    'sin protocolo' => 'github.com',
    'texto plano' => 'no es una url',
    'protocolo no permitido' => 'ftp://example.com',
    'javascript' => 'javascript:alert(1)',
]);

it('requiere un nombre', function () {
    $this->postJson('/api/websites', makeWebsitePayload(['name' => '']))
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('name');
});

it('requiere una categoría existente', function () {
    $this->postJson('/api/websites', makeWebsitePayload(['category_id' => 999]))
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('category_id');
});

it('puede consultar un sitio', function () {
    $website = Website::factory()->forCategory()->create();

    $this->getJson("/api/websites/{$website->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $website->id)
        ->assertJsonPath('data.category.id', $website->category_id);
});

it('devuelve 404 para un sitio inexistente', function () {
    $this->getJson('/api/websites/999')->assertNotFound();
});

it('puede actualizar un sitio', function () {
    $website = Website::factory()->forCategory()->create();
    $newCategory = Category::factory()->create();

    $this->putJson("/api/websites/{$website->id}", makeWebsitePayload([
        'name' => 'Nuevo nombre',
        'url' => 'https://nuevo.example.com',
        'category_id' => $newCategory->id,
    ]))->assertOk()
        ->assertJsonPath('data.name', 'Nuevo nombre')
        ->assertJsonPath('data.category_id', $newCategory->id);
});

it('puede eliminar un sitio', function () {
    $website = Website::factory()->forCategory()->create();

    $this->deleteJson("/api/websites/{$website->id}")->assertNoContent();

    $this->assertDatabaseMissing('websites', ['id' => $website->id]);
});

it('puede marcar y desmarcar favorito', function () {
    $website = Website::factory()->forCategory()->create(['is_favorite' => false]);

    $this->patchJson("/api/websites/{$website->id}/favorite")
        ->assertOk()
        ->assertJsonPath('data.is_favorite', true);

    $this->patchJson("/api/websites/{$website->id}/favorite")
        ->assertOk()
        ->assertJsonPath('data.is_favorite', false);
});

it('puede buscar por nombre, url o descripción', function () {
    Website::factory()->forCategory()->create(['name' => 'PortalUnico']);
    Website::factory()->forCategory()->create(['url' => 'https://url-buscable.test']);
    Website::factory()->forCategory()->create(['description' => 'descripcionidentificable']);
    Website::factory()->forCategory()->create(['name' => 'Otro']);

    $this->getJson('/api/websites?search=PortalUnico')
        ->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/websites?search=url-buscable')
        ->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/websites?search=descripcionidentificable')
        ->assertOk()->assertJsonCount(1, 'data');
});

it('puede filtrar por categoría', function () {
    $a = Category::factory()->create();
    $b = Category::factory()->create();
    Website::factory()->count(2)->for($a)->create();
    Website::factory()->for($b)->create();

    $this->getJson("/api/websites?category_id={$a->id}")
        ->assertOk()->assertJsonCount(2, 'data');
});

it('puede filtrar por favoritos', function () {
    Website::factory()->count(3)->forCategory()->favorite()->create();
    Website::factory()->count(2)->forCategory()->create();

    $this->getJson('/api/websites?is_favorite=1')
        ->assertOk()->assertJsonCount(3, 'data');
    $this->getJson('/api/websites?is_favorite=0')
        ->assertOk()->assertJsonCount(2, 'data');
});

it('puede ordenar por nombre', function () {
    Website::factory()->forCategory()->create(['name' => 'Zebra']);
    Website::factory()->forCategory()->create(['name' => 'Alpha']);

    $response = $this->getJson('/api/websites?sort=name&dir=asc')->assertOk();

    expect($response->json('data.0.name'))->toBe('Alpha');
});

it('rechaza un campo de orden no permitido y usa el por defecto', function () {
    Website::factory()->forCategory()->create();

    $this->getJson('/api/websites?sort=DROP TABLE websites')
        ->assertOk();
});

it('pagina los resultados con metadata', function () {
    Website::factory()->count(15)->forCategory()->create();

    $response = $this->getJson('/api/websites?per_page=5')->assertOk();

    expect($response->json('data'))->toHaveCount(5)
        ->and($response->json('meta.total'))->toBe(15)
        ->and($response->json('meta.last_page'))->toBe(3);

    $this->getJson('/api/websites?per_page=5&page=3')
        ->assertOk()
        ->assertJsonCount(5, 'data');
});

it('registra actividad al crear, actualizar, favoritar y eliminar', function () {
    $website = Website::factory()->forCategory()->create();
    $website->update(['name' => 'Renombrado']);
    $website->update(['is_favorite' => true]);
    $website->delete();

    $this->assertDatabaseHas('activities', ['type' => 'created', 'subject_type' => 'website']);
    $this->assertDatabaseHas('activities', ['type' => 'updated', 'subject_type' => 'website']);
    $this->assertDatabaseHas('activities', ['type' => 'favorited', 'subject_type' => 'website']);
    $this->assertDatabaseHas('activities', ['type' => 'deleted', 'subject_type' => 'website']);
});
