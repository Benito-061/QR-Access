<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category')->default('rendezvous');
            $table->string('type')->nullable();
            $table->string('sexe')->nullable();
            $table->string('location')->nullable();
            $table->string('photo')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('quick_code', 10)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'quick_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
