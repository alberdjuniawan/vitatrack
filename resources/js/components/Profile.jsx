import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
    KeyIcon, HeartIcon, IdentificationIcon, 
    XMarkIcon, InformationCircleIcon, ChevronDownIcon, CheckCircleIcon
} from '@heroicons/react/24/solid';

const genderOptions = [
    { value: 'male', label: 'Laki-laki' },
    { value: 'female', label: 'Perempuan' }
];

const timezoneOptions = [
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
    { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
    { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' }
];

const CustomDropdown = ({ value, options, onChange, className, size = 'normal', placeholder = 'Pilih...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState({});

    const toggleDropdown = (e) => {
        e.preventDefault();
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom - 12; 
            const spaceAbove = rect.top - 12;
            const MAX_HEIGHT = 260; 
            
            let style = { position: 'fixed', left: rect.left, width: rect.width, zIndex: 999999 };
            let flip = false;

            if (spaceBelow < MAX_HEIGHT && spaceAbove > spaceBelow) {
                style.bottom = window.innerHeight - rect.top + 6;
                style.maxHeight = `${Math.min(MAX_HEIGHT, spaceAbove)}px`;
                flip = true;
            } else {
                style.top = rect.bottom + 6;
                style.maxHeight = `${Math.min(MAX_HEIGHT, spaceBelow)}px`;
            }

            setMenuStyle(style);
            setIsFlipped(flip);
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedButton = dropdownRef.current?.contains(event.target);
            const clickedMenu = menuRef.current?.contains(event.target);
            if (!clickedButton && !clickedMenu) setIsOpen(false);
        };
        const handleScrollResize = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScrollResize, true); 
            window.addEventListener('resize', handleScrollResize);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollResize, true);
            window.removeEventListener('resize', handleScrollResize);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);
    const btnClass = size === 'small' ? "px-4 py-2.5 text-xs md:text-sm rounded-xl" : "px-4 py-3 text-sm rounded-xl";
    const menuClass = size === 'small' ? "px-4 py-2.5 text-xs md:text-sm" : "px-4 py-3 text-sm";

    return (
        <>
            <div className={`relative ${className}`} ref={dropdownRef}>
                <button 
                    onClick={toggleDropdown}
                    className={`w-full bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 shadow-sm flex items-center justify-between gap-2 transition-all font-bold ${btnClass} ${!selectedOption ? 'text-slate-400' : 'text-slate-700'}`}
                >
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                    <ChevronDownIcon className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {isOpen && createPortal(
                <div ref={menuRef} style={menuStyle} className={`bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-y-auto custom-scrollbar py-1.5 font-ubuntu ${isFlipped ? 'animate-dropdown-up origin-bottom' : 'animate-dropdown origin-top'}`}>
                    {options.map(opt => (
                        <button key={opt.value} onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }} className={`w-full text-left font-bold transition-colors truncate ${menuClass} ${value === opt.value ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`} title={opt.label}>
                            {opt.label}
                        </button>
                    ))}
                </div>, document.body
            )}
        </>
    );
};

export default function Profile() {
    const { refreshLayoutUser, showToast } = useOutletContext();

    const [formData, setFormData] = useState({
        name: '', email: '', date_of_birth: '', gender: '', 
        height_cm: '', weight_kg: '', timezone: '', existing_conditions: []
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
                    timezone: user.timezone || '', 
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
            let finalConditions = [...formData.existing_conditions];
            if (newCondition.trim() !== '') {
                if (!finalConditions.includes(newCondition.trim())) {
                    finalConditions.push(newCondition.trim());
                }
                setNewCondition('');
            }

            const payload = { ...formData, existing_conditions: finalConditions };

            await axios.put('/api/user/profile', payload);
            setFormData(payload);
            
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
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500 font-bold transition-all ${formData.date_of_birth ? 'text-slate-700' : 'text-slate-400'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Kelamin</label>
                                <CustomDropdown 
                                    value={formData.gender} 
                                    options={genderOptions} 
                                    placeholder="Pilih Jenis Kelamin"
                                    onChange={(val) => setFormData({...formData, gender: val})} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Zona Waktu</label>
                            <CustomDropdown 
                                value={formData.timezone} 
                                options={timezoneOptions} 
                                placeholder="Pilih Zona Waktu"
                                onChange={(val) => setFormData({...formData, timezone: val})} 
                            />
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
                            <div className="flex bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors border-slate-200 focus-within:ring-teal-500">
                                <input 
                                    type="number" value={formData.height_cm} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('height_cm', e.target.value, 300)} placeholder="Contoh: 170"
                                    className="flex-1 w-full text-center bg-transparent outline-none font-bold py-3 px-4 hide-arrows text-slate-700 placeholder:text-slate-300 placeholder:font-medium" 
                                />
                                <div className="bg-slate-100 text-slate-400 font-bold px-4 flex items-center justify-center border-l border-slate-200 text-sm shrink-0">cm</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Berat Badan (kg)</label>
                            <div className="flex bg-slate-50 border rounded-xl overflow-hidden focus-within:ring-2 transition-colors border-slate-200 focus-within:ring-teal-500">
                                <input 
                                    type="number" value={formData.weight_kg} onKeyDown={blockInvalidChar} onChange={(e) => handleNumberChange('weight_kg', e.target.value, 500)} placeholder="Contoh: 65"
                                    className="flex-1 w-full text-center bg-transparent outline-none font-bold py-3 px-4 hide-arrows text-slate-700 placeholder:text-slate-300 placeholder:font-medium" 
                                />
                                <div className="bg-slate-100 text-slate-400 font-bold px-4 flex items-center justify-center border-l border-slate-200 text-sm shrink-0">kg</div>
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
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
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
                @keyframes dropdown-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-dropdown { animation: dropdown-down 0.2s ease-out forwards; transform-origin: top; }
                @keyframes dropdown-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-dropdown-up { animation: dropdown-up 0.2s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
                .hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .hide-arrows { -moz-appearance: textfield; }
            `}} />
        </div>
    );
}