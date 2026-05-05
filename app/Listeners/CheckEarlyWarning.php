<?php

namespace App\Listeners;

use App\Events\HealthLogCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class CheckEarlyWarning implements ShouldQueue
{
    use InteractsWithQueue;
    
    public function __construct() {}

    public function handle(HealthLogCreated $event): void
    {
        $log = $event->healthLog;

        if (!empty($log->phq9_responses)) {
            $phq9Score = array_sum($log->phq9_responses);
            
            if ($phq9Score >= 10) {
                Log::alert('EARLY WARNING [PHQ-9]: Indikator depresi cukup berat/berat.', [
                    'user_id' => $log->user_id,
                    'score' => $phq9Score,
                ]);
            }
        }

        if (!empty($log->gad7_responses)) {
            $gad7Score = array_sum($log->gad7_responses);
            
            if ($gad7Score >= 10) {
                Log::alert('EARLY WARNING [GAD-7]: Indikator kecemasan klinis.', [
                    'user_id' => $log->user_id,
                    'score' => $gad7Score,
                ]);
            }
        }

        if ($log->stress_level == 4) {
            Log::warning('EARLY WARNING [Stress]: Tingkat stres sangat tinggi!', [
                'user_id' => $log->user_id
            ]);
        }

        if ($log->sleep_hours > 0 && ($log->sleep_hours < 5 || $log->sleep_quality == 0)) {
            Log::info('WELLNESS ALERT: Kualitas/Durasi tidur buruk dideteksi.', [
                'user_id' => $log->user_id,
                'sleep_hours' => $log->sleep_hours
            ]);
        }
    }
}