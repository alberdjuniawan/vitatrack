import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isRegisterMode, setIsRegisterMode] = useState(location.pathname === '/register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const toggleMode = () => {
        const newMode = !isRegisterMode;
        setIsRegisterMode(newMode);
        setError('');
        setPassword('');
        setPasswordConfirmation('');
        
        window.history.pushState(null, '', newMode ? '/register' : '/login');
    };

    const handleMouseMove = (e) => {
        const { currentTarget, clientX, clientY } = e;
        const rect = currentTarget.getBoundingClientRect();
        setMousePos({
            x: clientX - rect.left,
            y: clientY - rect.top
        });
    };

    useEffect(() => {
        setIsRegisterMode(location.pathname === '/register');
    }, [location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isRegisterMode) {
            if (password !== passwordConfirmation) {
                setError("Sandi tidak cocok, silakan periksa kembali.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.post('/api/register', { 
                    name, email, password, password_confirmation: passwordConfirmation 
                });
                const token = response.data.data?.access_token;
                if (token) {
                    localStorage.setItem('vitatrack_token', token);
                    window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    navigate('/dashboard');
                } else {
                    setIsRegisterMode(false);
                    setPassword('');
                    setPasswordConfirmation('');
                    window.history.pushState(null, '', '/login');
                    alert("Registrasi sukses! Silakan masuk.");
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal mendaftar. Email mungkin sudah terpakai.');
            }
        } else {
            try {
                const response = await axios.post('/api/login', { email, password });
                const token = response.data.data?.access_token;
                if (token) {
                    localStorage.setItem('vitatrack_token', token);
                    window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    navigate('/dashboard');
                } else {
                    setError("Sistem gagal mengenali token.");
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Email atau sandi salah.');
            }
        }
        setLoading(false);
    };

    const scrollToForm = () => {
        document.getElementById('auth-form-section').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen flex flex-col font-ubuntu bg-white overflow-x-hidden">
            
            <div 
                className="flex w-full flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative bg-white border-b border-slate-100 z-20 overflow-hidden group min-h-screen shrink-0"
                onMouseMove={handleMouseMove}
            >
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] lg:bg-[size:4rem_4rem]"></div>
                
                <div 
                    className="absolute z-0 pointer-events-none rounded-full w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] bg-teal-100/50 blur-[80px] lg:blur-[120px] transition-opacity duration-500 opacity-0 lg:group-hover:opacity-100"
                    style={{
                        left: mousePos.x - (window.innerWidth >= 1024 ? 400 : 300), 
                        top: mousePos.y - (window.innerWidth >= 1024 ? 400 : 300),
                    }}
                ></div>

                {/* Teks center sempurna buat HP maupun PC */}
                <div className="relative z-10 w-full flex flex-col items-center text-center max-w-md lg:max-w-3xl mx-auto animate-fade-in-up">
                    <h1 className="text-5xl sm:text-6xl lg:text-8xl font-unbounded font-black tracking-tight text-slate-800 mb-6 lg:mb-8 drop-shadow-sm">
                        VITATRACK.
                    </h1>
                    <p className="text-slate-500 text-base sm:text-lg lg:text-xl leading-relaxed font-medium">
                        Pantau metrik fisik, kualitas tidur, dan stabilitas emosionalmu. Biarkan kecerdasan buatan menyusun wawasan harian terbaik khusus untukmu.
                    </p>
                </div>

                <div className="absolute bottom-10 lg:bottom-12 inset-x-0 w-full flex justify-center z-30">
                    <button 
                        onClick={scrollToForm}
                        className="flex flex-col items-center animate-bounce text-teal-500 hover:text-teal-600 transition-colors cursor-pointer focus:outline-none"
                    >
                        <span className="text-sm lg:text-base font-ubuntu font-medium mb-1 text-teal-600/80">mulai</span>
                        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-teal-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div id="auth-form-section" className="w-full flex items-center justify-center py-16 px-6 sm:p-12 relative z-10 bg-gradient-to-br from-teal-50 via-teal-100/50 to-white min-h-screen">
                
                <div className="absolute top-[10%] right-[10%] lg:right-[20%] w-72 h-72 lg:w-96 lg:h-96 bg-teal-300 rounded-full blur-[100px] opacity-40 pointer-events-none animate-pulse-slow"></div>

                <div className="max-w-[420px] w-full bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(13,148,136,0.1)] border border-white relative z-10">
                    
                    <div className="text-left mb-8 animate-fade-in transition-all duration-300">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            {isRegisterMode ? 'Buat Akun Baru' : 'Selamat Datang'}
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm">
                            {isRegisterMode 
                                ? 'Lengkapi data di bawah untuk bergabung dengan Vitatrack.' 
                                : 'Masukkan kredensial Anda untuk melanjutkan perjalanan.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 animate-fade-in">
                            <XMarkIcon className="w-5 h-5 shrink-0 stroke-2" /> {error}
                        </div>
                    )}

                    <form key={isRegisterMode ? 'register-form' : 'login-form'} onSubmit={handleSubmit} className="space-y-5">
                        
                        {isRegisterMode && (
                            <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                                <input 
                                    type="text" value={name} onChange={(e) => setName(e.target.value)} required={isRegisterMode}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                        )}

                        <div className="animate-fade-in-up" style={{ animationDelay: isRegisterMode ? '0.1s' : '0.05s' }}>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Alamat Email</label>
                            <input 
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="contoh@email.com"
                            />
                        </div>

                        {isRegisterMode ? (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Kata Sandi</label>
                                    <input 
                                        type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder="Min. 8 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Ulangi Sandi</label>
                                    <input 
                                        type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required={isRegisterMode}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder="Konfirmasi"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Kata Sandi</label>
                                <input 
                                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder="Masukkan kata sandi"
                                />
                                <div className="flex items-center justify-between mt-4 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer" />
                                        <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Ingat saya</span>
                                    </label>
                                    <button type="button" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">Lupa sandi?</button>
                                </div>
                            </div>
                        )}

                        <div className="animate-fade-in-up pt-2" style={{ animationDelay: isRegisterMode ? '0.2s' : '0.15s' }}>
                            <button 
                                type="submit"  
                                disabled={loading}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 md:py-4 rounded-xl shadow-lg shadow-teal-200/50 transition-all flex justify-center items-center gap-2 disabled:bg-teal-400 tracking-wide text-base"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Memproses...</span>
                                    </>
                                ) : (isRegisterMode ? 'Buat Akun' : 'Masuk Sekarang')}
                            </button>
                        </div>
                    </form>

                    <p className="text-center mt-8 text-slate-500 text-sm animate-fade-in" style={{ animationDelay: '0.25s' }}>
                        {isRegisterMode ? 'Sudah memiliki akun? ' : 'Belum memiliki akun? '}
                        <button 
                            onClick={toggleMode} 
                            type="button"
                            className="text-teal-600 font-bold hover:underline hover:text-teal-700 outline-none transition-colors"
                        >
                            {isRegisterMode ? 'Masuk di sini' : 'Daftar di sini'}
                        </button>
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Ubuntu:wght@300;400;500;700&display=swap');
                
                .font-ubuntu { font-family: 'Ubuntu', sans-serif !important; }
                .font-unbounded { font-family: 'Unbounded', sans-serif !important; }

                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active{
                    -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
                    -webkit-text-fill-color: #1e293b !important;
                }

                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(15px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                @keyframes pulse-slow { 
                    0%, 100% { opacity: 0.3; transform: scale(1); } 
                    50% { opacity: 0.6; transform: scale(1.05); } 
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; opacity: 0; }
                .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
            `}} />
        </div>
    );
}