<?php

namespace App\Http\Controllers\Api;

use OpenApi\Attributes as OA;

#[
    OA\Info(
        version: '1.0.0',
        title: 'LinkHub API',
        description: 'API REST para gestionar sitios web y categorías.',
    ),
    OA\SecurityScheme(
        securityScheme: 'bearerAuth',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    ),
]
class OpenApi
{
}