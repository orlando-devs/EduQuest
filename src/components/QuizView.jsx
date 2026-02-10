import React from 'react';
import { Award, ArrowRight } from 'lucide-react';

export default function QuizView({
    quizFinished, activeQuiz, score, currentQuestionIdx, selectedAnswer,
    setSelectedAnswer, handleNextQuestion, setView, setRoomCode, setStudentTab
}) {
    if (quizFinished) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl max-w-md w-full border border-white animate-in zoom-in duration-300">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30 ring-8 ring-green-50">
                        <Award size={64} />
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Selesai!</h2>
                    <p className="text-slate-500 mb-10 font-medium text-lg">{activeQuiz.title}</p>
                    <div className="bg-slate-50 p-8 rounded-3xl mb-8 border border-slate-100">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-3">Skor Akhir</div>
                        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600">{Math.round(score)}</div>
                    </div>
                    <button onClick={() => { setView('student-dash'); setRoomCode(''); setStudentTab('dashboard'); }} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg transition shadow-xl hover:scale-[1.02]">
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const q = activeQuiz.questions[currentQuestionIdx];
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center p-6 font-sans">
            <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-xl border border-slate-200 overflow-hidden mt-10 flex flex-col">
                <div className="bg-white border-b border-slate-100 px-10 py-8 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-xl">{activeQuiz.title}</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mr-2">Progress</span>
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                            {currentQuestionIdx + 1} <span className="text-blue-300 mx-1">/</span> {activeQuiz.questions.length}
                        </div>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2">
                    <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%` }}></div>
                </div>
                <div className="p-12 md:p-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-slate-800 leading-tight">{q.question}</h2>
                    <div className="grid gap-5 mb-12">
                        {q.options.map((o, i) => (
                            <button key={i} onClick={() => setSelectedAnswer(o)} className={`w-full text-left p-6 rounded-2xl border-2 font-bold text-xl flex gap-6 items-center transition-all duration-200 group ${selectedAnswer === o ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-1 ring-blue-200 transform scale-[1.01]' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-slate-900'}`}>
                                <span className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${selectedAnswer === o ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-blue-200 group-hover:text-blue-700'}`}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                {o}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end pt-8 border-t border-slate-100">
                        <button onClick={handleNextQuestion} disabled={!selectedAnswer} className={`px-12 py-5 rounded-2xl font-bold text-lg shadow-xl transition-all transform active:scale-95 flex items-center gap-3 ${selectedAnswer ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/40 hover:-translate-y-1' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}>
                            Selanjutnya <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
