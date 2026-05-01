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
        Schema::create('health_scores', function (Blueprint $table) {
            $table->foreignUlid('health_log_id')->primary()->constrained('health_logs')->cascadeOnDelete();

            $table->tinyInteger('phq9_score')->nullable()->comment('Range: 0-27');
            $table->enum('phq9_severity', ['minimal', 'mild', 'moderate', 'mod_severe', 'severe'])->nullable();

            $table->tinyInteger('gad7_score')->nullable()->comment('Range: 0-21');
            $table->tinyInteger('pss_score')->nullable()->comment('Range: 0-40');
            $table->tinyInteger('who5_score')->nullable()->comment('Range: 0-100');

            $table->smallInteger('met_minutes_week')->nullable()->comment('Rolling 7-day MET-minutes');
            $table->decimal('bmi', 4, 2)->nullable();

            $table->decimal('composite_score', 5, 2)->nullable()->comment('Weighted overall score 0-100');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_scores');
    }
};
