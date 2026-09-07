<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('websites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')
                ->constrained()
                ->restrictOnDelete(); // Regla de negocio: no borrar categorías en uso
            $table->string('name', 120);
            $table->string('url', 2048);
            $table->text('description')->nullable();
            $table->string('favicon', 2048)->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();

            $table->index('category_id');
            $table->index('is_favorite');
            $table->index('name');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('websites');
    }
};
