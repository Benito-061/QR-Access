<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ceremonies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('type')->nullable();
            $table->string('location')->nullable();
            $table->string('address')->nullable();
            $table->string('commune')->nullable();
            $table->unsignedInteger('capacity')->default(100);
            $table->string('phone')->nullable();
            $table->string('sex')->nullable();
            $table->string('honorific')->nullable();
            $table->string('place')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('dress_code')->nullable();
            $table->dateTime('start_datetime')->nullable();
            $table->dateTime('end_datetime')->nullable();
            $table->string('church')->nullable();
            $table->string('church_address')->nullable();
            $table->string('photographer')->nullable();
            $table->string('reception')->nullable();
            $table->string('bride_name')->nullable();
            $table->string('groom_name')->nullable();
            $table->string('family1')->nullable();
            $table->string('family2')->nullable();
            $table->text('program')->nullable();
            $table->text('notes')->nullable();
            $table->string('quick_code', 10)->nullable();
            $table->string('category')->default('ceremonie');
            $table->timestamps();

            $table->index(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ceremonies');
    }
};
