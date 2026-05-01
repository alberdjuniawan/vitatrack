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
        Schema::create('health_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('log_date');

            $table->tinyInteger('mood_score')->comment('Scale 1-10');
            $table->enum('mood_label', ['happy', 'sad', 'anxious', 'angry', 'calm', 'overwhelmed', 'neutral']);
            $table->tinyInteger('stress_level')->comment('Scale 0 (Never) to 4 (Very Often)');

            $table->decimal('sleep_hours', 3, 1);
            $table->tinyInteger('sleep_quality')->comment('Scale 0-3 based on PSQI component');
            $table->enum('activity_type', ['sedentary', 'walking', 'running', 'cycling', 'gym', 'sport', 'other']);
            $table->smallInteger('activity_minutes');
            $table->decimal('activity_met', 4, 2)->nullable()->comment('Calculated MET value');
            $table->smallInteger('water_intake_ml');

            $table->json('phq9_responses')->nullable()->comment('Array of 9 answers [0,1,2,3]');
            $table->json('gad7_responses')->nullable()->comment('Array of 7 answers [0,1,2,3]');
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'log_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_logs');
    }
};
