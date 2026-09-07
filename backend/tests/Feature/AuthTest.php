<?php

use App\Models\User;

it('puede registrar un usuario y devuelve un token JWT', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Nuevo Usuario',
        'email' => 'nuevo@linkhub.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertCreated();

    expect($response->json('data.access_token'))->toBeString()
        ->and($response->json('data.token_type'))->toBe('bearer')
        ->and($response->json('data.user.email'))->toBe('nuevo@linkhub.test');

    $this->assertDatabaseHas('users', ['email' => 'nuevo@linkhub.test']);
});

it('valida los datos de registro', function () {
    $this->postJson('/api/auth/register', [
        'name' => '',
        'email' => 'no-email',
        'password' => 'corta',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('puede iniciar sesión con credenciales válidas', function () {
    User::factory()->create([
        'email' => 'demo@linkhub.test',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'demo@linkhub.test',
        'password' => 'password123',
    ])->assertOk();

    expect($response->json('data.access_token'))->toBeString();
});

it('rechaza credenciales inválidas con 401', function () {
    User::factory()->create([
        'email' => 'demo@linkhub.test',
        'password' => 'password123',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => 'demo@linkhub.test',
        'password' => 'incorrecta',
    ])->assertUnauthorized()
        ->assertJson(['message' => 'Credenciales inválidas.']);
});

it('permite consultar el usuario autenticado', function () {
    $user = actingAsAuthenticated();

    $this->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email);
});

it('protege los endpoints sin token JWT', function () {
    $this->getJson('/api/websites')->assertUnauthorized();
    $this->getJson('/api/categories')->assertUnauthorized();
    $this->getJson('/api/dashboard/statistics')->assertUnauthorized();
});

it('no permite acceder a un sitio que no pertenece al usuario', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $category = \App\Models\Category::factory()->create(['user_id' => $owner->id]);
    $website = \App\Models\Website::factory()->create([
        'user_id' => $owner->id,
        'category_id' => $category->id,
    ]);

    actingAsAuthenticated($other);

    $this->getJson("/api/websites/{$website->id}")->assertForbidden();
    $this->deleteJson("/api/websites/{$website->id}")->assertForbidden();
});

it('cada usuario solo ve sus propios sitios', function () {
    $alice = User::factory()->create();
    $bob = User::factory()->create();

    $catA = \App\Models\Category::factory()->create(['user_id' => $alice->id]);
    $catB = \App\Models\Category::factory()->create(['user_id' => $bob->id]);

    \App\Models\Website::factory()->count(2)->create(['user_id' => $alice->id, 'category_id' => $catA->id]);
    \App\Models\Website::factory()->create(['user_id' => $bob->id, 'category_id' => $catB->id]);

    actingAsAuthenticated($alice);

    $this->getJson('/api/websites')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.total', 2);
});