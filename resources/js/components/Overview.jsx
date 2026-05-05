import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
    SparklesIcon, PlusIcon, XMarkIcon, FaceSmileIcon, 
    ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon, ClipboardDocumentCheckIcon,
    ArrowPathIcon, InformationCircleIcon, Squares2X2Icon
} from '@heroicons/react/24/solid';
import { 
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
    LineChart, Line, BarChart, Bar, AreaChart, Area, LabelList,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const gad7Questions = [
    "Merasa gugup, cemas, atau tegang.", "Tidak mampu menghentikan atau mengendalikan kekhawatiran.",
    "Terlalu mengkhawatirkan berbagai hal.", "Kesulitan untuk bersantai.",
    "Sangat gelisah sehingga sulit untuk duduk diam.", "Menjadi mudah jengkel atau marah.",
    "Merasa takut seolah-olah sesuatu yang buruk akan terjadi."
];

const phq9Questions = [
    "Kurang berminat atau bergairah dalam melakukan apapun.", "Merasa murung, sedih, atau putus asa.",
    "Sulit tidur/tetap tidur, atau tidur terlalu banyak.", "Merasa lelah atau kurang bertenaga.",
    "Kurang nafsu makan atau makan terlalu banyak.", "Kurang percaya diri, merasa sebagai orang yang gagal.",
    "Sulit berkonsentrasi pada sesuatu, misalnya membaca atau menonton.",
    "Bergerak/berbicara sangat lambat, atau sebaliknya merasa resah/gelisah berlebihan.",
    "Merasa lebih baik mati atau ingin melukai diri sendiri dengan cara apapun."
];

const optionsScale = [
    { value: 0, label: "Tidak Pernah" }, { value: 1, label: "Beberapa Hari" },
    { value: 2, label: "Lebih dari Separuh Waktu" }, { value: 3, label: "Hampir Setiap Hari" }
];

export default function Overview() {
    const [chartData, setChartData] = useState({ sleep: [], moodStress: [], activity: [], water: [] });
    const [dailyInsight, setDailyInsight] = useState(null);
    const [weeklyInsight, setWeeklyInsight] = useState(null);
    const [recommendedArticles, setRecommendedArticles] = useState([]);
    const [activeView, setActiveView] = useState('artikel'); 
    const [timeframe, setTimeframe] = useState('7');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [step, setStep] = useState(1);
    const [dailyCardStatus, setDailyCardStatus] = useState('active'); 
    const [isWeeklyInsightOpen, setIsWeeklyInsightOpen] = useState(false);

    const [formData, setFormData] = useState({
        log_date: new Date().toLocaleDateString('en-CA'),
        mood_score: 7, mood_label: 'happy', stress_level: 1,
        sleep_hours: 7, sleep_quality: 2, water_intake_ml: 1500,
        activity_type: 'walking', activity_minutes: 30, notes: '', 
    });

    const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
    const [weeklyStep, setWeeklyStep] = useState(1);
    const [gad7Responses, setGad7Responses] = useState(Array(7).fill(null));
    const [phq9Responses, setPhq9Responses] = useState(Array(9).fill(null));
    const [weeklyCardStatus, setWeeklyCardStatus] = useState('active'); 

    const dailyScrollRef = useRef(null);
    const weeklyScrollRef = useRef(null);

    useEffect(() => {
        fetchDashboardData();
    }, [timeframe]);

    const fetchDashboardData = async () => {
        try {
            const insightRes = await axios.get('/api/insights/dashboard');
            const { daily, weekly, needs_weekly_assessment, articles } = insightRes.data.data;
            
            if (daily) {
                setDailyInsight(daily.content.text);
                setDailyCardStatus('completed');
            }
            if (weekly) setWeeklyInsight(weekly.content);
            if (articles) setRecommendedArticles(articles);
            
            setWeeklyCardStatus(needs_weekly_assessment ? 'active' : 'hidden');

            const logsRes = await axios.get(`/api/health-logs?timeframe=${timeframe}`);
            const logs = logsRes.data.data;

            const aggregateLogs = (logsArray, label) => {
                if (logsArray.length === 0) return null;
                const sum = (key) => logsArray.reduce((acc, curr) => acc + (parseFloat(curr[key]) || 0), 0);
                const avg = (key) => sum(key) / logsArray.length;
                return {
                    day: label,
                    hours: parseFloat(avg('sleep_hours').toFixed(1)),
                    mood: parseFloat(avg('mood_score').toFixed(1)),
                    stress: parseFloat(avg('stress_level').toFixed(1)),
                    minutes: sum('activity_minutes'),
                    ml: sum('water_intake_ml')
                };
            };

            let aggregated = [];

            if (logs.length > 0) {
                if (timeframe === '7') {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                    aggregated = logs.map(log => {
                        const [y, m, d] = log.log_date.split('-');
                        return aggregateLogs([log], `${parseInt(d)} ${months[parseInt(m)-1]}`);
                    });
                } else if (timeframe === '30') {
                    const chunkSize = Math.ceil(logs.length / 4) || 1;
                    for (let i = 0; i < 4; i++) {
                        const chunk = logs.slice(i * chunkSize, (i + 1) * chunkSize);
                        if (chunk.length > 0) aggregated.push(aggregateLogs(chunk, `Mg ${i + 1}`));
                    }
                } else if (timeframe === '365') {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                    const groupedByMonth = {};
                    logs.forEach(log => {
                        const [y, m, d] = log.log_date.split('-');
                        const monthIdx = parseInt(m) - 1;
                        if (!groupedByMonth[monthIdx]) groupedByMonth[monthIdx] = [];
                        groupedByMonth[monthIdx].push(log);
                    });
                    aggregated = Object.keys(groupedByMonth).sort((a,b) => a-b).map(mIdx => 
                        aggregateLogs(groupedByMonth[mIdx], months[mIdx])
                    );
                }
            }

            setChartData({
                sleep: aggregated.map(d => ({ day: d.day, hours: d.hours })),
                moodStress: aggregated.map(d => ({ day: d.day, mood: d.mood, stress: d.stress })),
                activity: aggregated.map(d => ({ day: d.day, minutes: d.minutes })),
                water: aggregated.map(d => ({ day: d.day, ml: d.ml }))
            });

        } catch (error) {
            console.error("Gagal menarik data:", error);
        }
    };

    useEffect(() => {
        let pollInterval;
        if (dailyCardStatus === 'processing' || weeklyCardStatus === 'completed') {
            pollInterval = setInterval(() => {
                fetchDashboardData();
            }, 3000); 
        }
        return () => clearInterval(pollInterval);
    }, [dailyCardStatus, weeklyCardStatus]);

    const handleCheckInSubmit = async () => {
        setLoadingSubmit(true);
        try {
            await axios.post('/api/health-logs', formData);
            resetModal(); 
            setDailyCardStatus('processing'); 
        } catch (error) {
            console.error("Gagal check-in:", error);
            alert("Terjadi kesalahan.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleWeeklySubmit = async () => {
        setLoadingSubmit(true);
        try {
            await axios.post('/api/assessments/weekly', {
                gad7_responses: gad7Responses,
                phq9_responses: phq9Responses
            });
            resetWeeklyModal(); 
            setWeeklyCardStatus('completed'); 
        } catch (error) {
            console.error("Gagal evaluasi:", error);
            alert("Terjadi kesalahan.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    useEffect(() => { if (dailyScrollRef.current) dailyScrollRef.current.scrollTop = 0; }, [step]);
    useEffect(() => { if (weeklyScrollRef.current) weeklyScrollRef.current.scrollTop = 0; }, [weeklyStep]);

    const resetModal = () => { setIsModalOpen(false); setTimeout(() => setStep(1), 300); };
    const resetWeeklyModal = () => { setIsWeeklyModalOpen(false); setTimeout(() => setWeeklyStep(1), 300); };

    const isDailyValid = () => {
        if (step === 2) return formData.sleep_hours !== '' && formData.water_intake_ml !== '';
        if (step === 3) return formData.activity_minutes !== '';
        return true;
    };

    const isWeeklyValid = () => {
        if (weeklyStep === 1) return !gad7Responses.includes(null);
        if (weeklyStep === 2) return !phq9Responses.includes(null);
        return true;
    };

    const handleNumberChange = (field, value, max, min = 0) => {
        if (value === '') {
            setFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        let num = parseFloat(value);
        if (!isNaN(num)) {
            if (num > max) num = max;
            if (num < min) num = min;
            setFormData(prev => ({ ...prev, [field]: num }));
        }
    };

    const updateNumber = (field, stepVal, max, min = 0) => {
        setFormData(prev => {
            let current = prev[field] === '' || isNaN(prev[field]) ? 0 : parseFloat(prev[field]);
            let newVal = parseFloat((current + stepVal).toFixed(1)); 
            if (newVal < min) newVal = min;
            if (newVal > max) newVal = max;
            return { ...prev, [field]: newVal };
        });
    };

    const blockInvalidChar = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

    const renderEmpty = () => (
        <div className="flex items-center justify-center w-full h-full text-slate-400 font-medium text-sm">
            Belum ada data
        </div>
    );

    const renderFilterDropdown = () => (
        <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-bold outline-none cursor-pointer text-xs md:text-sm px-3 py-2 rounded-lg hover:border-teal-400 transition-colors relative z-20"
        >
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="365">Tahun Ini</option>
        </select>
    );

    const renderSleepChart = (isDetailed = false) => (
        <div className={`bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white flex flex-col ${isDetailed ? 'min-h-[500px] md:min-h-[600px]' : 'h-[340px]'} animate-fade-in-up relative z-10`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-base md:text-lg font-extrabold text-slate-700">Durasi Tidur (Jam)</h3>
                {isDetailed && renderFilterDropdown()}
            </div>
            <div className={`flex-1 w-full ${isDetailed ? 'min-h-[350px] md:min-h-[450px]' : 'min-h-[200px]'}`}>
                {chartData.sleep.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.sleep} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs><linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="hours" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorSleep)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : renderEmpty()}
            </div>
            {isDetailed && chartData.sleep.length > 0 && (
                <div className="mt-6 p-4 md:p-5 bg-teal-50/50 border border-teal-100/50 rounded-xl flex gap-3 items-start animate-fade-in shrink-0">
                    <InformationCircleIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm md:text-base font-bold text-teal-800 mb-1">Informasi Metrik</h4>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">Grafik ini melacak total durasi tidur Anda. Data ini direkam langsung dari input <b>Daily Check-in</b> Anda. Pola tidur yang konsisten sangat krusial untuk pemulihan energi, fungsi otak, dan stabilitas mood harian Anda.</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMoodChart = (isDetailed = false) => (
        <div className={`bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white flex flex-col ${isDetailed ? 'min-h-[500px] md:min-h-[600px]' : 'h-[340px]'} animate-fade-in-up relative z-10`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-base md:text-lg font-extrabold text-slate-700">Skor Mood vs Stres</h3>
                {isDetailed && renderFilterDropdown()}
            </div>
            <div className={`flex-1 w-full ${isDetailed ? 'min-h-[350px] md:min-h-[450px]' : 'min-h-[200px]'}`}>
                {chartData.moodStress.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.moodStress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: 'bold' }} />
                            <Line type="monotone" dataKey="mood" name="Mood (1-10)" stroke="#0ea5e9" strokeWidth={4} dot={{r: 5}} activeDot={{r: 8}} />
                            <Line type="monotone" dataKey="stress" name="Stres (0-4)" stroke="#f43f5e" strokeWidth={4} dot={{r: 5}} activeDot={{r: 8}} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : renderEmpty()}
            </div>
            {isDetailed && chartData.moodStress.length > 0 && (
                <div className="mt-6 p-4 md:p-5 bg-teal-50/50 border border-teal-100/50 rounded-xl flex gap-3 items-start animate-fade-in shrink-0">
                    <InformationCircleIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm md:text-base font-bold text-teal-800 mb-1">Informasi Metrik</h4>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">Membandingkan fluktuasi skor mood (1-10) dengan tingkat stres (0-4). Melalui grafik ini, AI dapat memetakan korelasi antara pemicu stres harian dan kondisi emosional Anda secara akurat berdasarkan jurnal Anda.</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderActivityChart = (isDetailed = false) => (
        <div className={`bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white flex flex-col ${isDetailed ? 'min-h-[500px] md:min-h-[600px]' : 'h-[340px]'} animate-fade-in-up relative z-10`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-base md:text-lg font-extrabold text-slate-700">Aktivitas Fisik (Menit)</h3>
                {isDetailed && renderFilterDropdown()}
            </div>
            <div className={`flex-1 w-full ${isDetailed ? 'min-h-[350px] md:min-h-[450px]' : 'min-h-[200px]'}`}>
                {chartData.activity.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={35}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                            <Bar dataKey="minutes" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : renderEmpty()}
            </div>
            {isDetailed && chartData.activity.length > 0 && (
                <div className="mt-6 p-4 md:p-5 bg-teal-50/50 border border-teal-100/50 rounded-xl flex gap-3 items-start animate-fade-in shrink-0">
                    <InformationCircleIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm md:text-base font-bold text-teal-800 mb-1">Informasi Metrik</h4>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">Merekam total durasi aktivitas fisik harian Anda. Diambil dari catatan <b>Daily Check-in</b>, metrik ini membantu memastikan Anda tetap aktif bergerak untuk menjaga kebugaran fisik dan memicu pelepasan hormon endorfin alami.</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderWaterChart = (isDetailed = false) => (
        <div className={`bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white flex flex-col ${isDetailed ? 'min-h-[500px] md:min-h-[600px]' : 'h-[340px]'} animate-fade-in-up relative z-10`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-base md:text-lg font-extrabold text-slate-700">Konsumsi Air (ml)</h3>
                {isDetailed && renderFilterDropdown()}
            </div>
            <div className={`flex-1 w-full ${isDetailed ? 'min-h-[350px] md:min-h-[450px]' : 'min-h-[200px]'}`}>
                {chartData.water.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData.water} margin={{ top: 0, right: 30, left: -10, bottom: 0 }} barSize={28}>
                            <defs><linearGradient id="colorWater" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.8}/><stop offset="100%" stopColor="#0ea5e9" stopOpacity={1}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                            <Tooltip cursor={{fill: '#f0f9ff'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                            <Bar dataKey="ml" fill="url(#colorWater)" radius={[0, 10, 10, 0]}><LabelList dataKey="ml" position="insideRight" fill="#ffffff" fontWeight="bold" fontSize={11} formatter={(val) => `${val} ml`} dx={-10} /></Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : renderEmpty()}
            </div>
            {isDetailed && chartData.water.length > 0 && (
                <div className="mt-6 p-4 md:p-5 bg-teal-50/50 border border-teal-100/50 rounded-xl flex gap-3 items-start animate-fade-in shrink-0">
                    <InformationCircleIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm md:text-base font-bold text-teal-800 mb-1">Informasi Metrik</h4>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">Memantau asupan cairan harian Anda dalam satuan mililiter (ml). Dehidrasi ringan terbukti dapat menurunkan fokus secara drastis dan memperburuk gejala stres, sehingga AI memantau tren ini secara ketat.</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 md:gap-8 animate-fade-in pb-10 relative z-10">
            <div className="bg-white/90 backdrop-blur-md p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] flex flex-row justify-between items-start md:items-center gap-4 md:gap-6 border border-white shrink-0 relative z-10 mx-0 md:mx-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Dashboard Overview</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm md:text-base hidden md:block">Ringkasan aktivitas dan rekomendasi harian untukmu.</p>
                </div>

                <div className="md:hidden shrink-0 mt-0.5">
                    <select 
                        value={activeView}
                        onChange={(e) => setActiveView(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 font-bold outline-none px-3 py-2 rounded-xl focus:ring-2 focus:ring-teal-500 shadow-sm appearance-none cursor-pointer text-xs"
                        style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '1.5rem' }}
                    >
                        <option value="artikel">Artikel</option>
                        <option value="tidur">Tidur</option>
                        <option value="mood">Mood</option>
                        <option value="aktivitas">Aktivitas</option>
                        <option value="air">Air</option>
                        <option value="semua">Semua Grafik</option>
                    </select>
                </div>

                <div className="hidden md:flex w-full xl:w-auto bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'artikel', label: 'Artikel' },
                        { id: 'tidur', label: 'Tidur' },
                        { id: 'mood', label: 'Mood' },
                        { id: 'aktivitas', label: 'Aktivitas' },
                        { id: 'air', label: 'Air' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                                activeView === tab.id 
                                ? 'bg-white text-teal-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    
                    <button
                        onClick={() => setActiveView('semua')}
                        className={`flex items-center justify-center p-2 rounded-lg transition-all ml-1 shrink-0 ${
                            activeView === 'semua' 
                            ? 'bg-white text-teal-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                        title="Tampilkan Semua Grafik"
                    >
                        <Squares2X2Icon className="w-5 h-5 stroke-2" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
                
                <div className="xl:col-span-2 flex flex-col gap-6">
                    
                    {activeView === 'artikel' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up">
                            {recommendedArticles.length > 0 ? recommendedArticles.map(art => (
                                <a href={art.url} target="_blank" rel="noopener noreferrer" key={art.id} className="bg-white/90 backdrop-blur-sm border border-white p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.04)] hover:shadow-[0_8px_30px_rgb(13,148,136,0.1)] hover:border-teal-200 transition-all flex flex-col h-full group cursor-pointer">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="bg-teal-50 text-teal-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-teal-100">{art.category}</span>
                                        <span className="text-slate-400 text-xs font-bold flex items-center gap-1"><DocumentTextIcon className="w-4 h-4"/> {art.readTime}</span>
                                    </div>
                                    <h3 className="text-lg font-extrabold text-slate-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-2">{art.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">{art.desc}</p>
                                    <div className="mt-auto flex items-center gap-1 text-teal-600 font-bold text-sm border-t border-slate-50 pt-4">
                                        Baca Artikel <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </a>
                            )) : (
                                <div className="col-span-1 sm:col-span-2 text-center py-10 text-slate-400 font-medium">Belum ada rekomendasi artikel saat ini.</div>
                            )}
                        </div>
                    )}

                    {activeView === 'semua' && (
                        <div className="flex flex-col gap-4 animate-fade-in-up">
                            <div className="flex justify-end mb-2">
                                {renderFilterDropdown()}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                {renderSleepChart(false)}
                                {renderMoodChart(false)}
                                {renderActivityChart(false)}
                                {renderWaterChart(false)}
                            </div>
                        </div>
                    )}

                    {activeView === 'tidur' && renderSleepChart(true)}
                    {activeView === 'mood' && renderMoodChart(true)}
                    {activeView === 'aktivitas' && renderActivityChart(true)}
                    {activeView === 'air' && renderWaterChart(true)}

                </div>

                <div className="xl:col-span-1 flex flex-col gap-8 h-full w-full overflow-hidden">
                    
                    <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row w-full gap-4 overflow-hidden p-1">
                        
                        {/* CARD 1: DAILY CHECK-IN */}
                        <div className="flex-1 transition-all duration-700 ease-in-out min-w-[250px] w-full">
                            {dailyCardStatus === 'active' && (
                                <button onClick={() => setIsModalOpen(true)} className="w-full bg-white/90 backdrop-blur-sm border border-white rounded-[2rem] p-6 flex flex-col items-center justify-center hover:bg-teal-50 hover:border-teal-400 transition-all group shadow-sm min-h-[200px] h-full">
                                    <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-300"><PlusIcon className="w-7 h-7 text-teal-600 group-hover:text-white stroke-2" /></div>
                                    <h3 className="font-extrabold text-slate-800 text-lg md:text-xl mb-1 transition-colors">Check-in Harian</h3>
                                    <p className="text-slate-500 text-xs md:text-sm font-medium text-center">Catat harimu untuk insight AI.</p>
                                </button>
                            )}

                            {dailyCardStatus === 'processing' && (
                                <div className="w-full bg-teal-600 rounded-[2rem] p-6 flex flex-col shadow-xl shadow-teal-200/50 text-white min-h-[200px] h-full animate-fade-in-up border border-teal-500 relative overflow-hidden justify-center items-center text-center">
                                    <ArrowPathIcon className="w-10 h-10 animate-spin text-teal-200 mb-3" />
                                    <h3 className="font-extrabold text-xl relative z-10 mb-1">Menganalisis...</h3>
                                    <p className="text-teal-100 text-xs relative z-10">AI sedang memproses data.</p>
                                </div>
                            )}

                            {dailyCardStatus === 'completed' && dailyInsight && (
                                <div className="w-full bg-teal-600 rounded-[2rem] p-6 flex flex-col shadow-xl shadow-teal-200/50 text-white min-h-[200px] h-full animate-fade-in-up border border-teal-500 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="flex items-center gap-3 mb-3 relative z-10 shrink-0">
                                        <FaceSmileIcon className="w-7 h-7 text-teal-200" />
                                        <h3 className="font-extrabold text-lg">Insight Harian</h3>
                                    </div>
                                    <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                        <p className="text-teal-50 text-sm leading-relaxed whitespace-pre-wrap">
                                            {dailyInsight}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CARD 2: WEEKLY ASSESSMENT */}
                        {weeklyCardStatus !== 'hidden' && dailyCardStatus === 'completed' && (
                            <div className={`transition-all duration-700 ease-in-out flex-none origin-right overflow-hidden ${
                                weeklyCardStatus === 'exiting' 
                                ? 'w-0 opacity-0 translate-x-full' 
                                : 'w-full sm:w-[calc(50%-0.5rem)] xl:w-full 2xl:w-[calc(50%-0.5rem)] opacity-100'
                            }`}>
                                <div className="w-full h-full min-w-[250px]">
                                    {weeklyCardStatus === 'active' ? (
                                        <button onClick={() => setIsWeeklyModalOpen(true)} className="w-full h-full bg-white/90 backdrop-blur-sm border border-white rounded-[2rem] p-6 flex flex-col items-center justify-center hover:bg-teal-50 hover:border-teal-400 transition-all group shadow-sm min-h-[200px] relative">
                                            <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span></span>
                                            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-300"><ClipboardDocumentCheckIcon className="w-7 h-7 text-teal-600 group-hover:text-white stroke-2" /></div>
                                            <h3 className="font-extrabold text-slate-800 text-lg md:text-xl mb-1 transition-colors">Tes Mingguan</h3>
                                            <p className="text-slate-500 text-xs md:text-sm font-medium text-center">Evaluasi kesehatan mentalmu.</p>
                                        </button>
                                    ) : (
                                        <div className="w-full h-full bg-teal-600 rounded-[2rem] p-6 flex flex-col shadow-xl shadow-teal-200/50 text-white min-h-[200px] border border-teal-500 relative justify-center items-center text-center">
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                            <CheckCircleIcon className="w-12 h-12 text-teal-200 mb-3 relative z-10" />
                                            <h3 className="font-extrabold text-xl relative z-10 mb-1">Tes Selesai!</h3>
                                            <p className="text-teal-50 text-xs relative z-10">Menganalisis hasil...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI ASSISTANT CARD (WEEKLY INSIGHT) */}
                    <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] border border-white flex flex-col flex-1 overflow-hidden min-h-[350px] shadow-[0_4px_20px_rgb(13,148,136,0.06)] mt-2">
                        <div className="flex items-center gap-3 mb-6 shrink-0"><SparklesIcon className="w-8 h-8 text-teal-600" /><h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">AI Health Assistant</h2></div>
                        <p className="text-base font-bold text-teal-700 mb-6 shrink-0">Evaluasi Mingguan</p>
                        
                        <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1 custom-scrollbar">
                            {dailyCardStatus !== 'completed' ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <ClipboardDocumentCheckIcon className="w-12 h-12 text-slate-200 mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">Selesaikan Check-in Harian terlebih dahulu untuk membuka Evaluasi Mingguan.</p>
                                </div>
                            ) : weeklyCardStatus === 'active' ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <ClipboardDocumentCheckIcon className="w-12 h-12 text-slate-200 mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">Selesaikan Tes Mingguan di atas untuk melihat analisis mendalam klinis dari AI.</p>
                                </div>
                            ) : weeklyInsight ? (
                                <>
                                    <div className="bg-[#F4FAFA] p-5 rounded-2xl border border-teal-50 hover:border-teal-200 hover:shadow-sm transition-all animate-fade-in-up flex flex-col">
                                        <p className="text-slate-600 font-medium leading-relaxed text-sm whitespace-pre-wrap line-clamp-3 mb-3">{weeklyInsight.text}</p>
                                        <button 
                                            onClick={() => setIsWeeklyInsightOpen(true)} 
                                            className="self-start text-teal-600 hover:text-teal-700 text-xs font-bold transition-colors flex items-center gap-1"
                                        >
                                            Baca evaluasi lengkap <ArrowRightIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex gap-4 mt-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                                        <div className="flex-1 bg-white border border-slate-100 p-4 rounded-xl text-center">
                                            <span className="block text-xs font-bold text-slate-400 mb-1">Status Kecemasan</span>
                                            <span className="font-extrabold text-sm text-teal-700">{weeklyInsight.gad7_status}</span>
                                        </div>
                                        <div className="flex-1 bg-white border border-slate-100 p-4 rounded-xl text-center">
                                            <span className="block text-xs font-bold text-slate-400 mb-1">Status Depresi</span>
                                            <span className="font-extrabold text-sm text-teal-700">{weeklyInsight.phq9_status}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <ArrowPathIcon className="w-8 h-8 text-teal-600 animate-spin mb-3" />
                                    <p className="text-slate-500 font-medium text-sm">Menunggu analisis AI...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* WEEKLY INSIGHT AI */}
            {isWeeklyInsightOpen && weeklyInsight && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-ubuntu">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col animate-scale-up overflow-hidden max-h-[90vh]">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-teal-50 shrink-0">
                            <div className="flex items-center gap-3"><SparklesIcon className="w-8 h-8 text-teal-600" /><h3 className="font-extrabold text-xl text-slate-800">Evaluasi Klinis AI</h3></div>
                            <button onClick={() => setIsWeeklyInsightOpen(false)} className="p-2 md:p-3 bg-white hover:bg-slate-100 rounded-full transition-colors"><XMarkIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-600 stroke-2" /></button>
                        </div>
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                                    <span className="block text-xs font-bold text-slate-400 mb-1">Kecemasan (GAD-7)</span>
                                    <span className="font-extrabold text-sm text-teal-700">{weeklyInsight.gad7_status}</span>
                                </div>
                                <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                                    <span className="block text-xs font-bold text-slate-400 mb-1">Depresi (PHQ-9)</span>
                                    <span className="font-extrabold text-sm text-teal-700">{weeklyInsight.phq9_status}</span>
                                </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed font-medium text-base whitespace-pre-wrap">{weeklyInsight.text}</p>
                            <button onClick={() => setIsWeeklyInsightOpen(false)} className="w-full mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-teal-200/50 shrink-0">Tutup Evaluasi</button>
                        </div>
                    </div>
                </div>
            , document.body)}

            {/* MODAL 1: WEEKLY ASSESSMENT */}
            {isWeeklyModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto py-10 font-ubuntu">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col animate-scale-up overflow-hidden max-h-[90vh]">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="font-extrabold text-xl md:text-2xl text-slate-800">Evaluasi Mingguan</h3>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${weeklyStep >= 1 ? 'w-10 bg-teal-500' : 'w-4 bg-slate-200'}`}></div>
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${weeklyStep >= 2 ? 'w-10 bg-teal-500' : 'w-4 bg-slate-200'}`}></div>
                                </div>
                            </div>
                            <button onClick={resetWeeklyModal} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><XMarkIcon className="w-6 h-6 text-slate-600" /></button>
                        </div>
                        <div ref={weeklyScrollRef} className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                            {weeklyStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="mb-2"><h4 className="text-lg md:text-xl font-bold text-slate-800">Skrining Kecemasan (GAD-7)</h4><p className="text-slate-500 text-sm mt-1">Dalam 7 hari terakhir, seberapa sering Anda terganggu oleh masalah berikut?</p></div>
                                    <div className="space-y-6">
                                        {gad7Questions.map((q, index) => (
                                            <div key={index} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                                <p className="font-bold text-slate-700 mb-4">{index + 1}. {q}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {optionsScale.map(opt => (
                                                        <button key={opt.value} onClick={() => { const newRes = [...gad7Responses]; newRes[index] = opt.value; setGad7Responses(newRes); }} className={`p-2 rounded-xl text-xs font-bold transition-all border ${gad7Responses[index] === opt.value ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-teal-50 hover:border-teal-200'}`}>{opt.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {weeklyStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="mb-2"><h4 className="text-lg md:text-xl font-bold text-slate-800">Skrining Depresi (PHQ-9)</h4><p className="text-slate-500 text-sm mt-1">Dalam 7 hari terakhir, seberapa sering Anda terganggu oleh masalah berikut?</p></div>
                                    <div className="space-y-6">
                                        {phq9Questions.map((q, index) => (
                                            <div key={index} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                                <p className="font-bold text-slate-700 mb-4">{index + 1}. {q}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {optionsScale.map(opt => (
                                                        <button key={opt.value} onClick={() => { const newRes = [...phq9Responses]; newRes[index] = opt.value; setPhq9Responses(newRes); }} className={`p-2 rounded-xl text-xs font-bold transition-all border ${phq9Responses[index] === opt.value ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-teal-50 hover:border-teal-200'}`}>{opt.label}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 shrink-0 bg-white flex gap-4">
                            {weeklyStep === 2 && <button onClick={() => setWeeklyStep(1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2"><ArrowLeftIcon className="w-5 h-5 stroke-2" /> Kembali</button>}
                            <button onClick={weeklyStep < 2 ? () => setWeeklyStep(2) : handleWeeklySubmit} disabled={!isWeeklyValid() || loadingSubmit} className={`flex-[2] font-bold py-3 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${!isWeeklyValid() || loadingSubmit ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50'}`}>
                                {loadingSubmit ? 'Memproses...' : weeklyStep < 2 ? <>Lanjut <ArrowRightIcon className="w-5 h-5 stroke-2" /></> : <><CheckCircleIcon className="w-6 h-6 stroke-2" /> Kirim Evaluasi</>}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}

            {/* MODAL 2: DAILY CHECK-IN */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-ubuntu">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col animate-scale-up overflow-hidden max-h-[90vh]">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="font-extrabold text-xl md:text-2xl text-slate-800">Check-in Harian</h3>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= 1 ? 'w-10 bg-teal-500' : 'w-4 bg-slate-200'}`}></div>
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= 2 ? 'w-10 bg-teal-500' : 'w-4 bg-slate-200'}`}></div>
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= 3 ? 'w-10 bg-teal-500' : 'w-4 bg-slate-200'}`}></div>
                                </div>
                            </div>
                            <button onClick={resetModal} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><XMarkIcon className="w-6 h-6 text-slate-600" /></button>
                        </div>
                        <div ref={dailyScrollRef} className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                            {step === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-6"><h4 className="text-lg md:text-xl font-bold text-slate-800">Bagaimana Perasaanmu?</h4><p className="text-slate-500 text-sm mt-1">Ceritakan sedikit tentang mood dan tingkat stresmu.</p></div>
                                    <div>
                                        <div className="flex justify-between items-center mb-3"><label className="block text-sm font-bold text-slate-700">Skor Mood (1-10)</label><span className="text-teal-600 font-extrabold">{formData.mood_score}/10</span></div>
                                        <div className="w-full bg-slate-50 p-2 md:p-3 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
                                            <div className="flex justify-between items-center w-full min-w-[340px] md:min-w-full gap-1 sm:gap-2 px-1">
                                                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                    <button key={num} onClick={() => setFormData({...formData, mood_score: num})} className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-all ${formData.mood_score === num ? 'bg-teal-600 text-white scale-110 shadow-md' : 'bg-white text-slate-400 hover:bg-teal-100 border border-slate-200'}`}>{num}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Label Mood</label><select value={formData.mood_label} onChange={(e) => setFormData({...formData, mood_label: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600"><option value="happy">Senang</option><option value="sad">Sedih</option><option value="anxious">Gelisah</option><option value="angry">Marah</option><option value="calm">Tenang</option><option value="overwhelmed">Kewalahan</option><option value="neutral">Netral</option></select></div>
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Tingkat Stres</label><select value={formData.stress_level} onChange={(e) => setFormData({...formData, stress_level: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600"><option value="0">0 - Tidak Ada</option><option value="1">1 - Ringan</option><option value="2">2 - Sedang</option><option value="3">3 - Tinggi</option><option value="4">4 - Sangat Tinggi</option></select></div>
                                    </div>
                                </div>
                            )}
                            {step === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <h4 className="text-lg md:text-xl font-bold text-slate-800">Istirahat & Hidrasi</h4>
                                        <p className="text-slate-500 text-sm mt-1">Gimana tidurmu semalam dan minummu hari ini?</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Tidur (Jam)</label>
                                            <div className={`flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500`}>
                                                <button onClick={() => updateNumber('sleep_hours', -0.5, 24)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">-</button>
                                                <input type="number" value={formData.sleep_hours} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('sleep_hours', e.target.value, 24)} className={`flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700`} />
                                                <button onClick={() => updateNumber('sleep_hours', 0.5, 24)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">+</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Kualitas Tidur</label>
                                            <select value={formData.sleep_quality} onChange={(e) => setFormData({...formData, sleep_quality: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600"><option value="0">Sangat Buruk</option><option value="1">Buruk</option><option value="2">Baik</option><option value="3">Sangat Baik</option></select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Konsumsi Air (ml)</label>
                                        <div className={`flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500`}>
                                            <button onClick={() => updateNumber('water_intake_ml', -100, 30000)} className="w-14 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">-</button>
                                            <input type="number" value={formData.water_intake_ml} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('water_intake_ml', e.target.value, 30000)} className={`flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700`} />
                                            <button onClick={() => updateNumber('water_intake_ml', 100, 30000)} className="w-14 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">+</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="text-center mb-6"><h4 className="text-lg md:text-xl font-bold text-slate-800">Aktivitas & Jurnal</h4><p className="text-slate-500 text-sm mt-1">Langkah terakhir! Apa pergerakan fisik dan ceritamu hari ini?</p></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Jenis Aktivitas</label><select value={formData.activity_type} onChange={(e) => setFormData({...formData, activity_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600"><option value="sedentary">Duduk/Rebahan</option><option value="walking">Jalan Kaki</option><option value="running">Lari</option><option value="cycling">Bersepeda</option><option value="gym">Gym / Workout</option><option value="sport">Olahraga Lain</option><option value="other">Lainnya</option></select></div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Durasi (Menit)</label>
                                            <div className={`flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500`}>
                                                <button onClick={() => updateNumber('activity_minutes', -5, 1440)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">-</button>
                                                <input type="number" value={formData.activity_minutes} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('activity_minutes', e.target.value, 1440)} className={`flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700`} />
                                                <button onClick={() => updateNumber('activity_minutes', 5, 1440)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Harian (Opsional)</label>
                                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Gimana harimu? Ada kejadian menarik atau bikin stres?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 resize-none h-24 placeholder:text-slate-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-100 shrink-0 bg-white flex gap-4">
                            {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2"><ArrowLeftIcon className="w-5 h-5 stroke-2" /> Kembali</button>}
                            <button onClick={step < 3 ? () => setStep(step + 1) : handleCheckInSubmit} disabled={!isDailyValid() || loadingSubmit} className={`flex-[2] font-bold py-3 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${!isDailyValid() || loadingSubmit ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50'}`}>
                                {loadingSubmit ? 'Memproses...' : step < 3 ? <>Lanjut <ArrowRightIcon className="w-5 h-5 stroke-2" /></> : <><CheckCircleIcon className="w-6 h-6 stroke-2" /> Selesaikan Check-in</>}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scale-up { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
                .hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .hide-arrows { -moz-appearance: textfield; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}