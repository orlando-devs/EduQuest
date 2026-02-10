import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  updateDoc, doc, where, getDocs, orderBy, serverTimestamp, deleteDoc, arrayUnion, getDoc, writeBatch
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  BookOpen, Users, LogOut, CheckCircle, 
  XCircle, Save, Award, Eye, EyeOff, 
  UserPlus, LogIn, PlusCircle, Trash2, Key, List,
  Layout, ChevronRight, ShieldAlert, School, ArrowRight,
  Sparkles, HelpCircle, Zap, CreditCard, X, Target, Star, Quote,
  Loader2, Clock, Bell, Heart, User, Search, UserCircle, WifiOff, Copy,
  PieChart, Settings, Home, PlayCircle, GraduationCap, Building2, Book, Hash, CheckSquare, Edit3, Lock, AlertTriangle, Filter, Mail, MessageSquare, Send, Menu
} from 'lucide-react';

// --- STYLES FOR ANIMATIONS ---
const styles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  .animate-fade-up {
    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .skeleton {
    background: linear-gradient(to right, #f1f5f9 4%, #e2e8f0 25%, #f1f5f9 36%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
  }
  .glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
`;

// --- COMPONENT: SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-48 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 rounded-2xl skeleton"></div>
      <div className="w-8 h-8 rounded-lg skeleton"></div>
    </div>
    <div className="space-y-3">
      <div className="h-6 w-3/4 rounded-lg skeleton"></div>
      <div className="h-4 w-1/2 rounded-lg skeleton"></div>
    </div>
  </div>
);

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("EduQuest Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans animate-fade-up">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
            <ShieldAlert size={48} className="text-red-500 mx-auto mb-4"/>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-slate-500 mb-6">Aplikasi mengalami kendala teknis.</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold w-full hover:scale-105 transition-transform">Muat Ulang</button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

// --- DATABASE SIMULATION (MOCK DB) ---
const MOCK_DB = { users: [], classes: [], quizzes: [], results: [] };

// --- FIREBASE INITIALIZATION & CONFIGURATION ---
// Inisialisasi variabel global untuk meniru import dari file terpisah
let app = null;
let auth = null;
let db = null;
let initialAuthToken = null;
let isOffline = false;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Set initialAuthToken jika tersedia di environment
    if (typeof __initial_auth_token !== 'undefined') {
      initialAuthToken = __initial_auth_token;
    }
  } else {
    isOffline = true;
    console.warn("Firebase config is missing. Running in offline/demo mode.");
  }
} catch (e) {
  isOffline = true;
  console.error("Error initializing Firebase:", e);
}

// --- UTILS ---
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let result = '';
  for (let i = 0; i < 6; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }
  return result;
};

const sortClassesByName = (classes) => {
    return [...classes].sort((a, b) => {
        if (!a.name || !b.name) return 0;
        const regex = /^(\d+)([a-zA-Z]*)/;
        const matchA = a.name.match(regex);
        const matchB = b.name.match(regex);

        if (matchA && matchB) {
            const numA = parseInt(matchA[1], 10);
            const numB = parseInt(matchB[1], 10);
            if (numA !== numB) return numA - numB;
            return (matchA[2] || '').localeCompare(matchB[2] || '');
        }
        return a.name.localeCompare(b.name);
    });
};

const validateClassroom = (classroom) => {
    const regex = /^([1-9]|1[0-2])[a-zA-Z]$/;
    return regex.test(classroom);
};

// --- COMPONENT: CONFIRMATION MODAL ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel, type = 'warning' }) => (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 w-[90%] max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                {type === 'danger' ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
            </div>
            <h3 className="text-xl font-black text-center text-slate-800 mb-2">{title}</h3>
            <p className="text-center text-slate-500 font-medium mb-8 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-3 flex-col sm:flex-row">
                <button onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors duration-200 active:scale-95">Batal</button>
                <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-200 active:scale-95 ${type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-black'}`}>
                    Ya, Lanjutkan
                </button>
            </div>
        </div>
    </div>
);

