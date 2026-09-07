<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

/**
 * Lógica reutilizable de autenticación por JWT.
 *
 * Encapsula registro, login, consulta del usuario, logout, refresh y el
 * formato de respuesta con token, de modo que cualquier controlador pueda
 * exponer autenticación sin duplicar código.
 */
trait AuthenticatesWithJwt
{
    #[OA\Post(
        path: '/api/auth/register',
        summary: 'Registrar un usuario',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['name', 'email', 'password', 'password_confirmation'],
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'Demo'),
                new OA\Property(property: 'email', type: 'string', example: 'demo@linkhub.test'),
                new OA\Property(property: 'password', type: 'string', example: 'password'),
                new OA\Property(property: 'password_confirmation', type: 'string', example: 'password'),
            ],
        )),
        responses: [new OA\Response(response: 201, description: 'Usuario creado con token JWT')],
    )]
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($user, $token, 201);
    }

    #[OA\Post(
        path: '/api/auth/login',
        summary: 'Iniciar sesión',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['email', 'password'],
            properties: [
                new OA\Property(property: 'email', type: 'string', example: 'demo@linkhub.test'),
                new OA\Property(property: 'password', type: 'string', example: 'password'),
            ],
        )),
        responses: [
            new OA\Response(response: 200, description: 'Token JWT'),
            new OA\Response(response: 401, description: 'Credenciales inválidas'),
        ],
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! $token = Auth::guard('api')->attempt($credentials)) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }

        return $this->respondWithToken(Auth::guard('api')->user(), $token);
    }

    #[OA\Get(path: '/api/auth/me', summary: 'Usuario autenticado', tags: ['Auth'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'OK')])]
    public function me(): UserResource
    {
        return new UserResource(Auth::guard('api')->user());
    }

    #[OA\Post(path: '/api/auth/logout', summary: 'Cerrar sesión', tags: ['Auth'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'OK')])]
    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    #[OA\Post(path: '/api/auth/refresh', summary: 'Refrescar token', tags: ['Auth'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'OK')])]
    public function refresh(): JsonResponse
    {
        return $this->respondWithToken(
            Auth::guard('api')->user(),
            Auth::guard('api')->refresh()
        );
    }

    protected function respondWithToken(User $user, string $token, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => (int) config('jwt.ttl') * 60,
            ],
        ], $status);
    }
}