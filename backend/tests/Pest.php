<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');

/**
 * Autentica a un usuario (creado por factory) en el guard 'api' (JWT)
 * y lo registra para que pueda consultarse con authUserId().
 */
function actingAsAuthenticated(?User $user = null): User
{
    $user ??= User::factory()->create();

    test()->actingAs($user, 'api');
    authUserId($user->id);

    return $user;
}

/**
 * Accede/id de la usuaria autenticada en el test actual.
 */
function authUserId(?int $id = null): int|false
{
    static $currentId = null;

    if ($id !== null) {
        $currentId = $id;
    }

    return $currentId;
}