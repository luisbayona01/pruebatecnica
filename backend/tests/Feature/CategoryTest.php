<?php

use App\Models\Category;
use App\Models\Website;

beforeEach(fn () => actingAsAuthenticated());

it('puede crear una categoría', function () {
    $this->postJson('/api/categories', ['name' => 'Tecnología'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Tecnología');

    $this->assertDatabaseHas('categories', ['name' => 'Tecnología']);
});

it('requiere un nombre', function () {
    $this->postJson('/api/categories', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('name');
});

it('no permite categorías duplicadas', function () {
    Category::factory()->create(['name' => 'Tecnología']);

    $this->postJson('/api/categories', ['name' => 'Tecnología'])
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('name');
});

it('lista categorías con el número de sitios asociados', function () {
    $category = Category::factory()->create();
    Website::factory()->count(3)->for($category)->create();

    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJsonPath('data.0.websites_count', 3);
});

it('puede eliminar una categoría sin sitios', function () {
    $category = Category::factory()->create();

    $this->deleteJson("/api/categories/{$category->id}")->assertNoContent();

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

it('NO puede eliminar una categoría con sitios y devuelve 409', function () {
    $category = Category::factory()->create();
    Website::factory()->for($category)->create();

    $this->deleteJson("/api/categories/{$category->id}")
        ->assertStatus(409)
        ->assertJson([
            'message' => 'No se puede eliminar la categoría porque tiene sitios asociados.',
        ]);

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
    $this->assertDatabaseCount('websites', 1);
});

it('registra actividad al crear y eliminar categorías', function () {
    $category = Category::factory()->create(['name' => 'Eventos']);
    $category->delete();

    $this->assertDatabaseHas('activities', ['type' => 'created', 'subject_type' => 'category']);
    $this->assertDatabaseHas('activities', ['type' => 'deleted', 'subject_type' => 'category']);
});
