import React from 'react';
import {
    BookOpen, Layout, PlusCircle, CheckCircle, ChevronRight, LogOut, Users, Award, List
} from 'lucide-react';

export default function TeacherDash({
    appUser, classes, selectedClass, setSelectedClass, isCreatingClass, setIsCreatingClass,
    newClassName, setNewClassName, handleCreateClass, createdQuizzes, quizResults,
    rosterForm, setRosterForm, handleAddStudentToClass, handleLogout, setView
}) {
    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-8 flex items-center gap-3 text-slate-800"><div className="bg-blue-600 text-white p-2 rounded-xl"><BookOpen size={24} /></div><span className="font-extrabold text-xl tracking-tight">EduQuest</span></div>
                <div className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-2 mt-4">Menu Utama</div>
                    <button onClick={() => setSelectedClass(null)} className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 font-bold ${!selectedClass ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Layout size={20} /> Dashboard</button>
                    <div className="flex justify-between items-center px-4 mt-8 mb-2"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kelas Saya</div><button onClick={() => setIsCreatingClass(!isCreatingClass)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"><PlusCircle size={16} /></button></div>
                    {isCreatingClass && <div className="px-2 mb-2 flex gap-2 animate-in slide-in-from-top-2"><input autoFocus className="w-full text-sm border border-slate-200 p-2.5 rounded-xl focus:border-blue-500 outline-none shadow-sm font-medium" placeholder="Nama Kelas..." value={newClassName} onChange={e => setNewClassName(e.target.value)} /><button onClick={handleCreateClass} className="bg-green-500 text-white p-2.5 rounded-xl hover:bg-green-600 shadow-sm transition"><CheckCircle size={18} /></button></div>}
                    <div className="space-y-1">{classes.map(c => <button key={c.id} onClick={() => setSelectedClass(c)} className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all duration-200 ${selectedClass?.id === c.id ? 'bg-white border border-blue-200 shadow-sm text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'}`}><div className="flex items-center gap-3"><span className={`w-2.5 h-2.5 rounded-full ${selectedClass?.id === c.id ? 'bg-blue-500' : 'bg-slate-300 group-hover:bg-blue-400'} transition-colors`}></span><span className="truncate w-32">{c.name}</span></div>{selectedClass?.id === c.id && <ChevronRight size={16} className="text-blue-500" />}</button>)}</div>
                </div>
                <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">{appUser?.name.charAt(0)}</div><div className="overflow-hidden"><div className="font-bold text-slate-800 text-sm truncate">{appUser?.name}</div><div className="text-xs text-slate-500">Guru Pengajar</div></div></div>
                    <button onClick={handleLogout} className="flex gap-2 text-red-600 hover:text-white hover:bg-red-500 text-xs font-bold items-center justify-center w-full py-2.5 rounded-xl transition-all duration-200 border border-red-100 hover:border-red-500"><LogOut size={14} /> Keluar Aplikasi</button>
                </div>
            </aside>
            <main className="flex-1 p-10 overflow-y-auto">
                {selectedClass ? (
                    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 flex justify-between items-center">
                            <div><div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">Kelas Aktif</span></div><h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">{selectedClass.name}</h2><p className="text-slate-500 font-medium mt-2 flex items-center gap-2"><Users size={18} /> {selectedClass.students?.length || 0} Siswa Terdaftar</p></div>
                            <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200"><input className="bg-transparent border-none outline-none p-2 w-40 text-sm font-medium placeholder:text-slate-400" placeholder="Nama Siswa" value={rosterForm.name} onChange={e => setRosterForm({ ...rosterForm, name: e.target.value })} /><div className="w-px bg-slate-200 my-1"></div><input className="bg-transparent border-none outline-none p-2 w-24 text-sm font-medium placeholder:text-slate-400" placeholder="Kelas" value={rosterForm.classroom} onChange={e => setRosterForm({ ...rosterForm, classroom: e.target.value })} /><button onClick={() => handleAddStudentToClass(selectedClass.id, selectedClass.students)} className="bg-blue-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md transition">Tambah</button></div>
                        </div>
                        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Award className="text-amber-500" /> Buku Nilai</h3></div>
                            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-white text-slate-500 font-bold border-b border-slate-100"><tr><th className="p-5 w-32 bg-slate-50/30">Kelas</th><th className="p-5 bg-slate-50/30">Nama Lengkap</th>{createdQuizzes.filter(q => q.assignedClassIds?.includes(selectedClass.id)).map(q => <th key={q.id} className="p-5 text-center border-l border-slate-100 min-w-[120px]"><div className="truncate w-24 mx-auto" title={q.title}>{q.title}</div></th>)}</tr></thead><tbody className="divide-y divide-slate-50">{(selectedClass.students || []).length === 0 ? <tr><td colSpan="100%" className="p-12 text-center text-slate-400 font-medium italic bg-slate-50/20">Belum ada siswa. Tambahkan di panel atas.</td></tr> : (selectedClass.students || []).map((s, i) => <tr key={i} className="hover:bg-blue-50/30 transition-colors group"><td className="p-5 text-slate-500 font-mono font-medium">{s.classroom}</td><td className="p-5 font-bold text-slate-700 group-hover:text-blue-700 transition">{s.name}</td>{createdQuizzes.filter(q => q.assignedClassIds?.includes(selectedClass.id)).map(q => { const r = quizResults.find(res => res.quizId === q.id && res.studentName.toLowerCase() === s.name.toLowerCase()); return <td key={q.id} className="p-5 text-center border-l border-slate-100">{r ? <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${r.score >= 70 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{r.score}</span> : <span className="text-slate-300">-</span>}</td> })}</tr>)}</tbody></table></div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[32px] p-12 flex flex-col md:flex-row justify-between items-center shadow-xl shadow-blue-900/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="relative z-10"><h2 className="text-4xl font-extrabold mb-3 tracking-tight">Buat Ujian Baru</h2><p className="text-blue-100 text-lg opacity-90 max-w-xl font-medium">Desain soal interaktif dan bagikan ke siswa dalam hitungan menit.</p></div>
                            <button onClick={() => setView('create-quiz')} className="relative z-10 mt-6 md:mt-0 bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform flex gap-3 items-center text-lg"><PlusCircle size={20} /> Mulai Buat</button>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2"><List className="text-blue-600" /> Perpustakaan Quiz Saya</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {createdQuizzes.length === 0 ? <div className="col-span-full p-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50"><BookOpen size={48} className="mx-auto mb-4 opacity-20" /><p className="font-medium">Belum ada quiz yang dibuat.</p></div> :
                                    createdQuizzes.map(q => (
                                        <div key={q.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group cursor-default flex flex-col justify-between h-48">
                                            <div><div className="flex justify-between items-start mb-3"><div className="flex gap-2">{q.assignedClassIds?.length ? <span className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-lg font-bold">Ditugaskan</span> : <span className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded-lg font-bold">Publik</span>}</div><div className="font-mono bg-slate-900 text-white px-2 py-1 rounded-lg text-xs font-bold tracking-widest">{q.code}</div></div><h4 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">{q.title}</h4></div>
                                            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-slate-400 text-sm font-medium"><span>{q.questions.length} Soal</span><span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-600 opacity-0 group-hover:opacity-100">Detail <ChevronRight size={14} /></span></div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
