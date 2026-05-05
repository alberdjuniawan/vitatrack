<?php

namespace App\Jobs;

use App\Models\HealthLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class GenerateDailyInsight implements ShouldQueue
{
    use Queueable;

    public $tries = 3;       
    public $backoff = 60;    

    public function __construct(public HealthLog $healthLog) {}

    public function handle(): void
    {
        $dataToAnalyze = json_encode([
            'date' => $this->healthLog->log_date->format('Y-m-d'),
            'mood' => $this->healthLog->mood_label . ' (' . $this->healthLog->mood_score . '/10)',
            'stress' => $this->healthLog->stress_level . '/4',
            'sleep_hours' => $this->healthLog->sleep_hours,
            'activity' => $this->healthLog->activity_type . ' (' . $this->healthLog->activity_minutes . ' mins)',
            'notes' => $this->healthLog->notes ?? 'Tidak ada catatan.',
        ]);

        try {
            $prompt = "Berikut adalah data check-in kesehatan saya HARI INI:\n" . $dataToAnalyze . "\n
            TUGAS ANDA:
            1. Berikan observasi singkat tentang keseimbangan mood, stres, tidur, dan aktivitas saya.
            2. Berikan SATU saran praktis (micro-habit) yang aman dan berbasis gaya hidup sehat untuk sisa hari ini atau besok.
            
            ATURAN KETAT (CRITICAL SAFETY RAILS):
            - Anda adalah pelatih kebugaran (Wellness Coach), BUKAN dokter.
            - DILARANG KERAS memberikan diagnosis medis, menyarankan pengobatan, atau memberikan nasihat klinis.
            - Gunakan bahasa yang empatik, kasual, dan membumi (Gunakan sapaan 'kamu').
            - Output 'text' HARUS persis SATU PARAGRAF UTUH (maksimal 4-5 kalimat), jangan gunakan bullet points untuk Daily Insight.
            
            Keluarkan HANYA dalam format JSON strict dengan struktur berikut:
            {
                \"title\": \"(Judul singkat maksimal 5 kata, misal: 'Jaga Ritme Tidurmu')\",
                \"text\": \"(Satu paragraf utuh berisi observasi dan 1 tips aman).\"
            }";

            $response = Http::withToken(config('ai.providers.groq.key'))
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are an AI Wellness Assistant. You must follow safety guidelines, never diagnose, and return ONLY valid JSON.'],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.6,
                    'response_format' => ['type' => 'json_object'] 
                ]);

            if (!$response->successful()) throw new \Exception("Groq API Error: " . $response->body());

            $jsonText = str_replace(['```json', '```'], '', $response->json('choices.0.message.content'));
            $insightData = json_decode(trim($jsonText), true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $this->healthLog->user->insights()->create([
                    'period_start' => $this->healthLog->log_date,
                    'period_end' => $this->healthLog->log_date,
                    'type' => 'daily_insight',
                    'content' => $insightData, 
                    'ai_provider' => 'groq',
                    'ai_model' => 'llama-3.3-70b-versatile'
                ]);
                
                if (class_exists(\App\Events\InsightGenerated::class)) {
                    event(new \App\Events\InsightGenerated($this->healthLog->user_id, 'Insight harianmu sudah siap!', $insightData));
                }
            } else {
                throw new \Exception("JSON Parse Error: " . json_last_error_msg());
            }
        } catch (\Exception $e) {
            Log::error("Gagal generate daily insight AI: " . $e->getMessage());
        }
    }
}