<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWebsiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'url' => ['required', 'string', 'max:2048', 'url:http,https'],
            'description' => ['nullable', 'string', 'max:2000'],
            'favicon' => ['nullable', 'string', 'max:2048'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'is_favorite' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del sitio es obligatorio.',
            'url.required' => 'La URL es obligatoria.',
            'url.url' => 'La URL debe ser válida y comenzar por http:// o https://.',
            'category_id.required' => 'Debes seleccionar una categoría.',
            'category_id.exists' => 'La categoría seleccionada no existe.',
        ];
    }
}
