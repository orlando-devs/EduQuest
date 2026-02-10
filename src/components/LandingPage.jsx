import React from 'react';
import {
    BookOpen, Key, ArrowRight, Quote, Star,
    HelpCircle, Zap, CreditCard, Heart, Users, Target, List, ShieldAlert, X, Sparkles
} from 'lucide-react';
import Modal from './Modal';

export const TESTIMONIALS = [
    { name: "Sarah Putri", role: "Siswa Kelas 12", text: "EduQuest bikin ujian jadi nggak kerasa tegang. Tampilannya keren!", avatar: "bg-pink-100 text-pink-600" },
    { name: "Pak Budi", role: "Guru Matematika", text: "Sangat membantu saya mengelola nilai siswa. Hemat waktu koreksi!", avatar: "bg-blue-100 text-blue-600" },
    { name: "Rian Pratama", role: "Mahasiswa", text: "Platform paling stabil yang pernah saya coba. Nggak ada lag.", avatar: "bg-purple-100 text-purple-600" },
];

export default function LandingPage({ handleAuthNavigation, activeModal, setActiveModal }) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col overflow-x-hidden selection:bg-blue-100 relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 left-[-10%] w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold text-center py-2.5 px-4 shadow-md relative z-20">
                <span className="opacity-95 flex items-center justify-center gap-2"><Sparkles size={12} className="text-yellow-300" /> Platform Ujian #1 Pilihan Guru Indonesia - Gratis Selamanya!</span>
            </div>

            <nav className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-white/50 py-4 px-6 md:px-12 flex justify-between items-center transition-all shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                        <BookOpen size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-800">EduQuest<span className="text-blue-600">.</span></span>

                    <div className="hidden md:flex ml-10 gap-8 text-sm font-bold text-slate-500">
                        {['FAQ', 'Fitur', 'Harga'].map(item => (
                            <button key={item} onClick={() => setActiveModal(item.toLowerCase().replace('faq', 'faq').replace('fitur', 'features').replace('harga', 'pricing'))}
                                className="hover:text-blue-600 transition-colors relative group py-2">
                                {item}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full rounded-full"></span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => handleAuthNavigation('login', 'student')} className="hidden md:flex bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-200 items-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5 group">
                        <Key size={16} className="text-blue-500 group-hover:rotate-45 transition-transform" /> Masukkan Kode
                    </button>
                    <button onClick={() => handleAuthNavigation('login', 'teacher')} className="text-slate-600 font-bold text-sm hover:text-blue-700 px-4 transition-colors">Masuk</button>
                    <button onClick={() => handleAuthNavigation('register', 'teacher')} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                        Daftar Gratis <ArrowRight size={14} />
                    </button>
                </div>
            </nav>

            <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-24 relative z-10">
                <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-blue-100 rounded-full shadow-sm mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform cursor-default select-none">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Revolusi Pendidikan Digital</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 drop-shadow-sm">
                        Belajar Tanpa Batas, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Ujian Tanpa Cemas.</span>
                    </h1>

                    <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium">
                        Platform all-in-one yang menghubungkan guru dan siswa melalui asesmen interaktif, analisis mendalam, dan pengalaman belajar yang menyenangkan.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <button onClick={() => handleAuthNavigation('register', 'teacher')} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group">
                            Mulai Sekarang <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => alert("Hubungi Tim Sales kami untuk demo sekolah.")} className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                            Hubungi Kami
                        </button>
                    </div>
                </div>
            </div>

            <div className="py-24 px-6 border-t border-slate-200 bg-white/60 backdrop-blur-md relative z-10">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-extrabold text-slate-800 mb-3">Kisah Sukses Pengguna</h3>
                        <p className="text-slate-500 font-medium text-lg">Apa kata mereka tentang EduQuest?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((item, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300 flex flex-col relative group">
                                <Quote size={40} className="text-blue-100 absolute top-6 right-6 group-hover:text-blue-200 transition-colors" />
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${item.avatar}`}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                                        <p className="text-sm text-slate-500 font-medium">{item.role}</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 leading-relaxed flex-1 italic">"{item.text}"</p>
                                <div className="flex gap-1 mt-6 text-yellow-400">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FULL SCREEN MODALS */}
            {activeModal && (
                <Modal title={activeModal === 'faq' ? "FAQ & Tentang Kami" : activeModal === 'features' ? "Fitur Unggulan" : "Info Harga"}
                    onClose={() => setActiveModal(null)}
                    icon={activeModal === 'faq' ? HelpCircle : activeModal === 'features' ? Zap : CreditCard}
                    color={activeModal === 'faq' ? "blue" : activeModal === 'features' ? "purple" : "green"}>

                    {activeModal === 'faq' && (
                        <div className="space-y-12">
                            <div className="space-y-4">
                                {[
                                    { q: "Apakah EduQuest benar-benar gratis?", a: "Ya! EduQuest berkomitmen untuk menyediakan akses pendidikan gratis untuk semua fitur dasar tanpa biaya tersembunyi." },
                                    { q: "Bagaimana cara guru mendaftar?", a: "Guru dapat mendaftar dengan mengklik tombol 'Daftar Gratis' dan memasukkan kode akses khusus: EduQuestGuru26." },
                                    { q: "Bisakah siswa melihat nilai mereka?", a: "Tentu, siswa memiliki dashboard pribadi untuk melihat riwayat nilai dan kemajuan mereka secara real-time." },
                                    { q: "Apakah perlu menginstal aplikasi?", a: "Tidak, EduQuest berbasis web dan dapat diakses dari perangkat apa pun (Laptop, Tablet, HP) melalui browser." }
                                ].map((faq, i) => (
                                    <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>{faq.q}</h4>
                                        <p className="text-slate-600 text-sm leading-relaxed ml-4">{faq.a}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5 text-blue-900"><Heart size={200} /></div>
                                <h3 className="text-2xl font-extrabold text-blue-900 mb-6 flex items-center gap-3 relative z-10"><Users size={28} /> Kisah Tiga Sahabat</h3>
                                <div className="space-y-6 text-slate-700 leading-relaxed text-justify relative z-10 font-medium">
                                    <p>Pembuat website ini adalah tiga sahabat yang memiliki sebuah ide untuk menciptakan suatu aplikasi yang memudahkan guru dan siswa untuk berinteraksi secara real-time dan mengelola administrasi kelas tanpa kertas. Berawal dari diskusi sederhana mengenai tantangan pendidikan di era digital, kami menyadari bahwa teknologi seharusnya menjadi jembatan, bukan penghambat. Persahabatan kami yang solid menjadi fondasi kuat dalam menyatukan berbagai sudut pandang untuk membangun sebuah solusi yang tidak hanya fungsional, tetapi juga tepat sasaran bagi kebutuhan sekolah saat ini.</p>
                                    <p>Dalam proses pengembangannya, kami berkomitmen untuk menciptakan antarmuka yang ramah pengguna agar transisi menuju digitalisasi pendidikan terasa lebih ringan bagi siapa pun. Kami percaya bahwa setiap detik yang dihemat oleh guru dalam urusan administratif adalah waktu tambahan yang berharga untuk mendidik dan memberikan perhatian lebih kepada para siswa. Oleh karena itu, aplikasi ini dirancang sedemikian rupa untuk memangkas proses yang rumit menjadi rangkaian langkah yang intuitif dan efisien.</p>
                                    <p>Melalui platform ini, kami memiliki visi besar untuk menciptakan ekosistem belajar yang lebih inklusif dan terorganisir di seluruh Indonesia. Kami berharap inovasi kecil dari tiga sahabat ini dapat memberikan dampak besar dalam meningkatkan kualitas interaksi belajar-mengajar. Dengan memudahkan guru dan siswa untuk saling terhubung dan berbagi sumber daya secara praktis, kami optimis bahwa masa depan pendidikan kita akan menjadi jauh lebih dinamis, transparan, dan tentunya lebih maju.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeModal === 'features' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                { title: "Ujian Real-time", desc: "Siswa mengerjakan soal secara bersamaan dengan hasil instan.", img: <Target size={32} className="text-purple-600" />, bg: "bg-purple-50" },
                                { title: "Bank Soal", desc: "Simpan dan kelola ribuan soal untuk digunakan kembali.", img: <List size={32} className="text-blue-600" />, bg: "bg-blue-50" },
                                { title: "Analisis Nilai", desc: "Laporan otomatis untuk setiap siswa dan kelas.", img: <Award size={32} className="text-yellow-600" />, bg: "bg-yellow-50" },
                                { title: "Keamanan Anti-Cheat", desc: "Sistem satu kali pengerjaan untuk integritas ujian.", img: <ShieldAlert size={32} className="text-red-600" />, bg: "bg-red-50" }
                            ].map((feat, i) => (
                                <div key={i} className="flex flex-col gap-3 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all group bg-white">
                                    <div className={`p-4 rounded-2xl w-fit ${feat.bg} group-hover:scale-110 transition-transform`}>{feat.img}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-xl mb-2">{feat.title}</h4>
                                        <p className="text-slate-500 leading-relaxed">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeModal === 'pricing' && (
                        <div className="text-center py-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] h-full flex flex-col justify-center">
                            <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse ring-8 ring-green-50">
                                <CheckCircle size={64} />
                            </div>
                            <h2 className="text-5xl font-black text-slate-800 mb-6 tracking-tight">100% GRATIS</h2>
                            <div className="max-w-2xl mx-auto">
                                <p className="text-xl text-slate-600 font-medium leading-relaxed px-4 italic">
                                    "EduQuest Ini Bersifat Gratis dan Dapat Dipakai Oleh Siapapun, Dimanapun, dan Kapanpun."
                                </p>
                            </div>
                            <div className="mt-12 flex justify-center gap-4 flex-wrap">
                                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl font-bold border border-green-200 flex items-center gap-2 shadow-sm">
                                    <CheckCircle size={16} /> Tanpa Iklan
                                </div>
                                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl font-bold border border-green-200 flex items-center gap-2 shadow-sm">
                                    <CheckCircle size={16} /> Fitur Lengkap
                                </div>
                                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl font-bold border border-green-200 flex items-center gap-2 shadow-sm">
                                    <CheckCircle size={16} /> Unlimited Siswa
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
