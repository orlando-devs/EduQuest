import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, query, onSnapshot,
  updateDoc, doc, where, getDocs, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  signInAnonymously, onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';

import { auth, db, appId, initialAuthToken } from './firebase';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import TeacherDash from './components/TeacherDash';
import StudentDash from './components/StudentDash';
import CreateQuiz from './components/CreateQuiz';
import QuizView from './components/QuizView';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const validateClassroom = (classroom) => {
  const regex = /^([1-9]|1[0-2])[a-zA-Z]$/;
  return regex.test(classroom);
};

export default function App() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing');

  // UX States
  const [showSplash, setShowSplash] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Student Navigation State
  const [studentTab, setStudentTab] = useState('dashboard');

  // Auth State
  const [authMode, setAuthMode] = useState('login');
  const [loginRole, setLoginRole] = useState('student');
  const [loginForm, setLoginForm] = useState({ name: '', classroom: '', password: '', teacherCode: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Data & Actions
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({ question: '', options: ['', '', '', ''], answer: '' });
  const [rosterForm, setRosterForm] = useState({ name: '', classroom: '' });
  const [roomCode, setRoomCode] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2000);
    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) checkRememberMe();
      else setLoading(false);
    });

    return () => {
      clearTimeout(splashTimer);
      unsubscribe();
    };
  }, []);

  // --- LISTENERS ---
  useEffect(() => {
    if (!user || !appUser || appUser.role !== 'teacher') return;
    const unsubQuizzes = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), where('teacherId', '==', appUser.id)), (s) => setCreatedQuizzes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubClasses = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), where('teacherId', '==', appUser.id)), (s) => setClasses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubResults = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), orderBy('timestamp', 'desc')), (s) => setQuizResults(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubQuizzes(); unsubClasses(); unsubResults(); };
  }, [appUser, user]);

  useEffect(() => {
    if (!user || !appUser || appUser.role !== 'student') return;
    const unsubHistory = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('studentId', '==', appUser.id)), (s) => {
      const history = s.docs.map(d => ({ id: d.id, ...d.data() }));
      history.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setStudentHistory(history);
    });
    return () => unsubHistory();
  }, [appUser?.id, user]);

  // --- AUTH LOGIC ---
  const checkRememberMe = async () => {
    const savedUserId = localStorage.getItem('eduquest_uid');
    if (savedUserId) {
      const docSnap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('__name__', '==', savedUserId)));
      if (!docSnap.empty) {
        const userData = { id: docSnap.docs[0].id, ...docSnap.docs[0].data() };
        setAppUser(userData);
        setView(userData.role === 'teacher' ? 'teacher-dash' : 'student-dash');
      }
    }
    setLoading(false);
  };

  const handleAuthNavigation = (mode, role) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setAuthMode(mode);
      setLoginRole(role);
      setErrorMsg('');
      setSuccessMsg('');
      setLoginForm({ name: '', classroom: '', password: '', teacherCode: '' });
      setView('auth');
      setIsTransitioning(false);
    }, 800);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');

    try {
      if (authMode === 'register') {
        if (loginRole === 'teacher' && loginForm.teacherCode !== 'EduQuestGuru26') throw new Error("Kode Akses Guru salah!");

        if (loginRole === 'student') {
          if (!validateClassroom(loginForm.classroom)) {
            throw new Error("Format kelas salah! Harus Angka (1-12) + 1 Huruf. Contoh: 10A, 5B, 12C");
          }
        }

        const existing = await getDocs(query(usersRef, where('name', '==', loginForm.name), where('role', '==', loginRole)));
        if (!existing.empty) throw new Error("Nama pengguna sudah ada.");

        await addDoc(usersRef, {
          role: loginRole, name: loginForm.name, password: loginForm.password,
          classroom: loginRole === 'student' ? loginForm.classroom.toUpperCase() : null,
        });
        setSuccessMsg("Akun dibuat! Silakan login.");
        setTimeout(() => { setAuthMode('login'); setSuccessMsg(''); }, 1500);
      } else {
        const snap = await getDocs(query(usersRef, where('role', '==', loginRole), where('name', '==', loginForm.name)));
        let found = null;
        snap.forEach(d => {
          const data = d.data();
          if (data.password === loginForm.password) {
            if (loginRole !== 'student' || data.classroom === loginForm.classroom.toUpperCase()) found = { id: d.id, ...data };
          }
        });
        if (found) {
          rememberMe ? localStorage.setItem('eduquest_uid', found.id) : localStorage.removeItem('eduquest_uid');
          setAppUser(found);
          setView(found.role === 'teacher' ? 'teacher-dash' : 'student-dash');
        } else { throw new Error("Kredensial salah. Periksa data Anda."); }
      }
    } catch (err) { setErrorMsg(err.message || "Terjadi kesalahan."); }
    setLoading(false);
  };

  const handleLogout = () => {
    setAppUser(null); localStorage.removeItem('eduquest_uid'); setView('landing');
    setLoginForm({ name: '', classroom: '', password: '', teacherCode: '' });
    setSelectedClass(null); setQuestions([]); setQuizTitle(''); setRoomCode('');
    setStudentTab('dashboard');
  };

  // --- APP LOGIC ---
  const handleCreateClass = async () => {
    if (!newClassName) return;
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), { name: newClassName, teacherId: appUser.id, students: [] }); setNewClassName(''); setIsCreatingClass(false); } catch (e) { console.error(e); }
  };

  const handleAddStudentToClass = async (classId, currentStudents) => {
    if (!rosterForm.name || !rosterForm.classroom) return;
    try {
      const updatedStudents = [...(currentStudents || []), rosterForm].sort((a, b) => a.name.localeCompare(b.name));
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classId), { students: updatedStudents });
      setRosterForm({ name: '', classroom: '' });
      if (selectedClass && selectedClass.id === classId) setSelectedClass({ ...selectedClass, students: updatedStudents });
    } catch (e) { console.error(e); }
  };

  const addQuestionToLocalList = () => {
    if (!currentQ.question || !currentQ.answer || currentQ.options.some(o => !o)) return alert("Lengkapi data soal.");
    setQuestions([...questions, currentQ]);
    setCurrentQ({ question: '', options: ['', '', '', ''], answer: '' });
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle || questions.length === 0) return alert("Judul dan minimal 1 soal harus diisi.");
    setLoading(true);
    try {
      const code = generateRoomCode();
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), {
        title: quizTitle, questions: questions, code: code, teacherId: appUser.id,
        teacherName: appUser.name, assignedClassIds: selectedClassIds, createdAt: serverTimestamp()
      });
      alert(`Quiz Berhasil! Kode: ${code}`);
      setQuestions([]); setQuizTitle(''); setSelectedClassIds([]); setView('teacher-dash');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleJoinQuiz = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg('');
    try {
      const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), where('code', '==', roomCode.toUpperCase())));
      if (snap.empty) { setErrorMsg("Kode tidak ditemukan."); setLoading(false); return; }
      const quizData = { id: snap.docs[0].id, ...snap.docs[0].data() };

      const snapResult = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('studentId', '==', appUser.id), where('quizId', '==', quizData.id)));
      if (!snapResult.empty) { setErrorMsg("Sudah dikerjakan!"); setLoading(false); return; }

      setActiveQuiz(quizData); setView('quiz'); setCurrentQuestionIdx(0); setScore(0); setQuizFinished(false);
    } catch (e) { console.error(e); setErrorMsg("Gagal bergabung."); }
    setLoading(false);
  };

  const handleNextQuestion = async () => {
    let newScore = score;
    const currentQData = activeQuiz.questions[currentQuestionIdx];
    const pts = 100 / activeQuiz.questions.length;
    if (selectedAnswer === currentQData.answer) newScore += pts;
    setScore(newScore);

    if (currentQuestionIdx + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIdx(currentQuestionIdx + 1); setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
      try {
        const finalScore = Math.round(newScore + (selectedAnswer === currentQData.answer ? pts : 0));
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'results'), {
          quizId: activeQuiz.id, quizCode: activeQuiz.code, quizTitle: activeQuiz.title,
          studentId: appUser.id, studentName: appUser.name, studentClass: appUser.classroom,
          score: finalScore, timestamp: serverTimestamp()
        });
        setScore(finalScore);
      } catch (e) { console.error(e); }
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-out fade-out duration-700 fill-mode-forwards">
        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl animate-bounce">
          <BookOpen size={64} className="text-white" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-slate-800 tracking-tight animate-pulse">EduQuest</h1>
        <p className="text-slate-400 mt-2 font-medium">Memuat Aplikasi...</p>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-bold">Memproses...</p>
      </div>
    );
  }

  switch (view) {
    case 'landing':
      return <LandingPage handleAuthNavigation={handleAuthNavigation} activeModal={activeModal} setActiveModal={setActiveModal} />;
    case 'auth':
      return (
        <AuthScreen
          authMode={authMode} setAuthMode={setAuthMode}
          loginRole={loginRole} setLoginRole={setLoginRole}
          loginForm={loginForm} setLoginForm={setLoginForm}
          handleAuth={handleAuth} errorMsg={errorMsg} successMsg={successMsg}
          showPassword={showPassword} setShowPassword={setShowPassword}
          rememberMe={rememberMe} setRememberMe={setRememberMe}
          loading={loading} setView={setView}
        />
      );
    case 'teacher-dash':
      return (
        <TeacherDash
          appUser={appUser} classes={classes}
          selectedClass={selectedClass} setSelectedClass={setSelectedClass}
          isCreatingClass={isCreatingClass} setIsCreatingClass={setIsCreatingClass}
          newClassName={newClassName} setNewClassName={setNewClassName}
          handleCreateClass={handleCreateClass}
          createdQuizzes={createdQuizzes} quizResults={quizResults}
          rosterForm={rosterForm} setRosterForm={setRosterForm}
          handleAddStudentToClass={handleAddStudentToClass}
          handleLogout={handleLogout} setView={setView}
        />
      );
    case 'student-dash':
      return (
        <StudentDash
          appUser={appUser} studentTab={studentTab} setStudentTab={setStudentTab}
          darkMode={darkMode} setDarkMode={setDarkMode}
          studentHistory={studentHistory} handleJoinQuiz={handleJoinQuiz}
          roomCode={roomCode} setRoomCode={setRoomCode}
          errorMsg={errorMsg} handleLogout={handleLogout}
        />
      );
    case 'create-quiz':
      return (
        <CreateQuiz
          quizTitle={quizTitle} setQuizTitle={setQuizTitle}
          classes={classes} selectedClassIds={selectedClassIds} setSelectedClassIds={setSelectedClassIds}
          handleSaveQuiz={handleSaveQuiz} setView={setView}
          currentQ={currentQ} setCurrentQ={setCurrentQ}
          addQuestionToLocalList={addQuestionToLocalList}
          questions={questions} setQuestions={setQuestions}
        />
      );
    case 'quiz':
      return (
        <QuizView
          quizFinished={quizFinished} activeQuiz={activeQuiz}
          score={score} currentQuestionIdx={currentQuestionIdx}
          selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer}
          handleNextQuestion={handleNextQuestion}
          setView={setView} setRoomCode={setRoomCode} setStudentTab={setStudentTab}
        />
      );
    default:
      return null;
  }
}

// Re-using Loader2 and BookOpen for local components
import { BookOpen, Loader2 } from 'lucide-react';