// --- COMPONENT: MODAL ---
const Modal = ({ title, children, onClose, icon: Icon, color = "blue" }) => (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[24px] md:rounded-[36px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 border border-white/40">
          <div className={`p-6 md:p-8 bg-gradient-to-r from-${color}-600 to-${color}-800 text-white flex justify-between items-center shadow-lg shrink-0 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 rotate-12"><Icon size={140}/></div>
              <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner"><Icon size={24} className="md:w-8 md:h-8"/></div>
                  <h3 className="text-xl md:text-3xl font-black tracking-tight line-clamp-1">{title}</h3>
              </div>
              <button onClick={onClose} type="button" className="p-2.5 hover:bg-white/20 rounded-full transition-colors relative z-10 active:scale-90 duration-200"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 custom-scrollbar">
              <div className="animate-fade-up">
                  {children}
              </div>
          </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
function EduQuestApp() {
  const [user, setUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing'); 
  const [dataLoading, setDataLoading] = useState(true);
  
  // UX States
  const [showSplash, setShowSplash] = useState(true); 
  const [isTransitioning, setIsTransitioning] = useState(false); 
  const [activeModal, setActiveModal] = useState(null); 
  const [confirmation, setConfirmation] = useState(null);
  const [teacherTab, setTeacherTab] = useState('overview'); 
  const [studentTab, setStudentTab] = useState('overview'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [copiedId, setCopiedId] = useState(null);
  const [quizSearch, setQuizSearch] = useState('');
  const [resultClassFilter, setResultClassFilter] = useState('All');

  // Data States
  const [classes, setClasses] = useState([]); 
  const [joinedClasses, setJoinedClasses] = useState([]); 
  const [createdQuizzes, setCreatedQuizzes] = useState([]);
  const [quizResults, setQuizResults] = useState([]); 
  const [studentHistory, setStudentHistory] = useState([]);

  // Forms
  const [authMode, setAuthMode] = useState('login'); 
  const [loginRole, setLoginRole] = useState('student'); 
  const [loginForm, setLoginForm] = useState({ name: '', password: '', teacherCode: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  // Features
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', school: '', subject: '' });
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedClassResults, setSelectedClassResults] = useState([]); 
  const [classModalTab, setClassModalTab] = useState('students'); 
  const [joinClassCode, setJoinClassCode] = useState(''); 
  const [attendanceModalClass, setAttendanceModalClass] = useState(null);
  const [selectedAbsen, setSelectedAbsen] = useState('');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null); 
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]); 
  const [questions, setQuestions] = useState([]); 
  const [currentQ, setCurrentQ] = useState({ question: '', options: ['', '', '', ''], answer: '', points: 10 });
  const [rosterForm, setRosterForm] = useState({ name: '', classroom: '' });
  const [roomCode, setRoomCode] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null); 
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizClassSelection, setQuizClassSelection] = useState(null); 
  
  // ANTI-CHEAT REF
  const alarmRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Add custom styles
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);

    const splashTimer = setTimeout(() => setShowSplash(false), 2500);

    const initAuth = async () => {
      // Logic from user request: handle initialAuthToken or anonymous sign in
      if (isOffline || !auth) { 
        setLoading(false); 
        return; 
      }
      
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Auth Error:", err);
        // Fallback to offline/demo if auth fails
        isOffline = true;
        setLoading(false);
      }
    };
    
    initAuth();

    let unsubscribe = () => {};
    if (!isOffline && auth) {
        unsubscribe = onAuthStateChanged(auth, (u) => {
          setUser(u);
          // Check for existing session on load (user requested this logic)
          if (u) {
            checkRememberMe(); 
          } else {
            setLoading(false);
          }
        });
    } else {
        setLoading(false);
    }

    return () => { 
        clearTimeout(splashTimer); 
        unsubscribe(); 
        if(document.head.contains(styleTag)) document.head.removeChild(styleTag); 
    };
  }, []);

  // --- DATA SYNC ---
  useEffect(() => {
    if (!appUser) return;
    setDataLoading(true);

    if (!isOffline && db) {
        if (appUser.role === 'teacher') {
            const unsubQuizzes = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), where('teacherId', '==', appUser.id)), (s) => {
                setCreatedQuizzes(s.docs.map(d => ({id: d.id, ...d.data()})));
                setDataLoading(false);
            });
            const unsubClasses = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), where('teacherId', '==', appUser.id)), (s) => setClasses(s.docs.map(d => ({id: d.id, ...d.data()}))));
            const unsubResults = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('teacherId', '==', appUser.id)), (s) => setQuizResults(s.docs.map(d => ({id: d.id, ...d.data()}))));
            return () => { unsubQuizzes(); unsubClasses(); unsubResults(); };
        } else {
            const unsubHistory = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('studentId', '==', appUser.id)), (s) => {
                const history = s.docs.map(d => ({id: d.id, ...d.data()}));
                history.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
                setStudentHistory(history);
                setDataLoading(false);
            });
            const unsubJoined = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), where('studentIds', 'array-contains', appUser.id)), (s) => {
                setJoinedClasses(s.docs.map(d => ({id: d.id, ...d.data()})));
            });
            return () => { unsubHistory(); unsubJoined(); };
        }
    } else {
        setDataLoading(false);
    }
  }, [appUser, view]);

  useEffect(() => {
    if (appUser?.role === 'teacher' && selectedClass && !isOffline && db) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('studentClass', '==', selectedClass.name));
        const unsub = onSnapshot(q, (s) => {
             setSelectedClassResults(s.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => unsub();
    } else if (appUser?.role === 'teacher' && selectedClass && isOffline) {
        setSelectedClassResults(MOCK_DB.results.filter(r => r.studentClass === selectedClass.name));
    }
  }, [selectedClass, appUser]);

  // --- ANTI-CHEAT EFFECT ---
  useEffect(() => {
    // 1. Inisialisasi Audio
    if (!alarmRef.current) {
        alarmRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
        alarmRef.current.loop = true;
    }

    // 2. Logic Deteksi
    const handleVisibilityChange = () => {
        if (view === 'quiz' && !quizFinished) {
            if (document.hidden) {
                // Tab disembunyikan/minimize -> Nyalakan Alarm
                alarmRef.current.play().catch(e => console.log("Play error:", e));
            } else {
                // Tab kembali aktif -> Matikan Alarm + Pesan
                alarmRef.current.pause();
                alarmRef.current.currentTime = 0;
                alert("⚠️ PERINGATAN: Dilarang meninggalkan halaman kuis!");
            }
        }
    };

    // Tambahan: Deteksi fokus window (untuk desktop yang klik window lain)
    const handleBlur = () => {
         if (view === 'quiz' && !quizFinished) {
             alarmRef.current.play().catch(e => console.log("Play error:", e));
         }
    };
    
    const handleFocus = () => {
        if (view === 'quiz' && !quizFinished && !alarmRef.current.paused) {
             alarmRef.current.pause();
             alarmRef.current.currentTime = 0;
             alert("⚠️ PERINGATAN: Tetap di halaman ujian!");
        }
    }

    // 3. Pasang Event Listener
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // 4. Cleanup
    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
        if (alarmRef.current) {
            alarmRef.current.pause();
            alarmRef.current.currentTime = 0;
        }
    };
  }, [view, quizFinished]); 


  // --- ACTIONS ---
  const handleCopyCode = (code, id) => {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed'; textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch (err) {}
    document.body.removeChild(textarea);
  };

  const checkRememberMe = async () => {
    // Only verify existing ID, don't auto-set user unless found
    if (isOffline) { setLoading(false); return; }
    
    let savedUserId = null;
    try { savedUserId = localStorage.getItem('eduquest_uid'); } catch(e) {}

    if (savedUserId && db) {
      try {
        const docSnap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'users'), where('__name__', '==', savedUserId)));
        if (!docSnap.empty) {
            // Auto login found user
            const userData = { id: docSnap.docs[0].id, ...docSnap.docs[0].data() };
            setAppUser(userData);
            setView(userData.role === 'teacher' ? 'teacher-dash' : 'student-dash');
        }
      } catch (e) {}
    }
    setLoading(false);
  };

  const handleAuthNavigation = (mode, role) => {
      setIsTransitioning(true);
      setTimeout(() => {
          setAuthMode(mode); setLoginRole(role); setErrorMsg(''); setSuccessMsg('');
          setLoginForm({ name: '', password: '', teacherCode: '' });
          setView('auth'); 
          setIsTransitioning(false);
      }, 500); 
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(''); setSuccessMsg('');

    if (authMode === 'register' && loginRole === 'teacher' && loginForm.teacherCode !== 'Eduquestguru26') {
        setErrorMsg("Kode Akses Guru salah!"); setLoading(false); return;
    }

    try {
        if (!isOffline && db) {
            const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
            if (authMode === 'register') {
                 const existing = await getDocs(query(usersRef, where('name', '==', loginForm.name)));
                 let nameExists = false; existing.forEach(d => { if(d.data().role === loginRole) nameExists = true; });
                 if (nameExists) throw new Error("Nama pengguna sudah terdaftar.");
                 await addDoc(usersRef, { role: loginRole, name: loginForm.name, password: loginForm.password, classroom: null });
                 setSuccessMsg("Akun dibuat! Silakan login secara manual.");
                 setTimeout(() => { 
                     setAuthMode('login'); 
                     setLoginForm({ name: '', password: '', teacherCode: '' }); 
                     setSuccessMsg(''); 
                     setLoading(false);
                 }, 1500);
            } else {
                 const snap = await getDocs(query(usersRef, where('name', '==', loginForm.name)));
                 let found = null;
                 snap.forEach(d => { if (d.data().password === loginForm.password) found = {id: d.id, ...d.data()}; });
                 if (found) {
                     setTimeout(() => {
                         setAppUser(found); 
                         setView(found.role === 'teacher' ? 'teacher-dash' : 'student-dash');
                         setLoading(false);
                     }, 800);
                 } else throw new Error("Nama atau Password salah.");
            }
        } else {
             setLoading(false);
        }
    } catch (err) { setErrorMsg(err.message || "Terjadi kesalahan."); setLoading(false); }
  };

  const handleLogout = () => {
    setAppUser(null); setIsSidebarOpen(false);
    setView('landing'); setLoginForm({ name: '', password: '', teacherCode: '' });
    setSelectedClass(null); setQuestions([]); setQuizTitle(''); setRoomCode('');
    setStudentTab('overview'); setTeacherTab('overview'); setConfirmation(null); 
    setCreatedQuizzes([]); setClasses([]); 
  };

  const confirmLogout = () => {
      setConfirmation({
          title: "Keluar Akun?",
          message: "Anda harus login kembali untuk mengakses data Anda.",
          onConfirm: handleLogout,
          onCancel: () => setConfirmation(null),
          type: "warning"
      });
  };

  const handleCreateClass = async () => {
      if(!classForm.name || !classForm.school || !classForm.subject) return alert("Mohon lengkapi semua data kelas.");
      const classCode = generateRoomCode(); 
      const classData = { name: classForm.name, school: classForm.school, subject: classForm.subject, code: classCode, teacherId: appUser.id, teacherName: appUser.name, students: [], studentIds: [], createdAt: isOffline ? { seconds: Date.now()/1000 } : serverTimestamp() };
      if (!isOffline && db) { try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), classData); } catch(e) { console.error(e); alert("Gagal membuat kelas."); return; } } 
      else { MOCK_DB.classes.push({ id: 'cls_'+Date.now(), ...classData }); setClasses([...MOCK_DB.classes.filter(c => c.teacherId === appUser.id)]); }
      setClassForm({ name: '', school: '', subject: '' }); setIsCreatingClass(false);
      alert(`Kelas Berhasil Dibuat! Kode Kelas: ${classCode}`);
  };

  const handleStudentJoinClass = async (e) => {
      e.preventDefault(); if (!joinClassCode) return;
      setLoading(true); setErrorMsg('');
      try {
          if (!isOffline && db) {
              const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'classes'), where('code', '==', joinClassCode.toUpperCase()));
              const snap = await getDocs(q);
              if (snap.empty) throw new Error("Kode kelas tidak ditemukan.");
              const classDoc = snap.docs[0]; const classData = classDoc.data();
              if (classData.studentIds && classData.studentIds.includes(appUser.id)) throw new Error("Anda sudah bergabung di kelas ini.");
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classDoc.id), { students: arrayUnion({ id: appUser.id, name: appUser.name, absen: null }), studentIds: arrayUnion(appUser.id) });
              alert(`Berhasil bergabung ke kelas ${classData.name}! Silakan pilih nomor absen Anda sekarang.`);
              setAttendanceModalClass({ id: classDoc.id, ...classData }); setJoinClassCode('');
          } else {
             // Mock
          }
      } catch (err) { setErrorMsg(err.message); }
      setLoading(false);
  };

  const handleUpdateAttendance = async () => {
      if(!attendanceModalClass || !selectedAbsen) return;
      const absenNum = parseInt(selectedAbsen);
      if (!isOffline && db) {
          const classRef = doc(db, 'artifacts', appId, 'public', 'data', 'classes', attendanceModalClass.id);
          const clsSnap = await getDoc(classRef);
          if(clsSnap.exists()) {
              const clsData = clsSnap.data();
              const updatedStudents = clsData.students.map(s => { if(s.id === appUser.id) return { ...s, absen: absenNum }; return s; });
              await updateDoc(classRef, { students: updatedStudents });
          }
      }
      setAttendanceModalClass(null); setSelectedAbsen(''); alert("Absen berhasil disimpan!");
  };

  const handleOpenClass = (cls) => {
      const studentRecord = cls.students?.find(s => s.id === appUser.id);
      if(studentRecord && !studentRecord.absen) setAttendanceModalClass(cls); else alert(`Anda terdaftar di kelas ${cls.name}. Absen: ${studentRecord?.absen}`);
  };

  const handleEditQuiz = (quiz) => {
      setEditingQuizId(quiz.id); setQuizTitle(quiz.title); setQuestions(quiz.questions || []); setSelectedClassIds(quiz.assignedClassIds || []); setIsCreatingQuiz(true);
  };

  const requestDeleteQuiz = (e, quizId) => {
      e.stopPropagation();
      setConfirmation({
          title: "Hapus Kuis?",
          message: "Tindakan ini tidak dapat dibatalkan. Kuis dan riwayat nilai terkait akan dihapus permanen.",
          type: "danger",
          onCancel: () => setConfirmation(null),
          onConfirm: async () => {
             if (!isOffline && db) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId)); } catch(e) { alert("Gagal menghapus kuis."); } } 
             else { MOCK_DB.quizzes = MOCK_DB.quizzes.filter(q => q.id !== quizId); setCreatedQuizzes([...MOCK_DB.quizzes.filter(q => q.teacherId === appUser.id)]); }
             setConfirmation(null);
          }
      });
  };

  const requestDeleteClass = (e, classId) => {
      e.stopPropagation();
      setConfirmation({
          title: "Hapus Kelas?",
          message: "Menghapus kelas akan menghapus semua data siswa di dalamnya. Lanjutkan?",
          type: "danger",
          onCancel: () => setConfirmation(null),
          onConfirm: async () => {
             if(!isOffline && db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'classes', classId));
             setSelectedClass(null); setConfirmation(null);
          }
      });
  };

  const confirmSaveQuiz = () => {
    if (editingQuizId) {
        setConfirmation({ title: "Update Kuis?", message: "Perubahan pada soal dan pengaturan kuis akan disimpan.", type: "warning", onCancel: () => setConfirmation(null), onConfirm: () => { handleSaveQuiz(); setConfirmation(null); } });
    } else handleSaveQuiz();
  };

  const confirmFinishQuiz = () => {
      setConfirmation({ title: "Selesaikan Kuis?", message: "Pastikan semua jawaban sudah terisi. Anda tidak dapat mengubahnya lagi setelah ini.", type: "warning", onCancel: () => setConfirmation(null), onConfirm: () => { handleNextQuestion(true); setConfirmation(null); } });
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle || questions.length === 0) return alert("Isi judul dan minimal 1 soal.");
    if (selectedClassIds.length === 0) return alert("Pilih minimal satu kelas.");
    setLoading(true);
    const code = generateRoomCode();
    const allowedClassNames = classes.filter(c => selectedClassIds.includes(c.id)).map(c => c.name);
    const quizData = { title: quizTitle, questions: questions, teacherId: appUser.id, teacherName: appUser.name, assignedClassIds: selectedClassIds, allowedClassNames, ...(editingQuizId ? {} : { code: code, createdAt: isOffline ? { seconds: Date.now()/1000 } : serverTimestamp() }) };
    if (!isOffline && db) { 
        try { if (editingQuizId) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', editingQuizId), quizData); alert(`Kuis Berhasil Diupdate!`); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), quizData); alert(`Kuis Berhasil Dibuat! Kode: ${code}`); } } catch(e) { console.error(e); } 
    }
    setQuestions([]); setQuizTitle(''); setSelectedClassIds([]); setIsCreatingQuiz(false); setEditingQuizId(null); setTeacherTab('quizzes'); setLoading(false);
  };

  const handleJoinQuiz = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMsg('');
    const findQuiz = async () => { if (!isOffline && db) { const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'quizzes'), where('code', '==', roomCode.toUpperCase()))); return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }; } else { return MOCK_DB.quizzes.find(q => q.code === roomCode.toUpperCase()); } };
    const checkResult = async (quizId) => { if (!isOffline && db) { const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('studentId', '==', appUser.id), where('quizId', '==', quizId))); return !snap.empty; } else { return MOCK_DB.results.some(r => r.studentId === appUser.id && r.quizId === quizId); } };
    try {
        const quizData = await findQuiz();
        if (!quizData) { setErrorMsg("Kode tidak ditemukan."); setLoading(false); return; }
        const allowed = quizData.allowedClassNames || [];
        const studentJoinedClassNames = joinedClasses.map(c => c.name);
        const validClasses = allowed.filter(clsName => studentJoinedClassNames.includes(clsName));
        if (allowed.length > 0 && validClasses.length === 0) { setErrorMsg(`Akses Ditolak. Anda belum bergabung dengan kelas target (${allowed.join(", ")}).`); setLoading(false); return; }
        const alreadyDone = await checkResult(quizData.id);
        if (alreadyDone) { setErrorMsg("Sudah dikerjakan!"); setLoading(false); return; }
        setQuizClassSelection(null); setActiveQuiz({ ...quizData, validClassesForStudent: validClasses.length > 0 ? validClasses : allowed }); setView('quiz'); setCurrentQuestionIdx(0); setScore(0); setQuizFinished(false);
    } catch(e) { setErrorMsg("Error: " + e.message); }
    setLoading(false);
  };

  const handleNextQuestion = async (forceFinish = false) => {
    let newScore = score;
    if (!activeQuiz || !activeQuiz.questions) return;
    const currentQData = activeQuiz.questions[currentQuestionIdx];
    
    // NEW: Use custom points or default to equal distribution
    const questionPoints = parseInt(currentQData.points) || 0;
    
    if (selectedAnswer === currentQData.answer) newScore += questionPoints;
    setScore(newScore);
    
    if (!forceFinish && currentQuestionIdx + 1 < activeQuiz.questions.length) { 
        setCurrentQuestionIdx(currentQuestionIdx + 1); 
        setSelectedAnswer(null); 
    } else {
      setQuizFinished(true);
      const finalScore = Math.min(100, Math.round(newScore + ((!forceFinish && selectedAnswer === currentQData.answer) ? questionPoints : 0)));
      
      const resultData = { quizId: activeQuiz.id, quizCode: activeQuiz.code, quizTitle: activeQuiz.title, studentId: appUser.id, studentName: appUser.name, studentClass: quizClassSelection || 'Umum', score: finalScore, isPublished: false, timestamp: isOffline ? { seconds: Date.now()/1000 } : serverTimestamp(), teacherId: activeQuiz.teacherId };
      if (!isOffline && db) { try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'results'), resultData); } catch(e) {} } 
      setScore(finalScore);
    }
  };

  const handlePublishResults = async (quizId, className) => {
      if(!confirm(`Publikasikan nilai untuk kuis ini di kelas ${className}? Siswa akan dapat melihat nilainya.`)) return;
      if (!isOffline && db) {
          try {
              const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'results'), where('quizId', '==', quizId), where('studentClass', '==', className));
              const snapshot = await getDocs(q);
              if (snapshot.empty) { alert("Tidak ada data siswa untuk dipublikasikan."); return; }
              const batch = writeBatch(db);
              snapshot.docs.forEach(d => { if (d.data().isPublished !== true) { batch.update(d.ref, { isPublished: true }); } });
              await batch.commit(); alert("Nilai berhasil dipublikasikan!");
          } catch(e) { console.error("Publish error:", e); alert("Gagal mempublikasikan nilai."); }
      }
  };

  const addQuestionToLocalList = () => {
    if (!currentQ.question || !currentQ.answer || currentQ.options.some(o => !o)) return alert("Lengkapi data soal.");
    
    // NEW: VALIDATE POINTS
    const newPoints = parseInt(currentQ.points) || 0;
    const currentTotalPoints = questions.reduce((acc, q) => acc + (parseInt(q.points) || 0), 0);
    
    if (currentTotalPoints + newPoints > 100) {
        return alert(`Total poin melebihi 100! Sisa poin yang tersedia: ${100 - currentTotalPoints}`);
    }
    
    setQuestions([...questions, currentQ]);
    setCurrentQ({ question: '', options: ['', '', '', ''], answer: '', points: 10 });
  };

  const toggleClassSelection = (classId) => {
    if (selectedClassIds.includes(classId)) setSelectedClassIds(selectedClassIds.filter(id => id !== classId));
    else setSelectedClassIds([...selectedClassIds, classId]);
  };

  const handleContactSubmit = (e) => { e.preventDefault(); alert(`Terima kasih ${contactForm.name}! Pesan Anda telah kami terima.`); setContactForm({ name: '', email: '', message: '' }); setActiveModal(null); };

  // --- RENDER ---
  if (showSplash) {
      return (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-out fade-out duration-1000 fill-mode-forwards">
              <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] shadow-2xl shadow-blue-900/20 animate-bounce">
                  <BookOpen size={80} className="text-white drop-shadow-md"/>
              </div>
              <h1 className="mt-8 text-5xl font-extrabold text-slate-800 tracking-tighter animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">EduQuest</h1>
              <p className="text-slate-400 mt-3 font-semibold text-lg">Memuat Aplikasi...</p>
          </div>
      );
  }

  if (isTransitioning) {
      return (
          <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center">
              <Loader2 size={64} className="text-blue-600 animate-spin mb-6"/>
              <p className="text-slate-600 font-bold text-xl animate-pulse">Memproses...</p>
          </div>
      );
  }
  
  const publishedHistory = studentHistory.filter(h => h.isPublished);
  const currentTotalPoints = questions.reduce((acc, q) => acc + (parseInt(q.points) || 0), 0);

  return (
    <div className="font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
       {confirmation && <ConfirmationModal title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={confirmation.onCancel} type={confirmation.type} />}
       {isOffline && <div className="bg-amber-100 text-amber-800 text-xs font-bold text-center py-2 px-4 border-b border-amber-200 flex items-center justify-center gap-2 shadow-sm relative z-[60]"><ShieldAlert size={14}/> Mode Demo Offline Aktif - Data tidak tersimpan ke server</div>}

       {/* 1. LANDING PAGE */}
       {view === 'landing' && (
           <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                 <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
                 <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-[100px] animate-pulse"></div>
                 <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
             </div>

             <nav className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 py-4 px-6 md:px-12 flex justify-between items-center transition-all shadow-sm">
                 <div className="flex items-center gap-3 group cursor-pointer" onClick={()=>window.location.reload()}>
                     <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white group-hover:scale-110 transition-transform duration-300">
                        <BookOpen size={24} strokeWidth={2.5}/>
                     </div>
                     <span className="font-extrabold text-2xl tracking-tight text-slate-800 group-hover:text-blue-600 transition-colors">EduQuest<span className="text-blue-500">.</span></span>
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <button onClick={() => handleAuthNavigation('login', 'student')} className="hidden md:flex bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-200 items-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5 group active:scale-95"><Key size={16} className="text-blue-500 group-hover:rotate-45 transition-transform"/> Masukkan Kode</button>
                     <button onClick={() => handleAuthNavigation('login', 'student')} className="text-slate-600 font-bold text-sm hover:text-blue-700 px-4 transition-colors active:scale-95">Masuk</button>
                     <button onClick={() => handleAuthNavigation('register', 'student')} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95">Daftar Gratis <ArrowRight size={14}/></button>
                 </div>
             </nav>
             <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-24 relative z-10">
                 <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-blue-100 rounded-full shadow-sm mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-105 transition-transform cursor-default select-none">
                         <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                         <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Revolusi Pendidikan Digital</span>
                     </div>
                     <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 drop-shadow-sm">Belajar Tanpa Batas, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Ujian Tanpa Cemas.</span></h1>
                     <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium">Platform all-in-one yang menghubungkan guru dan siswa melalui asesmen interaktif, analisis mendalam, dan pengalaman belajar yang menyenangkan.</p>
                     <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                         <button onClick={() => handleAuthNavigation('register', 'teacher')} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center group min-w-[200px] active:scale-95">
                             <span className="text-xs font-medium opacity-80 uppercase tracking-wider mb-0.5">Guru</span>
                             <span className="flex items-center gap-2">Daftar Gratis <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></span>
                         </button>
                         <button onClick={() => setActiveModal('contact')} className="w-full sm:w-auto bg-white text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95">Hubungi Kami</button>
                     </div>
                 </div>
             </div>
             {activeModal === 'contact' && (
                 <Modal title="Hubungi Kami" onClose={() => setActiveModal(null)} icon={Mail} color="blue">
                     <form onSubmit={handleContactSubmit} className="space-y-6">
                         <div><label className="block text-sm font-bold text-slate-600 mb-2">Nama Lengkap</label><div className="relative"><User className="absolute left-4 top-4 text-slate-400" size={20}/><input required className="w-full p-4 pl-12 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors" placeholder="Masukkan nama Anda" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})}/></div></div>
                         <div><label className="block text-sm font-bold text-slate-600 mb-2">Email</label><div className="relative"><Mail className="absolute left-4 top-4 text-slate-400" size={20}/><input type="email" required className="w-full p-4 pl-12 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors" placeholder="email@sekolah.com" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})}/></div></div>
                         <div><label className="block text-sm font-bold text-slate-600 mb-2">Pesan</label><div className="relative"><MessageSquare className="absolute left-4 top-4 text-slate-400" size={20}/><textarea required className="w-full p-4 pl-12 border border-slate-200 rounded-xl outline-none focus:border-blue-500 min-h-[120px] transition-colors" placeholder="Tulis pesan Anda di sini..." value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})}/></div></div>
                         <div className="flex justify-end pt-4"><button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 active:scale-95 transition-all"><Send size={18}/> Kirim Pesan</button></div>
                     </form>
                 </Modal>
             )}
           </div>
       )}

       {/* 2. AUTH SCREEN */}
       {view === 'auth' && (
           <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
              <div className="absolute inset-0 z-0">
                  <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl w-full max-w-md rounded-[40px] shadow-2xl relative z-10 p-10 border border-white/50 animate-in zoom-in-95 duration-500">
                  <button onClick={() => setView('landing')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 transition flex items-center gap-1 text-sm font-bold group">
                      <div className="p-1 rounded-full group-hover:bg-slate-100 transition"><ChevronRight className="rotate-180" size={18}/></div>
                  </button>
                  
                  <div className="text-center mt-6 mb-8">
                      <div className="inline-flex p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl mb-6 shadow-xl shadow-blue-500/30">
                         {authMode === 'login' ? <LogIn size={32} strokeWidth={2.5}/> : <UserPlus size={32} strokeWidth={2.5}/>}
                      </div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                          {authMode === 'login' ? 'Selamat Datang' : (loginRole === 'teacher' ? 'Daftar Guru' : 'Daftar Siswa')}
                      </h2>
                      <p className="text-slate-500 text-sm mt-2 font-medium">
                          {authMode === 'login' ? 'Masuk untuk melanjutkan.' : 'Lengkapi data untuk membuat akun.'}
                      </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-5">
                      <div className="group">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block tracking-wide group-focus-within:text-blue-600 transition-colors">Nama Lengkap</label>
                          <input type="text" required className="w-full p-4 border border-slate-200 rounded-2xl bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-normal" 
                             placeholder="Contoh: Budi Santoso" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})}/>
                      </div>
                      
                      <div className="group">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block tracking-wide group-focus-within:text-blue-600 transition-colors">Password</label>
                          <div className="relative">
                             <input type={showPassword ? "text" : "password"} required className="w-full p-4 border border-slate-200 rounded-2xl bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-normal" 
                                 placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}/>
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1">
                                 {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                             </button>
                          </div>
                      </div>

                      {authMode === 'register' && loginRole === 'teacher' && (
                          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                              <label className="text-xs font-bold text-indigo-600 uppercase ml-1 mb-1.5 block tracking-wide flex items-center gap-1"><Sparkles size={12}/> Kode Akses Guru</label>
                              <input type="password" required className="w-full p-4 border border-indigo-200 rounded-2xl bg-indigo-50/30 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-normal" 
                                 placeholder="Wajib untuk guru..." value={loginForm.teacherCode} onChange={e => setLoginForm({...loginForm, teacherCode: e.target.value})}/>
                          </div>
                      )}

                      {errorMsg && <div className="text-red-600 text-sm bg-red-50 p-4 rounded-2xl flex items-center gap-3 font-bold border border-red-100 animate-in slide-in-from-top-2"><ShieldAlert size={18} className="shrink-0"/> {errorMsg}</div>}
                      {successMsg && <div className="text-green-600 text-sm bg-green-50 p-4 rounded-2xl flex items-center gap-3 font-bold border border-green-100 animate-in slide-in-from-top-2"><CheckCircle size={18} className="shrink-0"/> {successMsg}</div>}

                      <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all transform active:scale-[0.98] text-lg mt-4 flex justify-center items-center gap-2">
                          {loading ? <Loader2 className="animate-spin" size={20}/> : (authMode === 'login' ? 'Masuk Aplikasi' : 'Buat Akun')}
                      </button>
                  </form>

                  <div className="p-4 text-center text-sm text-slate-500 mt-6 border-t border-slate-100 pt-6">
                      {authMode === 'login' ? "Belum punya akun? " : "Sudah punya akun? "}
                      {authMode === 'login' ? (
                          <button onClick={() => setAuthMode('register')} className="text-blue-600 font-extrabold hover:underline transition decoration-2 underline-offset-4">
                              Daftar Sekarang
                          </button>
                      ) : (
                          <button onClick={() => setAuthMode('login')} className="text-blue-600 font-extrabold hover:underline transition decoration-2 underline-offset-4">
                              Login
                          </button>
                      )}
                  </div>
              </div>
           </div>
       )}

       {/* 3. TEACHER DASHBOARD */}
       {view === 'teacher-dash' && (
         <div className="h-screen bg-slate-50 font-sans flex flex-col md:flex-row overflow-hidden">
           {/* MOBILE OVERLAY */}
           {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}></div>}
           
           <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex-col relative overflow-hidden h-full transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative`}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
             <div className="p-8 border-b border-slate-800 flex items-center gap-3 relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-900/50"><BookOpen size={24}/></div>
                <span className="text-white font-extrabold text-2xl tracking-tight">EduGuru</span>
             </div>
             <div className="p-6 space-y-3 relative z-10 flex-1">
               {[
                 {id: 'overview', icon: Layout, label: 'Beranda'},
                 {id: 'classes', icon: Users, label: 'Kelas Saya'},
                 {id: 'quizzes', icon: List, label: 'Bank Soal'},
                 {id: 'results', icon: Award, label: 'Nilai Siswa'},
               ].map(menu => (
                 <button key={menu.id} onClick={() => { setTeacherTab(menu.id); setIsSidebarOpen(false); }}
                   className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 font-bold text-sm active:scale-95 ${teacherTab === menu.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}>
                   <menu.icon size={20}/> {menu.label}
                 </button>
               ))}
             </div>
             <div className="p-6 relative z-10">
                <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 mb-4 border border-slate-700">
                    <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Login Sebagai</div>
                    <div className="text-white font-bold truncate flex items-center gap-2"><UserCircle size={16}/> {appUser?.name}</div>
                </div>
                <button onClick={confirmLogout} className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-500/20 p-4 rounded-2xl font-bold transition-all active:scale-95">
                  <LogOut size={20}/> Logout
                </button>
             </div>
           </aside>

           <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#F8FAFC] h-full">
             <header className="flex justify-between items-center mb-6 md:mb-10">
               <div className="flex items-center gap-4">
                 <button className="md:hidden p-2 bg-white rounded-xl shadow-sm active:scale-95 transition-transform" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
                 <div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-1 md:mb-2">
                    {teacherTab === 'overview' && 'Dashboard Overview'}
                    {teacherTab === 'classes' && 'Manajemen Kelas'}
                    {teacherTab === 'quizzes' && 'Bank Kuis & Soal'}
                    {teacherTab === 'results' && 'Rekap Nilai Siswa'}
                    </h2>
                    <p className="text-slate-500 font-medium text-sm md:text-lg hidden md:block">Kelola aktivitas pembelajaran Anda dengan mudah.</p>
                 </div>
               </div>
               <button className="bg-white p-3 rounded-full shadow-md text-slate-400 border border-slate-200 hover:text-blue-600 hover:scale-110 transition-all"><Bell size={24}/></button>
             </header>

             <div key={teacherTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {teacherTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                         <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[32px] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group transition-transform hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700"><Users size={120}/></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm"><Users size={32}/></div>
                                </div>
                                <div className="text-6xl font-black mb-2">{classes.length}</div>
                                <div className="text-blue-100 font-bold text-lg">Kelas Aktif</div>
                            </div>
                         </div>
                         <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex justify-between items-start mb-6">
                               <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl"><List size={32}/></div>
                            </div>
                            <div className="text-6xl font-black text-slate-800 mb-2">{createdQuizzes.length}</div>
                            <div className="text-slate-500 font-bold text-lg">Kuis Dibuat</div>
                         </div>
                         <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                            <div className="flex justify-between items-start mb-6">
                               <div className="p-4 bg-green-100 text-green-600 rounded-2xl"><Award size={32}/></div>
                            </div>
                            <div className="text-6xl font-black text-slate-800 mb-2">{quizResults.length}</div>
                            <div className="text-slate-500 font-bold text-lg">Total Pengerjaan</div>
                         </div>
                      </div>
                 )}

                 {teacherTab === 'classes' && (
                   <div className="space-y-8">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
                        <div>
                            <h3 className="font-bold text-slate-800 text-xl">Daftar Kelas</h3>
                            <p className="text-slate-500 text-sm">Buat dan kelola kelas siswa.</p>
                        </div>
                        <button onClick={() => setIsCreatingClass(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 w-full md:w-auto justify-center active:scale-95">
                            <PlusCircle size={20}/> Buat Kelas Baru
                        </button>
                     </div>

                     {/* MODAL BUAT KELAS BARU */}
                     {isCreatingClass && (
                         <Modal title="Buat Kelas Baru" onClose={() => setIsCreatingClass(false)} icon={School}>
                             <div className="space-y-6">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Kelas</label>
                                     <input value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} placeholder="Contoh: 12 IPA 1" className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold transition-all"/>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Sekolah</label>
                                     <div className="relative">
                                         <Building2 className="absolute left-4 top-4 text-slate-400" size={20}/>
                                         <input value={classForm.school} onChange={e => setClassForm({...classForm, school: e.target.value})} placeholder="Contoh: SMA Negeri 1" className="w-full p-4 pl-12 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold transition-all"/>
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mata Pelajaran</label>
                                     <div className="relative">
                                         <Book className="absolute left-4 top-4 text-slate-400" size={20}/>
                                         <input value={classForm.subject} onChange={e => setClassForm({...classForm, subject: e.target.value})} placeholder="Contoh: Matematika Wajib" className="w-full p-4 pl-12 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold transition-all"/>
                                     </div>
                                 </div>
                                 <div className="flex justify-end gap-3 pt-4">
                                     <button type="button" onClick={() => setIsCreatingClass(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 active:scale-95 transition-all">Batal</button>
                                     <button type="button" onClick={handleCreateClass} className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Simpan Kelas</button>
                                 </div>
                             </div>
                         </Modal>
                     )}

                     {dataLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                             {[1,2,3].map(i => <SkeletonCard key={i}/>)}
                        </div>
                     ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {classes.map(cls => (
                               <div key={cls.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl group-hover:bg-orange-400/20 transition-colors"></div>
                                  <div className="flex justify-between items-start mb-6 relative z-10">
                                     <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform"><School size={32}/></div>
                                     <div className="flex gap-2">
                                        <button onClick={() => handleCopyCode(cls.code, cls.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${copiedId === cls.id ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                            {copiedId === cls.id ? <CheckCircle size={12}/> : <Copy size={12}/>} {cls.code}
                                        </button>
                                        <button onClick={(e) => requestDeleteClass(e, cls.id)} className="text-slate-300 hover:text-red-500 transition bg-white p-2 rounded-lg shadow-sm border border-slate-100 active:scale-90"><Trash2 size={16}/></button>
                                     </div>
                                  </div>
                                  <div className="relative z-10">
                                      <h4 className="text-2xl font-black text-slate-800 mb-1">{cls.name}</h4>
                                      <p className="text-sm font-semibold text-slate-500 mb-4">{cls.subject} • {cls.school}</p>
                                      
                                      <div className="flex items-center gap-2 mb-6">
                                          <Users size={16} className="text-slate-400"/>
                                          <span className="text-slate-600 font-bold text-sm">{cls.students?.length || 0} Siswa</span>
                                      </div>

                                      <button onClick={() => { setSelectedClass(cls); setClassModalTab('students'); }} className="w-full bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-white transition-all duration-300 border border-slate-200 active:scale-95">
                                         Lihat Siswa
                                      </button>
                                  </div>
                               </div>
                            ))}
                         </div>
                     )}
                   </div>
                 )}

                 {teacherTab === 'quizzes' && (
                    <div className="space-y-8">
                       {!isCreatingQuiz ? (
                           <>
                            <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-600 text-white p-8 rounded-[32px] shadow-2xl shadow-indigo-500/30 relative overflow-hidden gap-6">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-10"></div>
                                <div className="relative z-10 w-full md:w-auto">
                                    <h3 className="font-black text-3xl mb-2">Bank Soal & Kuis</h3>
                                    <p className="text-indigo-200 font-medium">Buat kuis interaktif untuk siswa Anda.</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 relative z-10 w-full md:w-auto">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl flex items-center p-2 pl-4 border border-white/20 w-full md:w-auto">
                                        <Search size={20} className="text-white/70 mr-2"/>
                                        <input 
                                            type="text" 
                                            placeholder="Cari kuis..." 
                                            className="bg-transparent outline-none text-white placeholder:text-white/50 w-full md:w-60 font-medium"
                                            value={quizSearch}
                                            onChange={(e) => setQuizSearch(e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => setIsCreatingQuiz(true)} className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 flex items-center justify-center gap-2 shadow-lg transition hover:scale-105 active:scale-95 w-full md:w-auto">
                                        <PlusCircle size={24}/> Buat Kuis Baru
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-6">
                                {createdQuizzes
                                    .filter(q => q.title.toLowerCase().includes(quizSearch.toLowerCase()))
                                    .sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
                                    .map((quiz, index) => (
                                   <div key={quiz.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-300 transition-all hover:shadow-lg group">
                                      <div className="flex items-center gap-6">
                                         <div className="w-20 h-20 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center font-black text-3xl group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300 border border-slate-100">
                                            {index + 1}
                                         </div>
                                         <div>
                                            <h4 className="font-bold text-slate-800 text-xl mb-2">{quiz.title}</h4>
                                            <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><Key size={14}/> Kode: <span className="text-blue-600">{quiz.code}</span></span>
                                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"><List size={14}/> {quiz.questions?.length || 0} Soal</span>
                                                <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg border border-green-100"><Award size={14}/> {quiz.questions?.reduce((acc, q) => acc + (parseInt(q.points) || 0), 0)} Poin</span>
                                                {quiz.allowedClassNames && (
                                                    <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100"><Target size={14}/> {quiz.allowedClassNames.join(", ")}</span>
                                                )}
                                            </div>
                                         </div>
                                      </div>
                                      <div className="flex gap-3 w-full md:w-auto">
                                         <button 
                                            onClick={() => handleCopyCode(quiz.code, quiz.id)} 
                                            className={`flex-1 md:flex-none px-4 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 ${copiedId === quiz.id ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                            title="Salin Kode"
                                         >
                                            {copiedId === quiz.id ? <CheckCircle size={18}/> : <Copy size={18}/>}
                                         </button>
                                         <button 
                                            onClick={() => handleEditQuiz(quiz)} 
                                            className="flex-1 md:flex-none px-4 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                                            title="Edit Kuis"
                                         >
                                            <Edit3 size={18}/>
                                         </button>
                                         <button 
                                            onClick={(e) => requestDeleteQuiz(e, quiz.id)} 
                                            className="flex-1 md:flex-none px-4 py-3 rounded-xl font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100 active:scale-95"
                                            title="Hapus Kuis"
                                         >
                                            <Trash2 size={18}/>
                                         </button>
                                      </div>
                                   </div>
                                ))}
                            </div>
                           </>
                       ) : (
                           <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                               <div className="bg-slate-50 p-8 border-b border-slate-200 flex justify-between items-center">
                                   <div>
                                       <h4 className="font-black text-slate-800 text-2xl">{editingQuizId ? 'Edit Kuis' : 'Buat Kuis Baru'}</h4>
                                       <p className="text-slate-500 text-sm font-bold mt-1">Buat pertanyaan dan tentukan target kelas.</p>
                                       <div className="mt-2 text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg inline-block text-sm">
                                           Total Poin Saat Ini: {questions.reduce((acc, q) => acc + (parseInt(q.points) || 0), 0)} / 100
                                       </div>
                                   </div>
                                   <button onClick={() => { setIsCreatingQuiz(false); setEditingQuizId(null); setQuestions([]); setQuizTitle(''); setSelectedClassIds([]); }} className="bg-white p-3 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-200 active:scale-90"><X size={24}/></button>
                               </div>
                               <div className="p-10 space-y-10">
                                   <div>
                                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Judul Kuis</label>
                                      <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="w-full text-4xl font-black border-b-2 border-slate-200 focus:border-blue-600 outline-none py-2 bg-transparent placeholder:text-slate-300 transition-colors" placeholder="Masukkan Judul Kuis..."/>
                                   </div>
                                   
                                   <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 relative overflow-hidden">
                                      <div className="absolute right-0 top-0 p-6 opacity-5"><Target size={100}/></div>
                                      <h5 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg"><Target size={24}/> Target Kelas</h5>
                                      <div className="flex flex-wrap gap-3 relative z-10">
                                          {classes.length > 0 ? classes.map(cls => (
                                              <button 
                                                 key={cls.id} 
                                                 onClick={() => toggleClassSelection(cls.id)}
                                                 className={`px-5 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-105 active:scale-95 ${selectedClassIds.includes(cls.id) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
                                              >
                                                 {selectedClassIds.includes(cls.id) && <CheckCircle size={16} className="inline mr-2"/>}
                                                 {cls.name}
                                              </button>
                                          )) : <span className="text-slate-400 italic">Belum ada kelas.</span>}
                                      </div>
                                   </div>

                                   <div className="grid md:grid-cols-2 gap-10">
                                      <div className="space-y-6">
                                         <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-900/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg font-bold text-xs uppercase"><PlusCircle size={14}/> Input Soal</div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Poin:</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="100" 
                                                        value={currentQ.points} 
                                                        onChange={e => setCurrentQ({...currentQ, points: e.target.value})} 
                                                        className="w-16 p-2 rounded-lg border border-slate-200 text-center font-bold text-sm outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <textarea value={currentQ.question} onChange={e => setCurrentQ({...currentQ, question: e.target.value})} 
                                               className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:bg-blue-50/30 outline-none mb-6 text-lg font-semibold min-h-[120px]" placeholder="Tulis pertanyaan di sini..." rows={3}/>
                                            
                                            <div className="space-y-3 mb-6">
                                               {currentQ.options.map((opt, idx) => (
                                                  <div key={idx} className="flex items-center gap-3 group">
                                                     <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">{String.fromCharCode(65+idx)}</span>
                                                     <input value={opt} onChange={e => {
                                                        const newOpts = [...currentQ.options]; newOpts[idx] = e.target.value;
                                                        setCurrentQ({...currentQ, options: newOpts});
                                                     }} className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-medium focus:border-blue-500 outline-none transition-all" placeholder={`Pilihan ${String.fromCharCode(65+idx)}`}/>
                                                  </div>
                                               ))}
                                            </div>
                                            
                                            <div className="mb-6">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Kunci Jawaban</label>
                                                <select value={currentQ.answer} onChange={e => setCurrentQ({...currentQ, answer: e.target.value})} 
                                                   className="w-full p-4 rounded-xl border-2 border-slate-100 text-sm font-bold bg-white focus:border-green-500 outline-none">
                                                   <option value="">Pilih Jawaban Benar</option>
                                                   {currentQ.options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            
                                            <button onClick={addQuestionToLocalList} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all hover:shadow-lg active:scale-95">Simpan Soal ke Daftar</button>
                                         </div>
                                      </div>
                                      
                                      <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-200 h-fit">
                                          <h5 className="font-bold text-slate-700 mb-6 flex justify-between items-center text-xl">
                                             <span>Preview</span>
                                             <span className="bg-white text-slate-800 px-4 py-2 rounded-full text-xs shadow-sm border border-slate-100">{questions.length} Soal Tersimpan</span>
                                          </h5>
                                          {questions.length === 0 ? (
                                              <div className="text-center py-20 text-slate-400 italic flex flex-col items-center gap-4">
                                                  <div className="bg-slate-200 p-4 rounded-full"><List size={32}/></div>
                                                  Belum ada soal ditambahkan.
                                              </div>
                                          ) : (
                                              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                  {questions.map((q, i) => (
                                                      <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
                                                          <div className="absolute top-4 right-4 text-slate-300 font-black text-4xl opacity-20">{i+1}</div>
                                                          <div className="font-bold text-slate-800 text-lg mb-2 pr-8">{q.question}</div>
                                                          <div className="flex gap-2">
                                                              <div className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg inline-block border border-green-100">Jawaban: {q.answer}</div>
                                                              <div className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg inline-block border border-blue-100">{q.points} Poin</div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                   </div>

                                   <div className="pt-8 border-t border-slate-200 flex justify-end gap-4">
                                        <button onClick={() => { setIsCreatingQuiz(false); setEditingQuizId(null); setQuestions([]); setQuizTitle(''); setSelectedClassIds([]); }} className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition active:scale-95">Batal</button>
                                        <button onClick={confirmSaveQuiz} disabled={loading} className="px-10 py-4 rounded-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:shadow-green-500/30 transition-all transform hover:-translate-y-1 flex items-center gap-3 active:scale-95">
                                           {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} {editingQuizId ? 'Update Kuis' : 'Terbitkan Kuis'}
                                        </button>
                                   </div>
                               </div>
                           </div>
                       )}
                    </div>
                 )}
                 
                 {teacherTab === 'results' && (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="font-bold text-slate-700">Daftar Nilai Siswa</h3>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                 <Filter size={16} className="text-slate-400"/>
                                 <select 
                                    value={resultClassFilter} 
                                    onChange={(e) => setResultClassFilter(e.target.value)}
                                    className="bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl px-3 py-2 outline-none focus:border-blue-500 w-full md:w-auto"
                                 >
                                     <option value="All">Semua Kelas</option>
                                     {sortClassesByName(classes).map(cls => (
                                         <option key={cls.id} value={cls.name}>{cls.name}</option>
                                     ))}
                                 </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                              <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                      <th className="p-6">Siswa</th>
                                      <th className="p-6">Kelas</th>
                                      <th className="p-6">Kuis</th>
                                      <th className="p-6 text-right">Nilai</th>
                                      <th className="p-6 text-right">Waktu</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {quizResults
                                      .filter(res => resultClassFilter === 'All' || res.studentClass === resultClassFilter)
                                      .map(res => (
                                      <tr key={res.id} className="hover:bg-blue-50/30 transition-colors">
                                          <td className="p-6 font-bold text-slate-800 flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">{res.studentName.charAt(0)}</div>
                                              {res.studentName}
                                          </td>
                                          <td className="p-6 text-slate-500 text-sm font-semibold">{res.studentClass}</td>
                                          <td className="p-6 text-slate-600 font-medium">{res.quizTitle}</td>
                                          <td className="p-6 text-right">
                                              <span className={`px-4 py-2 rounded-xl text-xs font-black ${res.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                  {res.score}
                                              </span>
                                          </td>
                                          <td className="p-6 text-right text-slate-400 text-xs font-bold">
                                              {res.timestamp ? (res.timestamp.seconds ? new Date(res.timestamp.seconds * 1000).toLocaleDateString() : 'Baru saja') : '-'}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                        {quizResults.length === 0 && <div className="p-20 text-center text-slate-400 font-medium italic">Belum ada data nilai masuk.</div>}
                    </div>
                 )}
               </div>
           </main>

           {selectedClass && (
               <Modal title={selectedClass.name} onClose={() => setSelectedClass(null)} icon={School}>
                   <div className="space-y-6">
                       <div className="flex gap-4 border-b border-slate-200 pb-1">
                           <button onClick={() => setClassModalTab('students')} className={`px-4 py-2 font-bold text-sm transition-colors ${classModalTab==='students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Daftar Absen</button>
                           <button onClick={() => setClassModalTab('grades')} className={`px-4 py-2 font-bold text-sm transition-colors ${classModalTab==='grades' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Riwayat Kuis & Nilai</button>
                       </div>

                       {classModalTab === 'students' && (
                           <div className="bg-slate-50 rounded-[24px] border border-slate-200 max-h-[400px] overflow-y-auto divide-y divide-slate-200 custom-scrollbar p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                               {selectedClass.students && selectedClass.students.length > 0 ? (
                                   [...selectedClass.students].sort((a,b) => (a.absen || 999) - (b.absen || 999)).map((s, i) => (
                                       <div key={i} className="p-4 flex justify-between items-center hover:bg-white rounded-xl transition-colors">
                                           <div className="font-bold text-slate-700 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                                                    {s.absen || '-'}
                                                </div>
                                                {s.name}
                                           </div>
                                           <div className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                                               {s.absen ? `Absen ${s.absen}` : 'Belum Absen'}
                                           </div>
                                       </div>
                                   ))
                               ) : (
                                   <div className="p-10 text-center text-slate-400 text-sm italic">Belum ada siswa di kelas ini.</div>
                               )}
                           </div>
                       )}

                       {classModalTab === 'grades' && (
                           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                               {/* Group results by quiz title */}
                               {Object.entries(selectedClassResults.reduce((acc, curr) => {
                                   if(!acc[curr.quizTitle]) acc[curr.quizTitle] = [];
                                   acc[curr.quizTitle].push(curr);
                                   return acc;
                               }, {})).map(([quizTitle, results]) => {
                                   const isAnyUnpublished = results.some(r => !r.isPublished);
                                   const quizId = results[0]?.quizId;
                                   
                                   return (
                                       <div key={quizTitle} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                           <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                                               <h4 className="font-bold text-slate-800">{quizTitle}</h4>
                                               {isAnyUnpublished ? (
                                                   <button 
                                                       onClick={() => handlePublishResults(quizId, selectedClass.name)}
                                                       className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 transition active:scale-95"
                                                   >
                                                       <Lock size={12}/> Publish Nilai
                                                   </button>
                                               ) : (
                                                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Terpublikasi</span>
                                               )}
                                           </div>
                                           <div className="space-y-2">
                                               {results.map(r => (
                                                   <div key={r.id} className="flex justify-between text-sm">
                                                       <span className="text-slate-600">{r.studentName}</span>
                                                       <span className={`font-bold ${r.score >= 75 ? 'text-green-600' : 'text-orange-500'}`}>{r.score}</span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   );
                               })}
                               {selectedClassResults.length === 0 && <div className="p-8 text-center text-slate-400 italic">Belum ada data kuis untuk kelas ini.</div>}
                           </div>
                       )}
                   </div>
               </Modal>
           )}
         </div>
       )}

       {/* 4. STUDENT DASHBOARD (NEW LAYOUT) */}
       {view === 'student-dash' && (
           <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
               {/* MOBILE OVERLAY */}
               {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}></div>}
               
                <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex-col relative overflow-hidden h-full transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    
                    {/* TITLE AREA */}
                    <div className="p-8 border-b border-slate-800 relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-900/50"><BookOpen size={24}/></div>
                            <span className="text-white font-extrabold text-xl tracking-tight leading-tight">Student<br/>Dashboard</span>
                        </div>
                        
                        {/* PROFIL SISWA */}
                        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
                            {appUser?.classroom && <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Siswa Kelas {appUser?.classroom}</div>}
                            <div className="text-white font-bold text-sm flex items-start gap-2 break-words">
                                <UserCircle size={16} className="mt-0.5 shrink-0"/> 
                                <span className="break-all">{appUser?.name}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-3 relative z-10 flex-1">
                        {[
                            {id: 'overview', icon: Home, label: 'Beranda'},
                            {id: 'classroom', icon: School, label: 'Ruang Kelas'}, 
                            {id: 'exam', icon: PlayCircle, label: 'Ruang Ujian'},
                            {id: 'history', icon: Clock, label: 'Riwayat'},
                            {id: 'settings', icon: Settings, label: 'Pengaturan'},
                        ].map(menu => (
                            <button key={menu.id} onClick={() => { setStudentTab(menu.id); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 font-bold text-sm active:scale-95 ${studentTab === menu.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105' : 'hover:bg-slate-800 hover:text-white'}`}>
                            <menu.icon size={20}/> {menu.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 relative z-10">
                        <button onClick={confirmLogout} className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-white hover:bg-red-500/20 p-4 rounded-2xl font-bold transition-all active:scale-95">
                            <LogOut size={20}/> Logout
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#F8FAFC]">
                    <header className="flex justify-between items-center mb-6 md:mb-10">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden p-2 bg-white rounded-xl shadow-sm active:scale-95 transition-transform" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight mb-1 md:mb-2">
                                    {studentTab === 'overview' && `Halo, ${appUser?.name}!`}
                                    {studentTab === 'classroom' && 'Ruang Kelas'}
                                    {studentTab === 'exam' && 'Ruang Ujian'}
                                    {studentTab === 'history' && 'Riwayat Belajar'}
                                    {studentTab === 'settings' && 'Pengaturan Akun'}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm md:text-lg hidden md:block">
                                    {studentTab === 'overview' && 'Siap untuk belajar hari ini?'}
                                    {studentTab === 'classroom' && 'Lihat dan gabung ke kelas barumu.'}
                                    {studentTab === 'exam' && 'Masukkan kode untuk mulai mengerjakan.'}
                                    {studentTab === 'history' && 'Lihat progress perkembangan nilaimu.'}
                                    {studentTab === 'settings' && 'Kelola preferensi akunmu.'}
                                </p>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-slate-700 border-2 border-slate-100 shadow-sm text-xl shrink-0">
                           {appUser?.name.charAt(0)}
                       </div>
                    </header>

                    <div key={studentTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {studentTab === 'overview' && (
                            <div className="space-y-8">
                                {/* STATS CARDS */}
                                {dataLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <SkeletonCard/><SkeletonCard/>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[32px] text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden transition-transform hover:scale-[1.01]">
                                            <div className="relative z-10">
                                                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm w-fit mb-6"><Award size={32}/></div>
                                                <div className="text-5xl font-black mb-2">
                                                    {publishedHistory.length > 0 
                                                        ? Math.round(publishedHistory.reduce((acc, curr) => acc + curr.score, 0) / publishedHistory.length) 
                                                        : 0}
                                                </div>
                                                <div className="text-indigo-100 font-bold text-lg">Rata-rata Nilai (Terpublikasi)</div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-shadow">
                                            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl w-fit mb-6"><CheckCircle size={32}/></div>
                                            <div className="text-5xl font-black text-slate-800 mb-2">{studentHistory.length}</div>
                                            <div className="text-slate-500 font-bold text-lg">Ujian Diselesaikan</div>
                                        </div>
                                    </div>
                                )}

                                {/* LATEST ACTIVITY */}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><Clock size={24} className="text-orange-500"/> Aktivitas Terbaru (5)</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {studentHistory.length > 0 ? (
                                            studentHistory.slice(0, 5).map(hist => ( // LIMIT 5
                                                <div key={hist.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center justify-between group">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${hist.isPublished ? (hist.score >= 75 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600') : 'bg-slate-100 text-slate-400'} group-hover:scale-110 transition-transform`}>
                                                            {hist.isPublished ? hist.score : <Clock size={20}/>}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-lg mb-1">{hist.quizTitle}</h4>
                                                            <div className="text-slate-500 text-xs font-bold flex gap-2 items-center">
                                                                <span>{hist.timestamp ? (hist.timestamp.seconds ? new Date(hist.timestamp.seconds * 1000).toLocaleDateString() : 'Baru saja') : '-'}</span>
                                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Kode: {hist.quizCode}</span>
                                                                {!hist.isPublished && <span className="text-orange-500 flex items-center gap-1"><Lock size={10}/> Menunggu Nilai</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center flex flex-col items-center text-slate-400 bg-white rounded-[32px] border border-slate-100 border-dashed">
                                                <p className="font-medium">Belum ada aktivitas.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NEW: RUANG KELAS SISWA */}
                        {studentTab === 'classroom' && (
                            <div className="space-y-8">
                                {/* Form Gabung Kelas */}
                                <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={24} className="text-blue-600"/> Gabung Kelas Baru</h3>
                                    <form onSubmit={handleStudentJoinClass} className="flex flex-col md:flex-row gap-4">
                                        <input 
                                            value={joinClassCode} 
                                            onChange={e => setJoinClassCode(e.target.value.toUpperCase())}
                                            placeholder="Masukkan Kode Kelas dari Guru..." 
                                            className="flex-1 p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal w-full"
                                        />
                                        <button type="submit" disabled={!joinClassCode || loading} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition disabled:opacity-50 w-full md:w-auto active:scale-95">
                                            {loading ? <Loader2 className="animate-spin"/> : "Gabung Kelas"}
                                        </button>
                                    </form>
                                    {errorMsg && <div className="mt-4 text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{errorMsg}</div>}
                                </div>

                                {/* Daftar Kelas yang Diikuti */}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-6">Kelas Saya</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {joinedClasses.length > 0 ? (
                                            joinedClasses.map(cls => (
                                                <div key={cls.id} onClick={() => handleOpenClass(cls)} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95 duration-200">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><School size={24}/></div>
                                                        <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold">{cls.code}</div>
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-800 mb-1">{cls.name}</h4>
                                                    <div className="space-y-1 mb-4">
                                                        <p className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Building2 size={14}/> {cls.school}</p>
                                                        <p className="text-sm font-semibold text-slate-500 flex items-center gap-2"><Book size={14}/> {cls.subject}</p>
                                                    </div>
                                                    <div className="pt-4 border-t border-slate-50 text-xs font-bold text-slate-400 flex items-center gap-2">
                                                        <UserCircle size={14}/> Guru: {cls.teacherName}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-[32px] border border-slate-100 border-dashed">
                                                <School size={48} className="mx-auto mb-4 opacity-20"/>
                                                <p className="font-medium">Belum bergabung dengan kelas manapun.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ATTENDANCE MODAL FOR STUDENT */}
                        {attendanceModalClass && (
                            <Modal title="Isi Absen Kelas" onClose={() => setAttendanceModalClass(null)} icon={Hash}>
                                <div className="space-y-6 text-center">
                                    <p className="text-slate-500">Pilih nomor urut absen Anda di kelas <strong>{attendanceModalClass.name}</strong>.</p>
                                    
                                    <div className="grid grid-cols-5 md:grid-cols-10 gap-3 max-h-[300px] overflow-y-auto p-2">
                                        {[...Array(50)].map((_, i) => {
                                            const num = i + 1;
                                            // Check if taken (simplified check, real app needs robust check)
                                            const isTaken = attendanceModalClass.students?.some(s => s.absen === num);
                                            return (
                                                <button 
                                                    key={num} 
                                                    disabled={isTaken}
                                                    onClick={() => setSelectedAbsen(num.toString())}
                                                    className={`p-3 rounded-xl font-bold text-sm transition-all active:scale-90 ${
                                                        selectedAbsen === num.toString() 
                                                        ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                                                        : isTaken 
                                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                            : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400'
                                                    }`}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <button 
                                            onClick={handleUpdateAttendance} 
                                            disabled={!selectedAbsen}
                                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            Simpan Absen & Masuk
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        )}

                        {studentTab === 'exam' && (
                            <div className="max-w-2xl">
                                <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl shadow-blue-900/10 border border-white text-center relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                                    <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                                    <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mb-6 group-hover:rotate-12 transition-transform"><Key size={32}/></div>
                                    <h2 className="text-3xl font-black text-slate-800 mb-3">Gabung Ujian</h2>
                                    <p className="text-slate-500 font-medium mb-8">Masukkan kode unik dari gurumu untuk mulai.</p>
                                    
                                    <form onSubmit={handleJoinQuiz} className="relative">
                                        <input type="text" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} 
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-center text-4xl font-black tracking-[0.2em] text-slate-800 uppercase focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-slate-300 shadow-inner" 
                                            placeholder="CODE"/>
                                        
                                        {errorMsg && <div className="mt-4 text-red-500 font-bold text-sm bg-red-50 py-3 px-4 rounded-xl inline-block border border-red-100 animate-pulse">{errorMsg}</div>}
                                        
                                        <button type="submit" disabled={!roomCode || loading} className="w-full mt-8 bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none shadow-lg shadow-slate-900/20 active:scale-95">
                                            {loading ? <Loader2 className="animate-spin mx-auto"/> : "Masuk Ruang Ujian"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {studentTab === 'history' && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3"><Clock size={24} className="text-blue-500"/> Riwayat Lengkap (12 Terakhir)</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {studentHistory.length > 0 ? (
                                        studentHistory.slice(0, 12).map(hist => ( // LIMIT 12
                                            <div key={hist.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${hist.isPublished ? (hist.score >= 75 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600') : 'bg-slate-100 text-slate-400'} group-hover:scale-110 transition-transform`}>
                                                        {hist.isPublished ? hist.score : <Clock size={24}/>}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-lg mb-1">{hist.quizTitle}</h4>
                                                        <div className="text-slate-500 text-xs font-bold flex gap-2 items-center">
                                                            <Clock size={12}/>
                                                            <span>{hist.timestamp ? (hist.timestamp.seconds ? new Date(hist.timestamp.seconds * 1000).toLocaleDateString() : 'Baru saja') : '-'}</span>
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Kode: {hist.quizCode}</span>
                                                            {!hist.isPublished && <span className="text-orange-500 flex items-center gap-1"><Lock size={10}/> Menunggu Nilai</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="hidden sm:block opacity-50 group-hover:opacity-100 transition-opacity">
                                                    {hist.isPublished && (hist.score >= 90 ? <span className="text-4xl">🏆</span> : hist.score >= 75 ? <span className="text-4xl">🌟</span> : <span className="text-4xl">💪</span>)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-16 text-center flex flex-col items-center text-slate-400 bg-white rounded-[32px] border border-slate-100 border-dashed">
                                            <div className="bg-slate-50 p-6 rounded-full mb-4"><List size={40} className="opacity-50"/></div>
                                            <p className="font-medium">Belum ada riwayat pengerjaan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {studentTab === 'settings' && (
                            <div className="max-w-3xl">
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-slate-100">
                                        <h3 className="font-bold text-xl mb-4">Profil Saya</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-400">{appUser?.name.charAt(0)}</div>
                                            <div>
                                                <div className="font-bold text-lg text-slate-800">{appUser?.name}</div>
                                                <div className="text-slate-500 font-medium">Siswa</div>
                                                <div className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block font-bold">Akun Aktif</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-slate-50/50">
                                        <h3 className="font-bold text-xl mb-4">Preferensi</h3>
                                        <div className="space-y-4 opacity-50 pointer-events-none">
                                            <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200">
                                                <span className="font-medium">Notifikasi Email</span>
                                                <div className="w-10 h-6 bg-slate-300 rounded-full"></div>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200">
                                                <span className="font-medium">Mode Gelap</span>
                                                <div className="w-10 h-6 bg-slate-300 rounded-full"></div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-4 text-center">Fitur pengaturan segera hadir.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
           </div>
       )}

       {/* 5. QUIZ VIEW (ACTIVE) */}
       {view === 'quiz' && activeQuiz && (
           <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
              {/* QUIZ CLASS SELECTION SCREEN */}
              {!quizClassSelection ? (
                 <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 animate-in fade-in duration-500">
                     <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 text-center animate-in zoom-in-95">
                         <h2 className="text-3xl font-black text-slate-800 mb-2">Pilih Kelas Anda</h2>
                         <p className="text-slate-500 mb-8">Pilih salah satu kelas target untuk memulai ujian.</p>
                         
                         <div className="grid grid-cols-2 gap-4 mb-8">
                             {activeQuiz.validClassesForStudent && activeQuiz.validClassesForStudent.length > 0 ? (
                                 activeQuiz.validClassesForStudent.map((clsName, i) => (
                                     <button 
                                        key={i} 
                                        onClick={() => setQuizClassSelection(clsName)}
                                        className="p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold transition-all active:scale-95"
                                     >
                                         {clsName}
                                     </button>
                                 ))
                             ) : (
                                 <div className="col-span-2 text-slate-400 italic">
                                     {activeQuiz.allowedClassNames && activeQuiz.allowedClassNames.length > 0 
                                        ? "Anda tidak terdaftar di kelas target kuis ini." 
                                        : "Kuis ini terbuka untuk umum."}
                                 </div>
                             )}
                         </div>

                         {(!activeQuiz.allowedClassNames || activeQuiz.allowedClassNames.length === 0) && (
                             <button 
                                onClick={() => setQuizClassSelection('Umum')}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95"
                             >
                                 Lanjutkan (Umum)
                             </button>
                         )}

                         <button onClick={() => setView('student-dash')} className="text-slate-400 hover:text-slate-600 font-bold mt-4 block mx-auto active:scale-95 transition-transform">Batal</button>
                     </div>
                 </div>
              ) : !quizFinished ? (
               // QUIZ QUESTION SCREEN
               <>
                   <div className="h-3 bg-slate-200 w-full fixed top-0 left-0 z-50">
                       <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${((currentQuestionIdx + 1) / (activeQuiz.questions?.length || 1)) * 100}%`}}></div>
                   </div>

                   <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col justify-center mt-8">
                       <div className="mb-10 flex flex-col items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
                           <span className="text-blue-600 font-black tracking-widest text-xs uppercase bg-blue-100 px-4 py-2 rounded-full mb-6 inline-block shadow-sm">Pertanyaan {currentQuestionIdx + 1} / {activeQuiz.questions?.length || 0}</span>
                           <h2 className="text-2xl md:text-5xl font-black text-slate-900 leading-[1.2]">{activeQuiz.questions?.[currentQuestionIdx]?.question}</h2>
                       </div>

                       <div className="grid gap-5 mb-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100">
                           {activeQuiz.questions?.[currentQuestionIdx]?.options.map((opt, idx) => (
                               <button key={idx} onClick={() => setSelectedAnswer(opt)} 
                                   className={`w-full text-left p-6 rounded-2xl border-2 font-bold text-xl flex gap-6 items-center transition-all duration-200 group relative overflow-hidden active:scale-[0.98] ${selectedAnswer === opt ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xl shadow-blue-900/10 ring-2 ring-blue-400 transform scale-[1.02]' : 'border-slate-200 text-slate-600 hover:bg-white hover:border-blue-300 hover:shadow-md'}`}>
                                   <span className={`w-12 h-12 flex shrink-0 items-center justify-center rounded-xl text-lg font-black transition-colors shadow-sm ${selectedAnswer === opt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                       {String.fromCharCode(65 + idx)}
                                   </span>
                                   <span className="relative z-10">{opt}</span>
                               </button>
                           ))}
                       </div>

                       <div className="flex justify-end animate-in fade-in slide-in-from-bottom-16 duration-700 delay-200">
                           <button onClick={confirmFinishQuiz} disabled={!selectedAnswer} 
                               className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-black shadow-2xl shadow-slate-900/30 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-3 active:scale-95">
                               {currentQuestionIdx + 1 === (activeQuiz.questions?.length || 0) ? "Selesai & Kumpulkan" : "Selanjutnya"} <ArrowRight size={24}/>
                           </button>
                       </div>
                   </div>
               </>
           ) : (
               // QUIZ FINISHED SCREEN (HIDDEN SCORE)
               <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
                   <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl shadow-blue-900/20 overflow-hidden text-center p-12 relative border border-white">
                       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                       <div className="inline-flex p-8 bg-green-50 text-green-600 rounded-full mb-8 animate-bounce shadow-inner">
                           <CheckSquare size={80}/>
                       </div>
                       <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Selesai!</h2>
                       <p className="text-slate-500 font-medium mb-10 text-lg">
                           Kamu telah menyelesaikan <br/><span className="text-slate-800 font-bold">{activeQuiz.title}</span>
                       </p>
                       
                       <div className="bg-slate-50 rounded-[32px] p-8 mb-10 border border-slate-100 relative overflow-hidden">
                           <div className="text-slate-600 font-bold text-lg">Jawaban Sudah Tersimpan Menunggu Nilai Akhir</div>
                       </div>

                       <button onClick={() => setView('student-dash')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all hover:-translate-y-1 shadow-xl shadow-slate-900/20 active:scale-95">
                           Kembali ke Dashboard
                       </button>
                   </div>
               </div>
           )}
           </div>
       )}
    </div>
  );
}

export default function EduQuestWrapper() {
  return (
    <ErrorBoundary>
      <EduQuestApp />
    </ErrorBoundary>
  );
}
