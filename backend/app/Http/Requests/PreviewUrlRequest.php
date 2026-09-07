<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewUrlRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url' => ['required', 'string', 'max:2048', 'url:http,https'],
        ];
    }

    public function messages(): array
    {
        return [
            'url.required' => 'La URL es obligatoria.',
            'url.url' => 'La URL debe ser válida y comenzar por http:// o https://.',
        ];
    }
}