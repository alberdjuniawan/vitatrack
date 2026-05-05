import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
    KeyIcon, HeartIcon, IdentificationIcon, 
    CheckCircleIcon, XMarkIcon, InformationCircleIcon
} from '@heroicons/react/24/solid';

export default function Profile() {
    const { refreshLayoutUser, showToast } = useOutletContext();

    const [formData, setFormData] = useState({
        name: '', email: '', date_of_birth: '', gender: '', 
        height_cm: '', weight_kg: '', timezone: 'Asia/Jakarta', existing_conditions: []
    });

    const [newCondition, setNewCondition] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/api/user');
                const user = res.data.data;
                
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '', 
                    gender: user.gender || '', 
                    height_cm: user.height_cm || '',
                    weight_kg: user.weight_kg || '',
                    timezone: user.timezone || 'Asia/Jakarta',
                    existing_conditions: Array.isArray(user.existing_conditions) 
                        ? user.existing_conditions 
                        : (typeof user.existing_conditions === 'string' ? JSON.parse(user.existing_conditions || '[]') : [])
                });
            } catch (error) {
                console.error("Gagal mengambil data profil:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put('/api/user/profile', formData);
            showToast("Profil berhasil diperbarui", "success");
            refreshLayoutUser(); 
        } catch (error) {
            console.error("Gagal menyimpan profil:", error);
            showToast("Terjadi kesalahan saat menyimpan profil.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNumberChange = (field, value, max) => {
        if (value === '') {
            setFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        let num = parseInt(value);
        if (!isNaN(num)) {
            if (num > max) num = max; 
            if (num < 0) num = 0;     
            setFormData(prev => ({ ...prev, [field]: num }));
        }
    };

    const handleAddCondition = (e) => {
        if (e.key === 'Enter' && newCondition.trim() !== '') {
            e.preventDefault();
            if (!formData.existing_conditions.includes(newCondition.trim())) {
                setFormData({
                    ...formData,
                    existing_conditions: [...formData.existing_conditions, newCondition.trim()]
                });
            }
            setNewCondition('');
        }
    };

    const removeCondition = (conditionToRemove) => {
        setFormData({ ...formData, existing_conditions: formData.existing_conditions.filter(c => c !== conditionToRemove) });
    };

    const blockInvalidChar = (e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const isProfileIncomplete = 
        !formData.name || !formData.date_of_birth || !formData.gender || 
        !formData.height_cm || !formData.weight_kg || !formData.timezone;

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center py-20 text-teal-600 font-bold font-ubuntu">
                Memuat data profil...
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-6 md:gap-8 animate-fade-in pb-10 font-ubuntu">
            
            {isProfileIncomplete && (
                <div className="bg-teal-50 border border-teal-200 p-4 md:p-5 rounded-[1.5rem] flex items-start gap-3 md:gap-4 animate-fade-in-up relative z-10 mx-0 md:mx-0 shadow-sm">
                    <InformationCircleIcon className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-extrabold text-teal-800 text-sm md:text-base">Lengkapi Profilmu!</h4>
                        <p className="text-teal-700/80 text-xs md:text-sm font-medium mt-1 leading-relaxed">
                            AI Vitatrack membutuhkan data <b>Tinggi Badan</b>, <b>Berat Badan</b>, <b>Tanggal Lahir</b>, dan <b>Jenis Kelamin</b> yang akurat untuk memberikan insight dan evaluasi kesehatan yang dipersonalisasi khusus untukmu.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white/90 backdrop-blur-md p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white shrink-0 min-h-[120px] relative z-10">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-black text-xl md:text-2xl border border-teal-100 shadow-sm shrink-0 uppercase">
                        {getInitials(formData.name)}
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">{formData.name || 'Pengguna'}</h2>
                        <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Kelola informasi pribadi dan metrik kesehatanmu di sini.</p>
                    </div>
                </div>
                <button className="bg-slate-50 text-slate-600 font-bold px-5 py-2.5 md:py-3 rounded-xl border border-slate-200 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-colors flex items-center gap-2 text-sm w-full md:w-auto justify-center shrink-0">
                    <KeyIcon className="w-4 h-4 md:w-5 md:h-5" /> Ganti Password
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] p-6 md:p-8 flex flex-col gap-6 border border-white">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                        <IdentificationIcon className="w-6 h-6 text-teal-500" />
                        <h3 className="font-extrabold text-lg text-slate-800">Informasi Pribadi</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                            <input 
                                type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <input 
                                type="email" value={formData.email} disabled
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-slate-400 cursor-not-allowed"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Lahir</label>
                                <input 
                                    type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Kelamin</label>
                                <select 
                                    value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold transition-all ${formData.gender === '' ? 'text-slate-400' : 'text-slate-700'}`}
                                >
                                    <option value="" disabled>Pilih Jenis Kelamin</option>
                                    <option value="male" className="text-slate-700">Laki-laki</option>
                                    <option value="female" className="text-slate-700">Perempuan</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Zona Waktu</label>
                            <select 
                                value={formData.timezone} onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 transition-all"
                            >
                                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-[0_4px_20px_rgb(13,148,136,0.06)] p-6 md:p-8 flex flex-col gap-6 border border-white">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                        <HeartIcon className="w-6 h-6 text-teal-500" />
                        <h3 className="font-extrabold text-lg text-slate-800">Metrik Fisik & Medis</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Tinggi Badan (cm)</label>
                            <div className="flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500">
                                <input 
                                    type="number" value={formData.height_cm} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('height_cm', e.target.value, 300)} placeholder="Contoh: 170"
                                    className="flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700 placeholder:text-slate-300 placeholder:font-medium" 
                                />
                                <span className="bg-slate-100 text-slate-400 font-bold px-4 h-full flex items-center border-l border-slate-200 text-sm">cm</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Berat Badan (kg)</label>
                            <div className="flex items-center bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors h-12 border-slate-200 focus-within:ring-teal-500">
                                <input 
                                    type="number" value={formData.weight_kg} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('weight_kg', e.target.value, 500)} placeholder="Contoh: 65"
                                    className="flex-1 text-center bg-transparent outline-none font-bold h-full hide-arrows text-slate-700 placeholder:text-slate-300 placeholder:font-medium" 
                                />
                                <span className="bg-slate-100 text-slate-400 font-bold px-4 h-full flex items-center border-l border-slate-200 text-sm">kg</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <label className="block text-sm font-bold text-slate-700">Kondisi Medis Bawaan (Opsional)</label>
                        <p className="text-xs text-slate-400 font-medium mb-1">Ketik nama penyakit lalu tekan <kbd className="bg-slate-100 px-1 rounded text-slate-500">Enter</kbd></p>
                        
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-teal-500 transition-all flex flex-wrap gap-2 items-center min-h-[56px]">
                            {formData.existing_conditions.map((cond, idx) => (
                                <span key={idx} className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
                                    {cond}
                                    <button onClick={() => removeCondition(cond)} className="hover:text-rose-500 transition-colors"><XMarkIcon className="w-3.5 h-3.5" /></button>
                                </span>
                            ))}
                            <input 
                                type="text" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} onKeyDown={handleAddCondition}
                                placeholder={formData.existing_conditions.length === 0 ? "Contoh: Asma, Hipertensi..." : "Tambah lagi..."}
                                className="flex-1 min-w-[120px] bg-transparent outline-none font-medium text-sm text-slate-700 px-2 py-1 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="mt-auto pt-6">
                        <button 
                            onClick={handleSave} disabled={isSaving || isProfileIncomplete}
                            className={`w-full font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 ${
                                isSaving || isProfileIncomplete ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50'
                            }`}
                        >
                            {isSaving ? 'Menyimpan...' : <><CheckCircleIcon className="w-5 h-5 stroke-2" /> Simpan Perubahan</>}
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');
                .font-ubuntu { font-family: 'Ubuntu', sans-serif !important; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
                .hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .hide-arrows { -moz-appearance: textfield; }
            `}} />
        </div>
    );
}