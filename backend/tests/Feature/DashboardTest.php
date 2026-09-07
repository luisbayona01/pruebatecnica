<?php

use App\Models\Category;
use App\Models\Website;

beforeEach(fn () => actingAsAuthenticated());

it('devuelve las estadísticas del dashboard correctamente', function () {
    $tech = Category::factory()->create(['name' => 'Tecnología']);
    $news = Category::factory()->create(['name' => 'Noticias']);

    Website::factory()->for($tech)->count(3)->create();
    Website::factory()->for($tech)->favorite()->create();
    Website::factory()->for($news)->count(2)->create();

    $response = $this->getJson('/api/dashboard/statistics')->assertOk();

    expect($response->json('data.total_websites'))->toBe(6)
        ->and($response->json('data.total_categories'))->toBe(2)
        ->and($response->json('data.total_favorites'))->toBe(1)
        ->and($response->json('data.top_category.name'))->toBe('Tecnología')
        ->and($response->json('data.top_category.count'))->toBe(4);
});

it('mantiene el contador de sitios por categoría con el trigger', function () {
    $category = Category::factory()->create();
    expect($category->fresh()->websites_count)->toBe(0);

    $a = Website::factory()->for($category)->create();
    $b = Website::factory()->for($category)->create();
    expect($category->fresh()->websites_count)->toBe(2);

    // Al eliminar, el trigger decrementa.
    $a->delete();
    expect($category->fresh()->websites_count)->toBe(1);

    // Al mover a otra categoría, el trigger reequilibra ambos contadores.
    $other = Category::factory()->create();
    $b->update(['category_id' => $other->id]);
    expect($category->fresh()->websites_count)->toBe(0)
        ->and($other->fresh()->websites_count)->toBe(1);
});