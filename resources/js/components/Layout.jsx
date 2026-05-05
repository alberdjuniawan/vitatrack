import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Squares2X2Icon, ClipboardDocumentListIcon, SparklesIcon, 
    UserCircleIcon, ArrowLeftOnRectangleIcon, Bars3Icon, XMarkIcon,
    ChevronRightIcon, ChevronLeftIcon, CheckCircleIcon, ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function Layout() {
    const navigate = useNavigate();
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userData, setUserData] = useState({ name: '', email: '' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const spotlightRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const refreshLayoutUser = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get('/api/user');
                setUserData({
                    name: res.data.data?.name || 'Pengguna Vitatrack',
                    email: res.data.data?.email || 'user@vitatrack.com'
                });
            } catch (error) {
                console.error("Gagal mengambil data user:", error);
            }
        };
        fetchUser();
    }, [refreshTrigger]);

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
            localStorage.removeItem('vitatrack_token');
            navigate('/login');
        } catch (error) {
            console.error("Gagal logout:", error);
        }
    };

    const handleMouseMove = (e) => {
        if (spotlightRef.current) {
            const x = e.clientX - 300; 
            const y = e.clientY - 300;
            spotlightRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
    };

    const getFirstName = (fullName) => {
        if (!fullName) return 'Pengguna';
        return fullName.trim().split(' ')[0];
    };

    const getInitials = (fullName) => {
        if (!fullName) return 'U';
        const parts = fullName.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return fullName.substring(0, 2).toUpperCase();
    };

    const navClasses = ({ isActive }) => 
        `h-12 rounded-xl flex items-center transition-all duration-200 overflow-hidden ${
            isActive ? 'bg-teal-600 text-white shadow-md shadow-teal-200/50' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-700'
        } ${isDesktopSidebarOpen ? 'px-4 mx-4 w-[calc(100%-2rem)] justify-start' : 'justify-center mx-auto w-12'}`;

    return (
        <div className="flex h-screen bg-[#F0FDFA] overflow-hidden font-ubuntu w-full relative z-0 group" onMouseMove={handleMouseMove}> 
            
            {toast.show && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-slide-down backdrop-blur-md font-ubuntu ${
                    toast.type === 'success' ? 'bg-white/90 border-teal-200 text-teal-800' : 'bg-white/90 border-rose-200 text-rose-800'
                }`}>
                    {toast.type === 'success' ? <CheckCircleIcon className="w-6 h-6 text-teal-500 stroke-2" /> : <ExclamationCircleIcon className="w-6 h-6 text-rose-500 stroke-2" />}
                    <span className="font-extrabold text-sm tracking-wide">{toast.message}</span>
                </div>
            )}

            <div className="absolute inset-0 z-[-2] bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
            
            <div ref={spotlightRef} className="absolute z-[-1] pointer-events-none rounded-full w-[600px] h-[600px] bg-teal-100/60 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ left: 0, top: 0, transform: 'translate(-1000px, -1000px)' }}></div>

            {/* MOBILE NAVBAR */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm border-b border-teal-100 z-[60] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-sm">VT</div>
                    <span className="font-extrabold text-slate-800 text-lg">VITATRACK.</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 p-1 bg-slate-50 rounded-lg">
                    <Bars3Icon className="w-7 h-7" />
                </button>
            </div>

            {/* MOBILE DRAWER */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[70] flex">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <aside className="w-3/4 max-w-sm bg-white h-full shadow-2xl relative z-[71] flex flex-col py-6 animate-slide-right">
                        <div className="flex justify-between items-center mb-10 px-6">
                            <div className="flex items-center gap-3"><div className="bg-teal-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black">VT</div><span className="font-extrabold text-slate-800 text-xl">VITATRACK.</span></div>
                            <button onClick={() => setIsMobileMenuOpen(false)}><XMarkIcon className="w-8 h-8 text-slate-400" /></button>
                        </div>
                        <nav className="flex-1 flex flex-col gap-2 w-full px-2">
                            <NavLink to="/dashboard" end onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3.5 rounded-xl flex items-center gap-4 text-slate-500 hover:text-teal-600 font-bold"><Squares2X2Icon className="w-6 h-6 stroke-2" />Ringkasan</NavLink>
                            <NavLink to="/dashboard/logs" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3.5 rounded-xl flex items-center gap-4 text-slate-500 hover:text-teal-600 font-bold"><ClipboardDocumentListIcon className="w-6 h-6 stroke-2" />Riwayat Log</NavLink>
                            <NavLink to="/dashboard/insights" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3.5 rounded-xl flex items-center gap-4 text-slate-500 hover:text-teal-600 font-bold"><SparklesIcon className="w-6 h-6 stroke-2" />Arsip AI</NavLink>
                            <NavLink to="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3.5 rounded-xl flex items-center gap-4 text-slate-500 hover:text-teal-600 font-bold"><UserCircleIcon className="w-6 h-6 stroke-2" />Profil User</NavLink>
                        </nav>
                        <div className="mt-auto px-6 w-full"><button onClick={handleLogout} className="py-4 w-full rounded-xl flex items-center gap-4 text-slate-400 hover:text-red-500 font-bold border-t border-slate-100"><ArrowLeftOnRectangleIcon className="w-6 h-6 stroke-2" /> Keluar</button></div>
                    </aside>
                </div>
            )}

            {isDesktopSidebarOpen && <div className="hidden md:block fixed inset-0 z-40 bg-transparent" onClick={() => setIsDesktopSidebarOpen(false)}></div>}

            {/* DESKTOP SIDEBAR */}
            <aside className={`hidden md:flex flex-col py-6 fixed top-0 left-0 h-full bg-white/90 backdrop-blur-xl border-r border-teal-100 z-50 transition-all duration-300 shadow-[4px_0_24px_rgba(13,148,136,0.05)] ${isDesktopSidebarOpen ? 'w-64' : 'w-24'}`}>
                <button onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} className="absolute -right-3.5 top-[3.25rem] bg-white border border-teal-100 text-teal-600 p-1.5 rounded-full shadow-md hover:bg-teal-50 transition-colors z-50">
                    {isDesktopSidebarOpen ? <ChevronLeftIcon className="w-4 h-4 stroke-2" /> : <ChevronRightIcon className="w-4 h-4 stroke-2" />}
                </button>
                <div className={`flex items-center mb-10 h-12 overflow-hidden transition-all duration-300 ${isDesktopSidebarOpen ? 'px-6 justify-start' : 'justify-center mx-auto w-12'}`}>
                    <div className="bg-teal-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-md">VT</div>
                    <span className={`ml-4 text-xl font-extrabold text-slate-800 tracking-tight transition-opacity duration-200 ${isDesktopSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>VITATRACK.</span>
                </div>
                <nav className="flex-1 flex flex-col gap-2 w-full">
                    <NavLink to="/dashboard" end onClick={() => setIsDesktopSidebarOpen(false)} className={navClasses}><Squares2X2Icon className="w-6 h-6 stroke-2 shrink-0" /><span className={`font-bold whitespace-nowrap transition-opacity duration-200 ${isDesktopSidebarOpen ? 'ml-4 opacity-100' : 'opacity-0 hidden'}`}>Ringkasan</span></NavLink>
                    <NavLink to="/dashboard/logs" onClick={() => setIsDesktopSidebarOpen(false)} className={navClasses}><ClipboardDocumentListIcon className="w-6 h-6 stroke-2 shrink-0" /><span className={`font-bold whitespace-nowrap transition-opacity duration-200 ${isDesktopSidebarOpen ? 'ml-4 opacity-100' : 'opacity-0 hidden'}`}>Riwayat Log</span></NavLink>
                    <NavLink to="/dashboard/insights" onClick={() => setIsDesktopSidebarOpen(false)} className={navClasses}><SparklesIcon className="w-6 h-6 stroke-2 shrink-0" /><span className={`font-bold whitespace-nowrap transition-opacity duration-200 ${isDesktopSidebarOpen ? 'ml-4 opacity-100' : 'opacity-0 hidden'}`}>Arsip AI</span></NavLink>
                    <NavLink to="/dashboard/profile" onClick={() => setIsDesktopSidebarOpen(false)} className={navClasses}><UserCircleIcon className="w-6 h-6 stroke-2 shrink-0" /><span className={`font-bold whitespace-nowrap transition-opacity duration-200 ${isDesktopSidebarOpen ? 'ml-4 opacity-100' : 'opacity-0 hidden'}`}>Profil User</span></NavLink>
                </nav>
                <div className="mt-auto w-full">
                    <button onClick={handleLogout} className={`h-12 rounded-xl flex items-center transition-all duration-200 overflow-hidden text-slate-400 hover:text-red-500 hover:bg-red-50 ${isDesktopSidebarOpen ? 'px-4 mx-4 w-[calc(100%-2rem)] justify-start' : 'justify-center mx-auto w-12'}`}>
                        <ArrowLeftOnRectangleIcon className="w-6 h-6 stroke-2 shrink-0" /><span className={`font-bold whitespace-nowrap transition-opacity duration-200 ${isDesktopSidebarOpen ? 'ml-4 opacity-100' : 'opacity-0 hidden'}`}>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* KONTEN UTAMA */}
            <main className="flex-1 overflow-y-auto w-full flex flex-col md:ml-24 mt-16 md:mt-0 relative z-10 custom-scrollbar">
                <header className="px-6 md:px-10 mt-6 md:mt-8 flex justify-between items-center w-full gap-4">
                    <div className="shrink-0 w-auto"><h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Hai, {getFirstName(userData.name)}.</h1></div>
                    <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm border border-teal-100 shrink-0">
                        <div className="text-right hidden sm:block"><p className="text-sm font-bold text-slate-700 leading-tight">{userData.name}</p><p className="text-xs text-slate-500 font-medium">{userData.email}</p></div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shadow-inner text-sm md:text-base shrink-0 uppercase">{getInitials(userData.name)}</div>
                    </div>
                </header>
                <div className="p-6 md:p-10 w-full flex-1">
                    <Outlet context={{ refreshLayoutUser, showToast }} /> 
                </div>
            </main>

            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');
                .font-ubuntu { font-family: 'Ubuntu', sans-serif !important; }
                @keyframes slide-right { from { transform: translateX(-100%); } to { transform: translateX(0); } }
                @keyframes slide-down { 
                    0% { transform: translate(-50%, -100%); opacity: 0; } 
                    100% { transform: translate(-50%, 0); opacity: 1; } 
                }
                .animate-slide-right { animation: slide-right 0.3s ease-out forwards; }
                .animate-slide-down { animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
            `}} />
        </div>
    );
}