<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Insight;
use App\Models\HealthLog;

class InsightController extends Controller
{
    public function index(Request $request)
    {
        $query = Insight::where('user_id', $request->user()->id)->orderBy('created_at', 'desc');

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        return $this->successResponse($query->get(), 'Insights retrieved successfully');
    }

    public function dashboard(Request $request)
    {
        $userId = $request->user()->id;

        $latestDaily = Insight::where('user_id', $userId)
                              ->where('type', 'daily_insight')
                              ->latest()
                              ->first();

        $latestWeekly = Insight::where('user_id', $userId)
                               ->where('type', 'weekly_insight')
                               ->latest()
                               ->first();

        $latestLog = HealthLog::where('user_id', $userId)
                              ->orderBy('log_date', 'desc')
                              ->first();

        $recommendedArticles = $this->getSmartArticles($latestLog);

        return $this->successResponse([
            'daily' => $latestDaily,
            'weekly' => $latestWeekly,
            'needs_weekly_assessment' => $request->user()->needs_weekly_assessment,
            'articles' => $recommendedArticles
        ], 'Dashboard data retrieved successfully');
    }

    private function getSmartArticles($latestLog)
    {
        $allArticles = [
            'sleep' => [
                ['id' => 101, 'title' => 'Cara Ampuh Mengatasi Insomnia & Susah Tidur', 'desc' => 'Tidur kurang dari 6 jam bisa merusak mood. Terapkan sleep hygiene malam ini.', 'category' => 'Tidur', 'readTime' => '4 mnt', 'url' => '#'],
                ['id' => 102, 'title' => 'Bahaya Begadang Bagi Fungsi Otak', 'desc' => 'Ketahui apa yang terjadi pada otak dan memori jika Anda kurang tidur.', 'category' => 'Tidur', 'readTime' => '5 mnt', 'url' => '#'],
                ['id' => 103, 'title' => 'Siklus Sirkadian: Kunci Tidur Berkualitas', 'desc' => 'Memahami jam biologis tubuh untuk istirahat yang lebih optimal.', 'category' => 'Tidur', 'readTime' => '3 mnt', 'url' => '#'],
            ],
            'stress' => [
                ['id' => 201, 'title' => 'Teknik Pernapasan 4-7-8 Saat Cemas Melanda', 'desc' => 'Turunkan detak jantung dengan metode pernapasan klinis ini secara instan.', 'category' => 'Psikologi', 'readTime' => '3 mnt', 'url' => '#'],
                ['id' => 202, 'title' => 'Cara Manajemen Stres di Tempat Kerja', 'desc' => 'Tingkat stres Anda terpantau tinggi. Jangan lupa ambil jeda dan stretching.', 'category' => 'Psikologi', 'readTime' => '6 mnt', 'url' => '#'],
                ['id' => 203, 'title' => 'Mengenal Burnout dan Cara Mencegahnya', 'desc' => 'Jangan tunggu sampai kelelahan mental. Kenali tanda-tanda burnout sebelum terlambat.', 'category' => 'Psikologi', 'readTime' => '4 mnt', 'url' => '#'],
            ],
            'water' => [
                ['id' => 301, 'title' => 'Dampak Dehidrasi Ringan Terhadap Fokus', 'desc' => 'Kurang minum bisa memicu brain fog dan sakit kepala. Penuhi 2 liter hari ini!', 'category' => 'Hidrasi', 'readTime' => '3 mnt', 'url' => '#'],
                ['id' => 302, 'title' => 'Waktu Terbaik Minum Air Putih', 'desc' => 'Maksimalkan metabolisme tubuh dengan jadwal minum yang tepat.', 'category' => 'Hidrasi', 'readTime' => '2 mnt', 'url' => '#'],
            ],
            'activity' => [
                ['id' => 401, 'title' => 'Jalan Kaki 30 Menit: Obat Anti-Stres Alami', 'desc' => 'Aktif bergerak memicu endorfin. Yuk sempatkan jalan kaki walau sebentar!', 'category' => 'Aktivitas', 'readTime' => '4 mnt', 'url' => '#'],
                ['id' => 402, 'title' => 'Peregangan Sederhana di Meja Kerja', 'desc' => 'Usir pegal dan kaku otot dengan gerakan simpel ini.', 'category' => 'Aktivitas', 'readTime' => '3 mnt', 'url' => '#'],
            ],
            'general' => [
                ['id' => 501, 'title' => 'Pola Makan Sehat untuk Menjaga Mental', 'desc' => 'Hubungan erat antara pencernaan (gut) dan kesehatan mental (brain) Anda.', 'category' => 'Nutrisi', 'readTime' => '5 mnt', 'url' => '#'],
                ['id' => 502, 'title' => 'Pentingnya "Me-Time" di Akhir Pekan', 'desc' => 'Cara efektif menjaga kewarasan di tengah kesibukan yang tiada henti.', 'category' => 'Gaya Hidup', 'readTime' => '4 mnt', 'url' => '#'],
                ['id' => 503, 'title' => 'Digital Detox: Kapan Harus Berhenti Main HP?', 'desc' => 'Kurangi paparan blue light untuk kualitas hidup yang lebih baik.', 'category' => 'Gaya Hidup', 'readTime' => '5 mnt', 'url' => '#'],
            ]
        ];

        $recommendations = [];

        if (!$latestLog) {
            $recommendations = array_merge($allArticles['general'], $allArticles['sleep'], $allArticles['stress']);
            shuffle($recommendations);
            return array_slice($recommendations, 0, 6);
        }

        if ($latestLog->sleep_hours < 6 || $latestLog->sleep_quality <= 1) {
            $recommendations = array_merge($recommendations, $allArticles['sleep']);
        }
        if ($latestLog->stress_level >= 3 || in_array($latestLog->mood_label, ['anxious', 'sad', 'overwhelmed'])) {
            $recommendations = array_merge($recommendations, $allArticles['stress']);
        }
        if ($latestLog->water_intake_ml < 1500) {
            $recommendations = array_merge($recommendations, $allArticles['water']);
        }
        if ($latestLog->activity_minutes < 20 || $latestLog->activity_type === 'sedentary') {
            $recommendations = array_merge($recommendations, $allArticles['activity']);
        }

        $recommendations = array_unique($recommendations, SORT_REGULAR);

        if (count($recommendations) < 6) {
            $fillers = array_merge($allArticles['general'], $allArticles['sleep'], $allArticles['activity']);
            shuffle($fillers); 
            
            foreach ($fillers as $filler) {
                if (!in_array($filler, $recommendations)) {
                    $recommendations[] = $filler;
                }
                if (count($recommendations) >= 6) break;
            }
        }

        return array_slice($recommendations, 0, 6);
    }
}