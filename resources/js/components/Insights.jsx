import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
    CalendarDaysIcon, XMarkIcon, 
    ClipboardDocumentCheckIcon, FaceSmileIcon, ArrowRightIcon,
    SparklesIcon
} from '@heroicons/react/24/solid';
import { 
    ClockIcon, DocumentTextIcon 
} from '@heroicons/react/24/outline';

export default function Insights() {
    const [activeTab, setActiveTab] = useState('daily'); 
    const [selectedInsight, setSelectedInsight] = useState(null); 
    const [dailyInsights, setDailyInsights] = useState([]);
    const [weeklyInsights, setWeeklyInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await axios.get('/api/insights');
                const data = res.data.data;
                
                let rawDaily = [];
                let rawWeekly = [];

                if (Array.isArray(data)) {
                    rawDaily = data.filter(item => item.type === 'daily_insight');
                    rawWeekly = data.filter(item => item.type === 'weekly_insight');
                } else {
                    rawDaily = data.daily || [];
                    rawWeekly = data.weekly || [];
                }

                const mappedDaily = rawDaily.map(item => ({
                    id: item.id,
                    date: formatDate(item.period_start || item.created_at),
                    mood: formatMood(item.health_log?.mood_label || 'neutral'),
                    score: item.health_log?.mood_score || 0,
                    title: item.content?.title || 'Insight Harian',
                    text: typeof item.content === 'string' ? item.content : item.content?.text || '',
                }));

                const mappedWeekly = rawWeekly.map(item => ({
                    id: item.id,
                    dateRange: getWeekRange(item.period_start || item.created_at),
                    gad7: item.content?.gad7_status || 'Normal',
                    phq9: item.content?.phq9_status || 'Normal',
                    title: item.content?.title || 'Evaluasi Mingguan',
                    text: typeof item.content === 'string' ? item.content : item.content?.text || '',
                }));

                setDailyInsights(mappedDaily);
                setWeeklyInsights(mappedWeekly);
            } catch (error) {
                console.error("Gagal mengambil arsip insight:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const getWeekRange = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const start = new Date(d);
        start.setDate(d.getDate() - 6); 
        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${String(start.getDate()).padStart(2, '0')} ${shortMonths[start.getMonth()]} - ${String(d.getDate()).padStart(2, '0')} ${shortMonths[d.getMonth()]}`;
    };

    const formatMood = (label) => {
        const mapping = {
            happy: 'Senang', calm: 'Tenang', neutral: 'Netral', 
            anxious: 'Gelisah', sad: 'Sedih', angry: 'Marah', overwhelmed: 'Kewalahan'
        };
        return mapping[label] || 'Netral';
    };

    return (
        <div className="w-full flex flex-col gap-6 md:gap-8 animate-fade-in pb-10 font-ubuntu">
            
            {/* HEADER & TABS */}
            <div className="bg-white/90 backdrop-blur-md p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6 border border-white">
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        Arsip AI
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Kumpulan analisis harian dan evaluasi mental mingguanmu.</p>
                </div>

                <div className="flex w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                    <button 
                        onClick={() => setActiveTab('daily')} 
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'daily' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <DocumentTextIcon className="w-5 h-5 stroke-2" /> Harian
                    </button>
                    <button 
                        onClick={() => setActiveTab('weekly')} 
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'weekly' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardDocumentCheckIcon className="w-5 h-5 stroke-2" /> Mingguan
                    </button>
                </div>
            </div>

            {/* TAMPILAN LOADING */}
            {loading && (
                <div className="flex justify-center items-center py-20 text-teal-600 font-bold">
                    Mencari riwayat AI...
                </div>
            )}

            {/* GRID CARDS: INSIGHT HARIAN */}
            {!loading && activeTab === 'daily' && (
                <>
                    {dailyInsights.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
                            {dailyInsights.map((insight) => (
                                <button 
                                    key={insight.id} 
                                    onClick={() => setSelectedInsight({ type: 'daily', ...insight })}
                                    className="bg-white/90 backdrop-blur-sm border border-teal-50 p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.04)] hover:shadow-[0_8px_30px_rgb(13,148,136,0.1)] hover:border-teal-200 transition-all text-left flex flex-col group h-full min-h-[280px]"
                                >
                                    <div className="flex justify-between items-start mb-4 w-full gap-2">
                                        <div className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0">
                                            <CalendarDaysIcon className="w-4 h-4 stroke-2" /> {insight.date}
                                        </div>
                                        {insight.score > 0 && (
                                            <div className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0">
                                                <FaceSmileIcon className="w-4 h-4 text-teal-500" /> {insight.mood}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h3 className="font-extrabold text-lg text-slate-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-1">{insight.title}</h3>
                                    
                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
                                        {insight.text.replace(/\n/g, ' ')}
                                    </p>
                                    
                                    <div className="mt-auto flex items-center gap-1 text-teal-600 font-bold text-sm pt-2">
                                        Baca detail <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/90 backdrop-blur-sm p-10 rounded-[2rem] text-center shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white">
                            <p className="text-slate-500 font-bold">Belum ada riwayat insight harian.</p>
                            <p className="text-sm text-slate-400 mt-2">Selesaikan Daily Check-in di halaman Overview untuk mendapatkan insight.</p>
                        </div>
                    )}
                </>
            )}

            {/* GRID CARDS: INSIGHT MINGGUAN */}
            {!loading && activeTab === 'weekly' && (
                <>
                    {weeklyInsights.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up">
                            {weeklyInsights.map((insight) => (
                                <button 
                                    key={insight.id} 
                                    onClick={() => setSelectedInsight({ type: 'weekly', ...insight })}
                                    className="bg-white/90 backdrop-blur-sm border border-teal-50 p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.04)] hover:shadow-[0_8px_30px_rgb(13,148,136,0.1)] hover:border-teal-200 transition-all text-left flex flex-col group h-full min-h-[300px]"
                                >
                                    <div className="flex justify-between items-start mb-4 w-full gap-2">
                                        <div className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0">
                                            <ClockIcon className="w-4 h-4 stroke-2" /> <span className="whitespace-nowrap">{insight.dateRange}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                                            <span className="bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-bold text-[10px] md:text-xs text-right whitespace-nowrap">{insight.gad7}</span>
                                            <span className="bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-100 font-bold text-[10px] md:text-xs text-right whitespace-nowrap">{insight.phq9}</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-extrabold text-lg text-slate-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-1">{insight.title}</h3>
                                    
                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
                                        {insight.text.replace(/\n/g, ' ')}
                                    </p>
                                    
                                    <div className="mt-auto flex items-center gap-1 text-teal-600 font-bold text-sm border-t border-slate-50 pt-4 w-full">
                                        Lihat Laporan Lengkap <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/90 backdrop-blur-sm p-10 rounded-[2rem] text-center shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white">
                            <p className="text-slate-500 font-bold">Belum ada evaluasi klinis mingguan.</p>
                            <p className="text-sm text-slate-400 mt-2">Evaluasi akan muncul setelah kamu menyelesaikan Tes Mingguan di Overview.</p>
                        </div>
                    )}
                </>
            )}

            {/* MODAL POP-UP DETAIL INSIGHT */}
            {selectedInsight && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-ubuntu">
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col animate-scale-up overflow-hidden max-h-[90vh]">
                        
                        {/* HEADER MODAL */}
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-teal-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                {selectedInsight.type === 'daily' ? (
                                    <SparklesIcon className="w-7 h-7 md:w-8 md:h-8 text-teal-600" />
                                ) : (
                                    <ClipboardDocumentCheckIcon className="w-7 h-7 md:w-8 md:h-8 text-teal-600" />
                                )}
                                <div>
                                    <h3 className="font-extrabold text-lg md:text-xl text-slate-800">
                                        {selectedInsight.type === 'daily' ? 'Insight Harian' : 'Evaluasi Mingguan'}
                                    </h3>
                                    <p className="text-teal-600 font-bold text-xs md:text-sm mt-0.5">
                                        {selectedInsight.type === 'daily' ? selectedInsight.date : selectedInsight.dateRange}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInsight(null)} className="p-3 bg-white hover:bg-slate-100 rounded-full transition-colors"><XMarkIcon className="w-6 h-6 text-slate-600" /></button>
                        </div>

                        {/* BODY MODAL */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <h4 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-4">{selectedInsight.title}</h4>
                            
                            {/* BADGES JIKA MINGGUAN */}
                            {selectedInsight.type === 'weekly' && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-100 font-bold text-xs">{selectedInsight.gad7}</span>
                                    <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-100 font-bold text-xs">{selectedInsight.phq9}</span>
                                </div>
                            )}

                            {/* BADGES JIKA HARIAN */}
                            {selectedInsight.type === 'daily' && selectedInsight.score > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100 font-bold text-xs flex items-center gap-1.5"><FaceSmileIcon className="w-4 h-4 text-teal-500"/> Mood: {selectedInsight.mood} ({selectedInsight.score}/10)</span>
                                </div>
                            )}

                            <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base whitespace-pre-wrap">
                                {selectedInsight.text}
                            </p>
                        </div>

                        {/* FOOTER MODAL */}
                        <div className="p-5 md:p-6 border-t border-slate-100 shrink-0 bg-white">
                            <button onClick={() => setSelectedInsight(null)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 md:py-3.5 rounded-xl transition-all shadow-md shadow-teal-200/50 text-sm md:text-base">Tutup Insight</button>
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
            `}} />
        </div>
    );
}