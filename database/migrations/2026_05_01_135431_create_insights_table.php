<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('insights', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->string('type')->default('daily_insight');
            
            $table->json('content');
            
            $table->string('ai_provider')->default('groq');
            $table->string('ai_model')->default('llama-3.3-70b-versatile');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insights');
    }
};
