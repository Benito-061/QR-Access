<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guest_id')->constrained()->cascadeOnDelete();
            $table->timestamp('scanned_at');
            $table->string('source')->default('qr-scan');
            $table->timestamps();

            $table->index(['guest_id', 'scanned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_scans');
    }
};
