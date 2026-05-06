<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Insight;
use App\Models\HealthLog;
use Carbon\Carbon;

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
        $user = $request->user();
        $userId = $user->id;
        
        $timezone = $user->timezone ?: 'Asia/Jakarta';
        $todayDate = Carbon::now($timezone)->format('Y-m-d'); 

        $logToday = HealthLog::where('user_id', $userId)
            ->where('log_date', $todayDate)
            ->first();

        $latestDaily = null; 
        if ($logToday) {
            $latestDaily = Insight::where('user_id', $userId)
                ->where('type', 'daily_insight')
                ->whereDate('created_at', $todayDate)
                ->latest()
                ->first();
        }

        $latestWeekly = Insight::where('user_id', $userId)
            ->where('type', 'weekly_insight')
            ->latest()
            ->first();

        if ($logToday && $logToday->gad7_responses !== null) {
            if ($latestWeekly && Carbon::parse($latestWeekly->created_at)->timezone($timezone)->format('Y-m-d') !== $todayDate) {
                $latestWeekly = null;
            }
        }

        $latestLog = HealthLog::where('user_id', $userId)
            ->orderBy('log_date', 'desc')
            ->first();

        $recommendedArticles = $this->getSmartArticles($latestLog);

        return $this->successResponse([
            'daily' => $latestDaily, 
            'weekly' => $latestWeekly,
            'needs_weekly_assessment' => (bool) $user->needs_weekly_assessment,
            'articles' => $recommendedArticles
        ], 'Dashboard data retrieved successfully');
    }

    private function getSmartArticles($latestLog)
    {
        $allArticles = [
            'sleep' => [
                ['id' => 101, 'title' => 'Menyiasati Insomnia dan Susah Tidur', 'desc' => 'Tidur kurang dari 6 jam merusak mood. Kenali penyebab dan cara ampuh mengatasinya.', 'category' => 'Tidur', 'readTime' => '4 mnt', 'url' => 'https://www.alodokter.com/menyiasati-insomnia'],
                ['id' => 102, 'title' => 'Akibat Buruk Begadang Bagi Kesehatan Otak', 'desc' => 'Ketahui apa yang terjadi pada memori dan fungsi kognitif jika Anda terus kurang tidur.', 'category' => 'Tidur', 'readTime' => '5 mnt', 'url' => 'https://hellosehat.com/pola-tidur/gangguan-tidur/akibat-begadang-bagi-kesehatan/'],
                ['id' => 103, 'title' => 'Mengenal Ritme Sirkadian (Jam Biologis Tubuh)', 'desc' => 'Memahami jam biologis tubuh untuk mendapatkan jam istirahat yang jauh lebih optimal.', 'category' => 'Tidur', 'readTime' => '4 mnt', 'url' => 'https://www.klikdokter.com/info-sehat/kesehatan-umum/mengenal-ritme-sirkadian-jam-biologis-tubuh-anda'],
                ['id' => 104, 'title' => 'Manfaat Power Nap (Tidur Siang Singkat)', 'desc' => 'Tidur siang 20 menit terbukti ampuh mengembalikan fokus tanpa membuat tubuh terasa lemas.', 'category' => 'Tidur', 'readTime' => '3 mnt', 'url' => 'https://www.alodokter.com/manfaat-power-nap-dan-cara-melakukannya'],
                ['id' => 105, 'title' => 'Kurang Tidur Bisa Bikin Gemuk, Ini Alasannya', 'desc' => 'Kurang istirahat dapat memicu hormon ghrelin yang meningkatkan nafsu makan berlebih keesokan harinya.', 'category' => 'Tidur', 'readTime' => '4 mnt', 'url' => 'https://www.halodoc.com/artikel/kurang-tidur-bisa-bikin-gemuk-ini-alasannya'],
                ['id' => 106, 'title' => 'Cara Tepat Mengatur Jadwal Tidur yang Berantakan', 'desc' => 'Bangun dan tidur di jam yang sama setiap hari sangat vital untuk ritme stabilitas mental.', 'category' => 'Tidur', 'readTime' => '5 mnt', 'url' => 'https://hellosehat.com/pola-tidur/tips-tidur/cara-mengatur-jadwal-tidur/'],
            ],
            
            'stress' => [
                ['id' => 201, 'title' => 'Teknik Pernapasan 4-7-8 untuk Meredakan Cemas', 'desc' => 'Turunkan detak jantung dengan metode pernapasan klinis ini secara instan saat panik.', 'category' => 'Psikologi', 'readTime' => '3 mnt', 'url' => 'https://www.alodokter.com/teknik-pernapasan-4-7-8-untuk-mengatasi-susah-tidur-dan-cemas'],
                ['id' => 202, 'title' => 'Cara Tepat Mengatasi Stres di Tempat Kerja', 'desc' => 'Tingkat stres Anda terpantau tinggi. Jangan lupa ambil jeda dan terapkan manajemen stres ini.', 'category' => 'Psikologi', 'readTime' => '5 mnt', 'url' => 'https://www.halodoc.com/artikel/ini-cara-tepat-mengatasi-stres-di-tempat-kerja'],
                ['id' => 203, 'title' => 'Mengenal Burnout dan Cara Tepat Mengatasinya', 'desc' => 'Jangan tunggu sampai kelelahan mental. Kenali tanda-tanda burnout sebelum terlambat.', 'category' => 'Psikologi', 'readTime' => '4 mnt', 'url' => 'https://www.alodokter.com/mengenal-burnout-dan-cara-mengatasinya'],
                ['id' => 204, 'title' => 'Manfaat Menulis Jurnal (Gratitude Journaling)', 'desc' => 'Menulis hal positif setiap hari terbukti secara klinis menurunkan tingkat hormon stres kortisol.', 'category' => 'Psikologi', 'readTime' => '4 mnt', 'url' => 'https://hellosehat.com/mental/kesehatan-mental/manfaat-menulis-jurnal/'],
                ['id' => 205, 'title' => 'Pentingnya Personal Boundaries untuk Kesehatan Mental', 'desc' => 'Berani membuat batasan diri adalah kunci utama menjaga energi dan kewarasan Anda sehari-hari.', 'category' => 'Psikologi', 'readTime' => '5 mnt', 'url' => 'https://www.klikdokter.com/psikologi/kesehatan-mental/pentingnya-personal-boundaries-untuk-kesehatan-mental'],
                ['id' => 206, 'title' => 'Stres Bisa Turunkan Sistem Imun Tubuh, Fakta?', 'desc' => 'Mengapa saat pikiran terbebani stres, tubuh menjadi jauh lebih rentan terhadap penyakit.', 'category' => 'Psikologi', 'readTime' => '4 mnt', 'url' => 'https://www.halodoc.com/artikel/stres-bisa-turunkan-sistem-imun-tubuh-ini-faktanya'],
            ],

            'water' => [
                ['id' => 301, 'title' => 'Aturan Kebutuhan Air Minum Per Hari (Kemenkes)', 'desc' => 'Panduan resmi medis tentang kebutuhan hidrasi berdasarkan berat badan dan aktivitas.', 'category' => 'Hidrasi', 'readTime' => '3 mnt', 'url' => 'https://ayosehat.kemenkes.go.id/kebutuhan-air-minum-per-hari'],
                ['id' => 302, 'title' => 'Tanda, Bahaya, dan Cara Penanganan Dehidrasi', 'desc' => 'Sering pusing, sulit fokus, dan lemas bisa jadi sinyal darurat sel tubuh Anda kurang cairan.', 'category' => 'Hidrasi', 'readTime' => '4 mnt', 'url' => 'https://www.alodokter.com/dehidrasi'],
                ['id' => 303, 'title' => 'Manfaat Minum Air Putih Setelah Bangun Tidur', 'desc' => 'Segelas air di pagi hari membantu membilas racun dan mengaktifkan organ pencernaan.', 'category' => 'Hidrasi', 'readTime' => '3 mnt', 'url' => 'https://hellosehat.com/nutrisi/fakta-gizi/manfaat-minum-air-putih-di-pagi-hari/'],
                ['id' => 304, 'title' => 'Bahaya Terlalu Sering Minum Minuman Manis', 'desc' => 'Risiko dehidrasi seluler dan lonjakan gula darah jika asupan air putih diganti gula cair.', 'category' => 'Hidrasi', 'readTime' => '5 mnt', 'url' => 'https://www.alodokter.com/bahaya-minuman-manis-bagi-kesehatan'],
                ['id' => 305, 'title' => 'Tips Ampuh Agar Tidak Lupa Minum Air Putih', 'desc' => 'Strategi menjaga hidrasi bagi pekerja kantoran yang sering menatap layar berjam-jam.', 'category' => 'Hidrasi', 'readTime' => '3 mnt', 'url' => 'https://www.klikdokter.com/info-sehat/kesehatan-umum/tips-agar-tidak-lupa-minum-air-putih'],
                ['id' => 306, 'title' => 'Mitos atau Fakta: Minum Air Es Bikin Gemuk?', 'desc' => 'Penjelasan ilmiah medis tentang suhu air minum dan efek sebenarnya pada metabolisme tubuh.', 'category' => 'Hidrasi', 'readTime' => '4 mnt', 'url' => 'https://www.halodoc.com/artikel/mitos-atau-fakta-minum-air-es-bikin-gemuk'],
            ],

            'activity' => [
                ['id' => 401, 'title' => 'Manfaat Luar Biasa Jalan Kaki Setiap Hari', 'desc' => 'Manfaat kardiovaskular dari sekadar berjalan kaki secara rutin untuk stabilitas fisik dan mental.', 'category' => 'Aktivitas', 'readTime' => '4 mnt', 'url' => 'https://www.alodokter.com/manfaat-jalan-kaki-setiap-hari'],
                ['id' => 402, 'title' => 'Bahaya Penyakit Mengintai Akibat Duduk Terlalu Lama', 'desc' => 'Duduk lebih dari 6 jam sehari terbukti dapat meningkatkan risiko penyakit metabolik mematikan.', 'category' => 'Aktivitas', 'readTime' => '5 mnt', 'url' => 'https://hellosehat.com/kebugaran/olahraga-lainnya/bahaya-duduk-terlalu-lama/'],
                ['id' => 403, 'title' => 'Gerakan Peregangan di Meja Kerja Agar Tetap Bugar', 'desc' => 'Usir pegal, mata lelah, dan otot bahu kaku dengan gerakan simpel tanpa beranjak dari kursi.', 'category' => 'Aktivitas', 'readTime' => '3 mnt', 'url' => 'https://www.halodoc.com/artikel/5-gerakan-peregangan-di-meja-kerja-agar-tubuh-tetap-bugar'],
                ['id' => 404, 'title' => 'Beragam Manfaat Latihan Beban Bagi Tubuh', 'desc' => 'Mengapa angkat beban tidak hanya sekadar membentuk otot, tapi juga mencegah osteoporosis.', 'category' => 'Aktivitas', 'readTime' => '5 mnt', 'url' => 'https://www.alodokter.com/beragam-manfaat-latihan-beban-bagi-kesehatan-tubuh'],
                ['id' => 405, 'title' => 'Kardio vs Latihan HIIT: Mana yang Terbaik?', 'desc' => 'Perbedaan intensitas olahraga dan cara panduan cerdas memilihnya sesuai kondisi fisik Anda.', 'category' => 'Aktivitas', 'readTime' => '4 mnt', 'url' => 'https://www.klikdokter.com/kebugaran/olahraga/hiit-vs-kardio-mana-yang-lebih-baik-untuk-bakar-lemak'],
                ['id' => 406, 'title' => 'Olahraga Bisa Tingkatkan Hormon Bahagia Endorfin', 'desc' => 'Fakta medis bagaimana berkeringat 30 menit langsung mendongkrak skor mood harian Anda.', 'category' => 'Aktivitas', 'readTime' => '3 mnt', 'url' => 'https://www.halodoc.com/artikel/olahraga-bisa-meningkatkan-hormon-endorfin-ini-faktanya'],
            ],

            'general' => [
                ['id' => 501, 'title' => 'Hubungan Erat Otak dan Pencernaan (Gut-Brain Axis)', 'desc' => 'Bagaimana asupan serat dan probiotik dapat mempengaruhi 90% produksi hormon bahagia Anda.', 'category' => 'Nutrisi', 'readTime' => '6 mnt', 'url' => 'https://hellosehat.com/pencernaan/kesehatan-pencernaan/hubungan-otak-dan-usus/'],
                ['id' => 502, 'title' => 'Menerapkan Standar "Isi Piringku" Kemenkes RI', 'desc' => 'Panduan proporsi nutrisi karbohidrat, protein, dan sayur ideal untuk menjaga energi harian.', 'category' => 'Nutrisi', 'readTime' => '4 mnt', 'url' => 'https://ayosehat.kemenkes.go.id/isi-piringku'],
                ['id' => 503, 'title' => 'Digital Detox: Manfaat dan Cara Melakukannya', 'desc' => 'Cara ampuh puasa media sosial di akhir pekan untuk menurunkan cemas dan fear of missing out.', 'category' => 'Gaya Hidup', 'readTime' => '5 mnt', 'url' => 'https://www.alodokter.com/digital-detox-ini-manfaat-dan-cara-melakukannya'],
                ['id' => 504, 'title' => 'Kapan Waktu yang Tepat untuk Berjemur Pagi?', 'desc' => 'Berjemur 15 menit sangat krusial meningkatkan kekebalan imun tubuh dan meredakan depresi.', 'category' => 'Gaya Hidup', 'readTime' => '3 mnt', 'url' => 'https://www.halodoc.com/artikel/kapan-waktu-yang-tepat-untuk-berjemur'],
                ['id' => 505, 'title' => 'Aturan Aman Minum Kopi Agar Tidak Berdebar', 'desc' => 'Ketahui batasan maksimal kafein harian agar tidak memicu asam lambung dan kecemasan.', 'category' => 'Nutrisi', 'readTime' => '4 mnt', 'url' => 'https://www.alodokter.com/aturan-aman-minum-kopi-agar-tidak-berdampak-buruk-pada-kesehatan'],
                ['id' => 506, 'title' => 'Manfaat Memiliki Hobi untuk Kesehatan Mental', 'desc' => 'Kegiatan rekreasi sampingan sangat vital untuk mencegah stres dan menjaga work-life balance.', 'category' => 'Gaya Hidup', 'readTime' => '4 mnt', 'url' => 'https://www.klikdokter.com/psikologi/kesehatan-mental/manfaat-memiliki-hobi-untuk-kesehatan-mental'],
            ]
        ];

        if (!isset($allArticles['general'])) {
             $allArticles['general'] = [ ['id' => 501, 'title' => 'Pola Makan Sehat', 'desc' => 'Menjaga mental', 'category' => 'Nutrisi', 'readTime' => '5 mnt', 'url' => '#'] ];
             $allArticles['stress'] = [];
             $allArticles['water'] = [];
             $allArticles['activity'] = [];
        }

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