<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ceremonies', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('guests', fn (Blueprint $table) => $table->softDeletes());
        Schema::create('download_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ceremony_id')->nullable()->constrained()->nullOnDelete();
            $table->string('resource', 100);
            $table->string('file_name')->nullable();
            $table->timestamp('downloaded_at');
            $table->timestamps();
            $table->index(['user_id', 'downloaded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('download_logs');
        Schema::table('guests', fn (Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('ceremonies', fn (Blueprint $table) => $table->dropSoftDeletes());
    }
};
