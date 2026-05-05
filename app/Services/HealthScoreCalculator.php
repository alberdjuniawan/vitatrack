<?php

namespace App\Services;

use App\Models\HealthLog;
use App\Models\User;

class HealthScoreCalculator
{
    public function calculateAndSave(HealthLog $log, User $user): void
    {
        $phq9Score = $this->calculatePHQ9($log->phq9_responses);
        $phq9Severity = $this->getPHQ9Severity($phq9Score);

        $gad7Score = $this->calculateGAD7($log->gad7_responses);
        
        $metMinutes = $this->calculateMET($log->activity_type, $log->activity_minutes);
        
        $bmi = $this->calculateBMI($user->height_cm, $user->weight_kg);

        $log->healthScore()->updateOrCreate(
            ['health_log_id' => $log->id],
            [
                'phq9_score' => $phq9Score,
                'phq9_severity' => $phq9Severity,
                'gad7_score' => $gad7Score,
                'met_minutes_week' => $metMinutes, 
                'bmi' => $bmi,
            ]
        );
    }

    /**
     * PHQ-9 (Patient Health Questionnaire)
     * Standar WHO & DSM-5 untuk gejala depresi.
     */
    private function calculatePHQ9(?array $responses): ?int
    {
        if (!$responses || count($responses) !== 9) return null;
        return array_sum($responses); 
    }

    private function getPHQ9Severity(?int $score): ?string
    {
        if ($score === null) return null;
        
        return match(true) {
            $score <= 4 => 'minimal',       
            $score <= 9 => 'mild',          
            $score <= 14 => 'moderate',     
            $score <= 19 => 'mod_severe',   
            default => 'severe',            
        };
    }

    /**
     * GAD-7 (Generalized Anxiety Disorder)
     * Validasi klinis kecemasan.
     */
    private function calculateGAD7(?array $responses): ?int
    {
        if (!$responses || count($responses) !== 7) return null;
        return array_sum($responses); 
    }

    /**
     * MET (Metabolic Equivalent of Task)
     * Standar intensitas fisik WHO.
     */
    private function calculateMET(?string $activityType, ?int $minutes): int
    {
        if (!$activityType || !$minutes) return 0;

        $metMultipliers = [
            'sedentary' => 1.3,
            'walking' => 3.5,
            'cycling' => 6.0,
            'gym' => 5.5,
            'running' => 8.0,
            'sport' => 7.0,
            'other' => 4.0,
        ];

        $multiplier = $metMultipliers[$activityType] ?? 1.0;
        return (int) round($multiplier * $minutes); 
    }

    /**
     * Body Mass Index (BMI) - Asia-Pacific Reference (WHO WPRO)
     */
    private function calculateBMI(?float $heightCm, ?float $weightKg): ?float
    {
        if (!$heightCm || !$weightKg || $heightCm <= 0) return null;
        
        $heightMeters = $heightCm / 100;
        return round($weightKg / ($heightMeters ** 2), 2);
    }
}