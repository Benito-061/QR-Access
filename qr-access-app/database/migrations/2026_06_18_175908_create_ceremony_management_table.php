<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ceremony_management', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ceremony_id')->unique()->constrained()->cascadeOnDelete();
            $table->dateTime('wedding_date')->nullable();
            $table->unsignedInteger('supplies_plates')->default(0);
            $table->unsignedInteger('supplies_forks')->default(0);
            $table->unsignedInteger('supplies_glasses')->default(0);
            $table->json('custom_supplies')->nullable();
            $table->json('drinks')->nullable();
            $table->json('gifts')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ceremony_management');
    }
};
