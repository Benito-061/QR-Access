<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ceremony_id')->constrained()->cascadeOnDelete();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('full_name')->nullable();
            $table->string('honorific')->nullable();
            $table->string('phone')->nullable();
            $table->string('seat')->nullable();
            $table->unsignedTinyInteger('count')->default(1);
            $table->string('guest_type')->default('singleton');
            $table->string('quick_code', 10)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['ceremony_id', 'quick_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guests');
    }
};
