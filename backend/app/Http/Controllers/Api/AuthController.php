<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\AuthenticatesWithJwt;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    use AuthenticatesWithJwt;
}