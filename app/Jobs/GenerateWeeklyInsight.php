<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\HealthLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class GenerateWeeklyInsight implements ShouldQueue
{
    use Queueable;

    public $tries = 3;       
    public $backoff = 60;    

    public function __construct(public User $user, public int $gad7Score, public int $phq9Score) {}

    public function handle(): void
    {
        $logs = HealthLog::where('user_id', $this->user->id)
            ->orderBy('log_date', 'desc')
            ->take(7)
            ->get();

        $dataToAnalyze = $logs->map(function ($log) {
            return [
                'date' => $log->log_date->format('Y-m-d'),
                'mood_score' => $log->mood_score,
                'stress_level' => $log->stress_level,
                'sleep_hours' => $log->sleep_hours,
                'activity_mins' => $log->activity_minutes,
                'notes' => $log->notes,
            ];
        })->toJson();

        try {
            $prompt = "Data Log Fisik (7 Hari Terakhir):\n" . $dataToAnalyze . "\n
            Skor Tes Mental Mingguan:
            - Kecemasan (GAD-7): " . $this->gad7Score . "/21
            - Depresi (PHQ-9): " . $this->phq9Score . "/27
            
            TUGAS ANDA:
            1. Terjemahkan skor GAD-7 & PHQ-9 menjadi label klinis singkat (misal: 'Normal (Skor 3)', 'Cemas Ringan (Skor 6)', dll).
            2. Buat analisis 2 paragraf.
               - Paragraf 1: Analisis pola korelasi antara gaya hidup fisik (tidur, aktivitas) dengan hasil skor mental.
               - Paragraf 2: Berikan maksimal 2-3 rekomendasi 'micro-habits' (langkah kecil yang bisa dilakukan) berbentuk bullet points.
            
            ATURAN KETAT (CRITICAL SAFETY RAILS):
            - DILARANG memberikan diagnosis medis klinis atau menyarankan obat-obatan.
            - Jika skor GAD-7 atau PHQ-9 tinggi (>= 10), respon Anda HARUS menyarankan pengguna untuk mengambil jeda istirahat ekstra atau menghubungi profesional, secara lembut dan tidak menakut-nakuti.
            - Gunakan pemformatan teks yang rapi (Gunakan \\n\\n untuk pemisah antar paragraf).
            
            Keluarkan HANYA dalam format JSON strict:
            {
                \"title\": \"(Judul evaluasi, maks 6 kata)\",
                \"gad7_status\": \"(Label Kecemasan + Skor, cnth: 'Normal (Skor 3)')\",
                \"phq9_status\": \"(Label Depresi + Skor, cnth: 'Ringan (Skor 6)')\",
                \"text\": \"(Paragraf 1 observasi.\\n\\nParagraf 2 berisi poin-poin saran 1... 2... 3...)\"
            }";

            $response = Http::withToken(config('ai.providers.groq.key'))
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a supportive, evidence-based Wellness Coach. Do NOT diagnose. Return ONLY valid JSON.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.5,
                    'response_format' => ['type' => 'json_object'] 
                ]);

            if (!$response->successful()) throw new \Exception("Groq API Error: " . $response->body());

            $jsonText = str_replace(['```json', '```'], '', $response->json('choices.0.message.content'));
            $insightData = json_decode(trim($jsonText), true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $this->user->insights()->create([
                    'period_start' => $logs->last()->log_date ?? now()->subDays(7),
                    'period_end' => $logs->first()->log_date ?? now(),
                    'type' => 'weekly_insight',
                    'content' => $insightData,
                    'ai_provider' => 'groq',
                    'ai_model' => 'llama-3.3-70b-versatile'
                ]);
                
                if (class_exists(\App\Events\InsightGenerated::class)) {
                    event(new \App\Events\InsightGenerated($this->user->id, 'Evaluasi Mingguan klinis kamu sudah siap!', $insightData));
                }
            } else {
                throw new \Exception("JSON Parse Error: " . json_last_error_msg());
            }
        } catch (\Exception $e) {
            Log::error("Gagal generate weekly insight AI: " . $e->getMessage());
        }
    }
}