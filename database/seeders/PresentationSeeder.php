<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PresentationSeeder extends Seeder
{
    public function run()
    {
        $moods = ['happy', 'calm', 'neutral', 'anxious', 'sad', 'overwhelmed'];
        $activities = ['sedentary', 'walking', 'running', 'cycling', 'gym', 'other'];
        $dummyEmails = ['nama1@gmail.com', 'nama2@gmail.com', 'nama3@gmail.com', 'nama4@gmail.com', 'nama5@gmail.com'];
        $dummyUsers = DB::table('users')->whereIn('email', $dummyEmails)->pluck('id');
        
        if ($dummyUsers->isNotEmpty()) {
            DB::table('insights')->whereIn('user_id', $dummyUsers)->delete();
            DB::table('health_logs')->whereIn('user_id', $dummyUsers)->delete();
            DB::table('users')->whereIn('id', $dummyUsers)->delete();
        }

        for ($i = 1; $i <= 5; $i++) {
            $userId = (string) Str::ulid();
            $email = "nama{$i}@gmail.com";
            
            DB::table('users')->insert([
                'id' => $userId,
                'name' => "Nama User {$i}",
                'email' => $email,
                'password' => Hash::make('password123'),
                'needs_weekly_assessment' => true,
                'timezone' => 'Asia/Jakarta',
                'created_at' => Carbon::now()->subDays(60),
                'updated_at' => Carbon::now()->subDays(60),
            ]);

            for ($day = 60; $day >= 1; $day--) {
                $date = Carbon::today()->subDays($day);
                $dateStr = $date->format('Y-m-d');
                $isWeeklyDay = ($day % 7 == 0);

                if (!$isWeeklyDay && rand(1, 100) <= 20) {
                    continue;
                }

                DB::table('health_logs')->insert([
                    'id' => (string) Str::ulid(),
                    'user_id' => $userId,
                    'log_date' => $dateStr,
                    'mood_score' => rand(5, 9),
                    'mood_label' => $moods[array_rand($moods)],
                    'stress_level' => rand(0, 3),
                    'sleep_hours' => rand(5, 8) + (rand(0, 5) / 10),
                    'sleep_quality' => rand(1, 3),
                    'water_intake_ml' => rand(12, 25) * 100,
                    'activity_type' => $activities[array_rand($activities)],
                    'activity_minutes' => rand(2, 9) * 10,
                    'notes' => "Catatan harian simulasi hari ke-{$day}.",
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                DB::table('insights')->insert([
                    'id' => (string) Str::ulid(),
                    'user_id' => $userId,
                    'type' => 'daily_insight',
                    'content' => json_encode([
                        'title' => 'Insight Harian ' . $date->format('d M'),
                        'text' => 'Berdasarkan catatan hari ini, ritme sirkadianmu cukup stabil. Angka aktivitas fisik dan durasi tidurmu berada di zona aman. Terus kelola tingkat stres dengan metode pernapasan jika mulai merasa kewalahan.'
                    ]),
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                if ($isWeeklyDay) {
                    DB::table('insights')->insert([
                        'id' => (string) Str::ulid(),
                        'user_id' => $userId,
                        'type' => 'weekly_insight',
                        'content' => json_encode([
                            'title' => 'Evaluasi Klinis AI',
                            'gad7_status' => 'Cemas Ringan (Skor '.rand(2,6).')',
                            'phq9_status' => 'Normal (Skor '.rand(0,4).')',
                            'text' => "Evaluasi selama seminggu terakhir menunjukkan tingkat emosional yang fluktuatif namun terkendali. Tidak ditemukan indikasi depresi mayor. Rutinitas tidur dan hidrasi yang kamu catat terbukti ampuh meredam lonjakan kortisol harian."
                        ]),
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);
                }
            }
        }
    }
}