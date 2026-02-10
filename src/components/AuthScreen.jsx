import React from 'react';
import {
    ChevronRight, LogIn, UserPlus, Eye, EyeOff, ShieldAlert, CheckCircle, Loader2, Sparkles
} from 'lucide-react';

export default function AuthScreen({
    authMode, setAuthMode, loginRole, setLoginRole, loginForm, setLoginForm,
    handleAuth, errorMsg, successMsg, showPassword, setShowPassword,
    rememberMe, setRememberMe, loading, setView
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[32px] shadow-2xl relative z-10 p-8 border border-white animate-in zoom-in-95 duration-300">
                <button onClick={() => setView('landing')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 transition flex items-center gap-1 text-sm font-bold group">
                    <div className="p-1 rounded-full group-hover:bg-slate-100 transition"><ChevronRight className="rotate-180" size={18} /></div>
                </button>

                <div className="text-center mt-8 mb-8">
                    <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl mb-5 shadow-lg shadow-blue-500/30">
                        {authMode === 'login' ? <LogIn size={28} strokeWidth={2.5} /> : <UserPlus size={28} strokeWidth={2.5} />}
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{authMode === 'login' ? 'Selamat Datang' : 'Buat Akun'}</h2>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Silakan masukkan detail Anda untuk melanjutkan.</p>
                </div>

                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-8 border border-slate-200">
                    <button onClick={() => setLoginRole('student')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${loginRole === 'student' ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700 shadow-none bg-transparent'}`}>Siswa</button>
                    <button onClick={() => setLoginRole('teacher')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${loginRole === 'teacher' ? 'bg-white text-blue-700 shadow' : 'text-slate-500 hover:text-slate-700 shadow-none bg-transparent'}`}>Guru</button>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="group">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block tracking-wide group-focus-within:text-blue-600 transition-colors">Nama Lengkap</label>
                        <input type="text" required className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                            placeholder="Contoh: Budi Santoso" value={loginForm.name} onChange={e => setLoginForm({ ...loginForm, name: e.target.value })} />
                    </div>

                    {authMode === 'register' && loginRole === 'student' && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300 group">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block tracking-wide group-focus-within:text-blue-600 transition-colors">Kelas</label>
                            <input type="text" required className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="Format: 10A, 5B, 12C" value={loginForm.classroom} onChange={e => setLoginForm({ ...loginForm, classroom: e.target.value })} />
                        </div>
                    )}

                    <div className="group">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block tracking-wide group-focus-within:text-blue-600 transition-colors">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} required className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {authMode === 'register' && loginRole === 'teacher' && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="text-xs font-bold text-indigo-600 uppercase ml-1 mb-1.5 block tracking-wide flex items-center gap-1"><Sparkles size={12} /> Kode Akses Guru</label>
                            <input type="password" required className="w-full p-4 border border-indigo-200 rounded-2xl bg-indigo-50/30 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                                placeholder="Wajib untuk guru..." value={loginForm.teacherCode} onChange={e => setLoginForm({ ...loginForm, teacherCode: e.target.value })} />
                        </div>
                    )}

                    {errorMsg && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-2xl flex items-center gap-3 font-semibold border border-red-100 animate-in slide-in-from-top-2"><ShieldAlert size={18} className="shrink-0" /> {errorMsg}</div>}
                    {successMsg && <div className="text-green-600 text-sm bg-green-50 p-4 rounded-2xl flex items-center gap-3 font-semibold border border-green-100 animate-in slide-in-from-top-2"><CheckCircle size={18} className="shrink-0" /> {successMsg}</div>}

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all transform active:scale-[0.98] text-lg mt-4 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'Masuk Aplikasi' : 'Buat Akun Baru')}
                    </button>

                    {authMode === 'login' && (
                        <div className="flex items-center justify-center pt-2">
                            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer font-medium select-none hover:text-slate-800 transition-colors">
                                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300" />
                                Ingat saya di perangkat ini
                            </label>
                        </div>
                    )}
                </form>

                <div className="p-4 text-center text-sm text-slate-500 mt-6 border-t border-slate-100 pt-6">
                    {authMode === 'login' ? "Belum punya akun? " : "Sudah punya akun? "}
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-blue-600 font-extrabold hover:underline transition decoration-2 underline-offset-4">
                        {authMode === 'login' ? 'Daftar Sekarang' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}
