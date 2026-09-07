<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('type', 40); // created, updated, deleted, favorited, unfavorited
            $table->string('subject_type'); // website | category
            $table->unsignedBigInteger('subject_id')->nullable(); // se conserva aunque el sujeto se borre
            $table->string('subject_name');
            $table->string('description');
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
