import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
    PencilSquareIcon, CalendarDaysIcon, TableCellsIcon, XMarkIcon, 
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, FaceSmileIcon, FaceFrownIcon } from '@heroicons/react/24/solid';

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Logs() {
    const [viewMode, setViewMode] = useState('table'); 
    const [timeframe, setTimeframe] = useState('month'); 
    const [selectedMonth, setSelectedMonth] = useState(null); 
    
    const [logs, setLogs] = useState([]);
    const [editingLog, setEditingLog] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [loadingSave, setLoadingSave] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get('/api/health-logs?timeframe=365');
                const formattedLogs = res.data.data.map(log => ({
                    ...log,
                    log_date: log.log_date ? log.log_date.split('T')[0] : log.log_date 
                }));
                setLogs(formattedLogs);
            } catch (error) {
                console.error("Gagal mengambil riwayat log:", error);
            }
        };
        fetchLogs();
    }, []);

    const getMoodBadge = (label, isSmall = false, hideTextOnMobile = false) => {
        const moodData = {
            happy: { text: 'Senang', icon: FaceSmileIcon },
            calm: { text: 'Tenang', icon: FaceSmileIcon },
            neutral: { text: 'Netral', icon: FaceSmileIcon },
            anxious: { text: 'Gelisah', icon: FaceFrownIcon },
            sad: { text: 'Sedih', icon: FaceFrownIcon },
            angry: { text: 'Marah', icon: FaceFrownIcon },
            overwhelmed: { text: 'Kewalahan', icon: FaceFrownIcon }
        };
        const MoodIcon = moodData[label]?.icon || FaceSmileIcon;
        const moodText = moodData[label]?.text || label;

        return (
            <div className={`flex items-center justify-center md:justify-start ${isSmall ? 'gap-0.5 md:gap-1' : 'gap-1.5'} font-bold text-teal-600 w-full`}>
                <MoodIcon className={`${isSmall ? 'w-7 h-7 md:w-4 md:h-4' : 'w-5 h-5'} shrink-0 drop-shadow-sm`} />
                <span className={`capitalize ${isSmall ? 'text-[10px]' : ''} ${hideTextOnMobile ? 'hidden md:inline' : ''}`}>
                    {moodText}
                </span>
            </div>
        );
    };

    const handleEditClick = (log) => {
        setEditingLog(log);
        setEditFormData({ ...log });
    };

    const closeModal = () => {
        setEditingLog(null);
        setEditFormData(null);
    };

    const handleSaveEdit = async () => {
        setLoadingSave(true);
        try {
            await axios.put(`/api/health-logs/${editFormData.id}`, editFormData);
            setLogs(prev => prev.map(l => l.id === editFormData.id ? editFormData : l));
            closeModal();
        } catch (error) {
            console.error("Gagal mengupdate log:", error);
            alert("Terjadi kesalahan saat menyimpan pembaruan.");
        } finally {
            setLoadingSave(false);
        }
    };

    const handleNumberChange = (field, value, max, min = 0) => {
        if (value === '') {
            setEditFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        let num = parseFloat(value);
        if (!isNaN(num)) {
            if (num > max) num = max;
            if (num < min) num = min;
            setEditFormData(prev => ({ ...prev, [field]: num }));
        }
    };

    const updateNumber = (field, stepVal, max, min = 0) => {
        setEditFormData(prev => {
            let current = prev[field] === '' || isNaN(prev[field]) ? 0 : parseFloat(prev[field]);
            let newVal = parseFloat((current + stepVal).toFixed(1)); 
            if (newVal < min) newVal = min;
            if (newVal > max) newVal = max;
            return { ...prev, [field]: newVal };
        });
    };

    const blockInvalidChar = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1; 
    const targetMonth = selectedMonth || currentMonthNum;
    const targetMonthStr = String(targetMonth).padStart(2, '0');

    const filteredLogs = logs.filter(log => {
        if (!log.log_date) return false;
        if (timeframe === 'month') return log.log_date.startsWith(`${currentYear}-${targetMonthStr}-`);
        if (timeframe === 'year' && viewMode === 'table') return log.log_date.startsWith(`${currentYear}-`);
        return true;
    });

    return (
        <div className="w-full flex flex-col gap-6 md:gap-8 animate-fade-in pb-10 font-ubuntu relative z-10">
            
            <div className="bg-white/90 backdrop-blur-md p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6 border border-white">
                <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Riwayat Catatan</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Kelola dan perbarui datamu dengan mudah.</p>
                </div>

                <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 md:gap-4 items-center">
                    <select 
                        value={timeframe} 
                        onChange={(e) => { setTimeframe(e.target.value); setSelectedMonth(null); }}
                        className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 font-bold outline-none cursor-pointer text-sm px-4 py-3 rounded-xl hover:border-teal-400 transition-colors"
                    >
                        <option value="month">Bulan Ini</option>
                        <option value="year">Tahun Ini</option>
                    </select>

                    <div className="flex w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                        <button onClick={() => setViewMode('table')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'table' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TableCellsIcon className="w-5 h-5 stroke-2" /> Tabel</button>
                        <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'calendar' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarDaysIcon className="w-5 h-5 stroke-2" /> Kalender</button>
                    </div>
                </div>
            </div>

            {viewMode === 'table' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white overflow-hidden animate-fade-in-up p-2 md:p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="p-4 md:p-6 font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                                    <th className="p-4 md:p-6 font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">Kondisi Mood</th>
                                    <th className="p-4 md:p-6 font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">Tidur (Jam)</th>
                                    <th className="p-4 md:p-6 font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">Air (ml)</th>
                                    <th className="p-4 md:p-6 font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider whitespace-nowrap">Aktivitas</th>
                                    <th className="p-4 md:p-6 font-bold text-slate-500 text-xs md:text-sm uppercase tracking-wider text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition-all group">
                                        <td className="p-4 md:p-6"><span className="font-bold text-slate-700 whitespace-nowrap">{log.log_date}</span></td>
                                        <td className="p-4 md:p-6"><div className="flex items-center gap-2 whitespace-nowrap">{getMoodBadge(log.mood_label, false)}</div></td>
                                        <td className="p-4 md:p-6 font-bold text-slate-600 whitespace-nowrap">{log.sleep_hours} <span className="text-xs text-slate-400 font-medium">Jam</span></td>
                                        <td className="p-4 md:p-6 font-bold text-slate-600 whitespace-nowrap">{log.water_intake_ml} <span className="text-xs text-slate-400 font-medium">ml</span></td>
                                        <td className="p-4 md:p-6 font-bold text-slate-600 capitalize whitespace-nowrap">{log.activity_type} <span className="text-xs text-slate-400 ml-1 font-medium">({log.activity_minutes}m)</span></td>
                                        <td className="p-4 md:p-6 flex justify-center">
                                            <button onClick={() => handleEditClick(log)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-slate-200 text-slate-500 font-bold text-xs md:text-sm rounded-xl hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all shadow-sm">
                                                <PencilSquareIcon className="w-4 h-4 stroke-2" /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium text-sm">Data tidak ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {viewMode === 'calendar' && timeframe === 'year' && selectedMonth === null && (
                <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] p-5 md:p-8 shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white animate-fade-in-up relative z-10">
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-800 mb-4 md:mb-6">Pilih Bulan ({currentYear})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {monthNames.map((month, index) => (
                            <button 
                                key={month} onClick={() => setSelectedMonth(index + 1)}
                                className="p-4 md:p-6 border border-slate-200 rounded-xl hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 text-slate-600 font-bold transition-all text-center flex flex-col items-center gap-2 shadow-sm text-sm md:text-base"
                            >
                                <CalendarDaysIcon className="w-5 h-5 md:w-6 md:h-6 stroke-2 opacity-50" />
                                {month}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'calendar' && (timeframe === 'month' || selectedMonth !== null) && (
                <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] p-3 md:p-8 shadow-[0_4px_20px_rgb(13,148,136,0.06)] border border-white animate-fade-in-up relative z-10">
                    <div className="flex justify-between items-center mb-4 md:mb-6 px-1 md:px-0">
                        <div className="flex items-center gap-3 md:gap-4">
                            {timeframe === 'year' && (
                                <button onClick={() => setSelectedMonth(null)} className="p-1.5 md:p-2 bg-slate-50 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                                    <ArrowLeftIcon className="w-4 h-4 md:w-5 md:h-5 stroke-2" />
                                </button>
                            )}
                            <h3 className="text-base md:text-xl font-extrabold text-slate-800">
                                {monthNames[targetMonth - 1]} {currentYear}
                            </h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 md:gap-3 w-full">
                        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
                            <div key={day} className="font-extrabold text-slate-400 text-[9px] md:text-xs text-center uppercase tracking-wider mb-1 md:mb-2">{day}</div>
                        ))}
                        
                        {[1, 2, 3, 4].map(i => <div key={`empty-${i}`} className="min-h-[70px] md:min-h-[140px] rounded-md md:rounded-xl bg-slate-50/50 border border-slate-100 opacity-50"></div>)}
                        
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(date => {
                            const logData = logs.find(l => {
                                const [y, m, d] = l.log_date.split('-');
                                return parseInt(y) === currentYear && parseInt(m) === targetMonth && parseInt(d) === date;
                            });
                            
                            return (
                                <div 
                                    key={date} 
                                    onClick={() => logData && handleEditClick(logData)} 
                                    className={`min-h-[70px] md:min-h-[140px] rounded-lg md:rounded-xl border p-1.5 md:p-2.5 relative transition-all group flex flex-col overflow-hidden ${
                                        logData ? 'bg-teal-50/30 border-teal-200 hover:border-teal-400 hover:shadow-sm cursor-pointer' : 'bg-white border-slate-100 opacity-70'
                                    }`}
                                >
                                    <div className="flex justify-center md:justify-between items-start mb-1 md:px-0.5">
                                        <span className={`text-sm font-bold ${logData ? 'text-teal-800' : 'text-slate-400'}`}>{date}</span>
                                        {logData && <PencilSquareIcon className="hidden md:block w-3.5 h-3.5 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>

                                    {logData && (
                                        <>
                                            <div className="hidden md:flex mt-auto w-full flex-col gap-1 text-[10px] md:text-xs text-slate-500 leading-tight px-0.5">
                                                <div className="truncate w-full text-left">
                                                    <span className="font-medium">Tidur:</span> <span className="font-bold text-slate-600">{logData.sleep_hours}j</span>
                                                </div>
                                                <div className="truncate w-full text-left">
                                                    <span className="font-medium">Air:</span> <span className="font-bold text-slate-600">{logData.water_intake_ml}ml</span>
                                                </div>
                                                <div className="truncate w-full text-left">
                                                    <span className="font-medium">Aktif:</span> <span className="font-bold text-slate-600 capitalize ml-1">{logData.activity_type}</span>
                                                </div>
                                                <div className="flex justify-start items-center mt-1">
                                                    {getMoodBadge(logData.mood_label, true, false)}
                                                </div>
                                            </div>

                                            <div className="flex md:hidden flex-1 justify-center items-center w-full">
                                                {getMoodBadge(logData.mood_label, true, true)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {editingLog && editFormData && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto py-10 font-ubuntu">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative animate-scale-up flex flex-col my-auto max-h-[90vh]">
                        
                        <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20 rounded-t-[2rem] shrink-0">
                            <div>
                                <h3 className="font-extrabold text-lg md:text-2xl text-slate-800">Edit Catatan</h3>
                                <p className="text-teal-600 font-bold text-xs md:text-sm mt-1">{editFormData.log_date}</p>
                            </div>
                            <button onClick={closeModal} className="p-2 md:p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><XMarkIcon className="w-5 h-5 md:w-6 h-6 text-slate-600 stroke-2" /></button>
                        </div>

                        <div className="p-5 md:p-8 flex flex-col gap-8 md:gap-10 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <h4 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Psikologis</h4>
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-bold text-slate-700">Skor Mood</label>
                                        <span className="text-teal-600 font-extrabold">{editFormData.mood_score}/10</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                            <button 
                                                key={num} 
                                                onClick={() => setEditFormData({...editFormData, mood_score: num})} 
                                                className={`w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-all ${editFormData.mood_score === num ? 'bg-teal-600 text-white scale-110 shadow-md' : 'bg-white text-slate-400 hover:bg-teal-100 border border-slate-200'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Label Mood</label><select value={editFormData.mood_label} onChange={(e) => setEditFormData({...editFormData, mood_label: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600 text-sm"><option value="happy">Senang</option><option value="sad">Sedih</option><option value="anxious">Gelisah</option><option value="angry">Marah</option><option value="calm">Tenang</option><option value="overwhelmed">Kewalahan</option><option value="neutral">Netral</option></select></div>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Tingkat Stres</label><select value={editFormData.stress_level} onChange={(e) => setEditFormData({...editFormData, stress_level: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600 text-sm"><option value="0">0 - Tidak Ada</option><option value="1">1 - Ringan</option><option value="2">2 - Sedang</option><option value="3">3 - Tinggi</option><option value="4">4 - Sangat Tinggi</option></select></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Istirahat & Cairan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tidur (Jam)</label>
                                        <div className="flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500">
                                            <button onClick={() => updateNumber('sleep_hours', -0.5, 24)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">-</button>
                                            <input type="number" value={editFormData.sleep_hours} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('sleep_hours', e.target.value, 24)} className="flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700" />
                                            <button onClick={() => updateNumber('sleep_hours', 0.5, 24)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Konsumsi Air (ml)</label>
                                        <div className="flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500">
                                            <button onClick={() => updateNumber('water_intake_ml', -100, 30000)} className="w-14 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">-</button>
                                            <input type="number" value={editFormData.water_intake_ml} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('water_intake_ml', e.target.value, 30000)} className="flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700" />
                                            <button onClick={() => updateNumber('water_intake_ml', 100, 30000)} className="w-14 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Aktivitas & Catatan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Jenis Aktivitas</label><select value={editFormData.activity_type} onChange={(e) => setEditFormData({...editFormData, activity_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-600 text-sm"><option value="sedentary">Duduk/Rebahan</option><option value="walking">Jalan Kaki</option><option value="running">Lari</option><option value="cycling">Bersepeda</option><option value="gym">Gym / Workout</option><option value="sport">Olahraga Lain</option><option value="other">Lainnya</option></select></div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Durasi (Menit)</label>
                                        <div className="flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500">
                                            <button onClick={() => updateNumber('activity_minutes', -5, 1440)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">-</button>
                                            <input type="number" value={editFormData.activity_minutes} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('activity_minutes', e.target.value, 1440)} className="flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700" />
                                            <button onClick={() => updateNumber('activity_minutes', 5, 1440)} className="w-12 h-full bg-slate-100/50 hover:bg-slate-200 text-slate-600 font-bold text-xl">+</button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Harian</label>
                                    <textarea value={editFormData.notes} onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700 resize-none h-24 text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-6 border-t border-slate-100 shrink-0 bg-white flex justify-end gap-3 sticky bottom-0 z-20 rounded-b-[2rem]">
                            <button onClick={closeModal} className="px-4 py-2.5 md:px-6 md:py-3 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm md:text-base">Batal</button>
                            <button onClick={handleSaveEdit} disabled={loadingSave} className="px-5 py-2.5 md:px-8 md:py-3 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-200/50 transition-all flex items-center gap-2 disabled:bg-teal-400 text-sm md:text-base">
                                {loadingSave ? 'Menyimpan...' : <><CheckCircleIcon className="w-4 h-4 md:w-5 md:h-5 stroke-2"/> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}

            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');
                .font-ubuntu { font-family: 'Ubuntu', sans-serif !important; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-up { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
                .hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .hide-arrows { -moz-appearance: textfield; }
            `}} />
        </div>
    );
}