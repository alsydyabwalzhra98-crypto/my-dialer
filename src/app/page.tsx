'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneCall, PhoneOff, PhoneForwarded,
  PhoneIncoming, Wallet, UserPlus, Star, StarOff,
  Send, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, CreditCard, BarChart3, User,
  ArrowLeftRight, MessageCircle, Plus,
  Mic, MicOff, Volume2, VolumeX,
  Grid3X3, Clock, BookOpen, Heart,
  CircleDot, Settings, LogOut, X,
  Mail, Lock, Eye, EyeOff, Hash,
  DollarSign, PhoneMissed, Check,
  MessageSquare, Bell, Globe,
  AlertCircle, Info, Copy, Search, Download
} from 'lucide-react';

// ─────────── Types ───────────
interface Contact {
  id: string;
  name: string;
  number: string;
  favorite: boolean;
}

interface CallLog {
  id: string;
  to: string;
  type: string;
  cost: number;
  duration: number;
  recordingUrl?: string;
  date: number | string;
}

interface ChatMsg {
  id?: string;
  number: string;
  name?: string;
  text: string;
  type: string;
  timestamp?: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: string;
}

// ─────────── Helper Functions ───────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatDate(ts: number | string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'الآن';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`;
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// ─────────── Keypad Data ───────────
const keypadKeys = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

// ─────────── Main Component ───────────
export default function Home() {
  // Auth state
  const [authScreen, setAuthScreen] = useState<'start' | 'welcome' | 'login' | 'register'>('start');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);

  // User data
  const [balance, setBalance] = useState(0);
  const [assignedUSNumber, setAssignedUSNumber] = useState('');

  // Navigation
  const [activePage, setActivePage] = useState('page-dialer');

  // Dialer
  const [dialNumber, setDialNumber] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hideNumber, setHideNumber] = useState(false);
  const [aliasName, setAliasName] = useState('');

  // Call screen
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [callStatus, setCallStatus] = useState('جاري الاتصال...');
  const [callTimerSeconds, setCallTimerSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showDtmf, setShowDtmf] = useState(false);
  const [callNumber, setCallNumber] = useState('');
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sub-pages
  const [subPage, setSubPage] = useState<string | null>(null);

  // Data - initialized empty, loaded from DB
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [notifications, setNotifications] = useState<ChatMsg[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Chat
  const [currentChatNumber, setCurrentChatNumber] = useState('');
  const [currentChatName, setCurrentChatName] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Messages tabs
  const [msgTab, setMsgTab] = useState<'notifications' | 'sms'>('notifications');

  // Auth forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Top-up
  const [selectedPrice, setSelectedPrice] = useState(0.99);

  // Rates
  const [rateQueryNumber, setRateQueryNumber] = useState('');
  const [rateResult, setRateResult] = useState<string | null>(null);

  // Transfer
  const [transferToUid, setTransferToUid] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Add contact
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');

  // New message
  const [newMsgTo, setNewMsgTo] = useState('');
  const [newMsgBody, setNewMsgBody] = useState('');

  // Logs tabs
  const [logTab, setLogTab] = useState<'all' | 'recordings'>('all');

  // Contacts tabs
  const [contactTab, setContactTab] = useState<'all' | 'favorites'>('all');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // PWA Install
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  // ─────────── Toast ───────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 3000);
  }, []);

  // ─────────── Load Data from API ───────────
  const loadData = useCallback(async (uid: string) => {
    try {
      const res = await fetch('/api/setup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (data.ok) {
        setBalance(data.user?.balance ?? 1.0);
        setAssignedUSNumber(data.user?.assignedUSNumber || '');
        setContacts(data.contacts || []);
        setLogs(data.logs || []);
        setMessages(data.messages || []);
        setNotifications((data.messages || []).filter((m: ChatMsg) => m.number === 'system'));
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, []);

  // ─────────── Auto-login from localStorage ───────────
  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    const saved = localStorage.getItem('abuzahra_session');
    if (!saved) return;
    let session: { uid: string; email: string } | null = null;
    try {
      session = JSON.parse(saved);
      if (!session?.uid || !session?.email) session = null;
    } catch {
      localStorage.removeItem('abuzahra_session');
    }
    if (!session) return;
    // Use microtask to avoid synchronous setState in effect
    queueMicrotask(() => {
      setCurrentUser({ uid: session!.uid, email: session!.email });
      setIsLoggedIn(true);
      loadData(session!.uid);
    });
  }, [loadData]);

  // ─────────── Auth Functions ───────────
  const handleLogin = useCallback(async () => {
    if (!loginEmail || !loginPassword) {
      showToast('يرجى ملء جميع الحقول');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        const user = data.user;
        setCurrentUser({ uid: user.uid, email: user.email });
        setBalance(user.balance ?? 1.0);
        setAssignedUSNumber(user.assignedUSNumber || '');
        setIsLoggedIn(true);
        localStorage.setItem('abuzahra_session', JSON.stringify({ uid: user.uid, email: user.email }));
        await loadData(user.uid);
        showToast('تم تسجيل الدخول بنجاح');
      } else {
        showToast(data.error || 'فشل تسجيل الدخول');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
    setAuthLoading(false);
  }, [loginEmail, loginPassword, loadData, showToast]);

  const handleRegister = useCallback(async () => {
    if (!registerEmail || !registerPassword || !registerConfirm) {
      showToast('يرجى ملء جميع الحقول');
      return;
    }
    if (registerPassword !== registerConfirm) {
      showToast('كلمة المرور غير متطابقة');
      return;
    }
    if (registerPassword.length < 6) {
      showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        const user = data.user;
        setCurrentUser({ uid: user.uid, email: user.email });
        setBalance(user.balance ?? 1.0);
        setAssignedUSNumber(user.assignedUSNumber || '');
        setIsLoggedIn(true);
        localStorage.setItem('abuzahra_session', JSON.stringify({ uid: user.uid, email: user.email }));
        await loadData(user.uid);
        showToast('تم إنشاء الحساب بنجاح');
      } else {
        showToast(data.error || 'فشل إنشاء الحساب');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
    setAuthLoading(false);
  }, [registerEmail, registerPassword, registerConfirm, loadData, showToast]);

  const handleGoogleAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const email = `google_${Date.now()}@quick.com`;
      const password = 'google123';
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        const user = data.user;
        setCurrentUser({ uid: user.uid, email: user.email });
        setBalance(user.balance ?? 1.0);
        setAssignedUSNumber(user.assignedUSNumber || '');
        setIsLoggedIn(true);
        localStorage.setItem('abuzahra_session', JSON.stringify({ uid: user.uid, email: user.email }));
        await loadData(user.uid);
        showToast('تم تسجيل الدخول عبر Google');
      } else {
        // If already registered (e.g. duplicate email is impossible with unique timestamp, but handle gracefully)
        showToast(data.error || 'فشل تسجيل الدخول');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
    setAuthLoading(false);
  }, [loadData, showToast]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setBalance(0);
    setAssignedUSNumber('');
    setContacts([]);
    setLogs([]);
    setMessages([]);
    setNotifications([]);
    setTransactions([]);
    setAuthScreen('start');
    setActivePage('page-dialer');
    setSubPage(null);
    localStorage.removeItem('abuzahra_session');
    showToast('تم تسجيل الخروج');
  }, [showToast]);

  // ─────────── Dialer Functions ───────────
  const dial = useCallback((key: string) => {
    setDialNumber(prev => {
      if (prev.length >= 20) return prev;
      return prev + key;
    });
  }, []);

  const dialLongPress = useCallback((key: string) => {
    if (key === '0') {
      setDialNumber(prev => prev + '+');
    }
  }, []);

  const deleteDigit = useCallback(() => {
    setDialNumber(prev => prev.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    setDialNumber('');
    setAliasName('');
  }, []);

  // ─────────── Call Functions ───────────
  const initiateCall = useCallback(() => {
    if (!dialNumber && !callNumber) return;
    const numberToCall = dialNumber || callNumber;
    if (!numberToCall) return;

    setCallNumber(numberToCall);
    setShowCallScreen(true);
    setCallStatus('جاري الاتصال...');
    setCallTimerSeconds(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setShowDtmf(false);

    // Simulate connection
    setTimeout(() => {
      setCallStatus('متصل');
      setCallTimerSeconds(0);
    }, 2500);
  }, [dialNumber, callNumber]);

  const hangupCall = useCallback(async () => {
    setShowCallScreen(false);
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Add log via API
    if (callNumber && currentUser) {
      const duration = callTimerSeconds;
      const cost = duration > 0 ? Math.round((duration / 60) * 0.05 * 100) / 100 : 0;
      try {
        await fetch('/api/add-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userUid: currentUser.uid, to: callNumber, type: 'outgoing', cost, duration }),
        });
        // Reload data to get updated balance and logs
        await loadData(currentUser.uid);
      } catch {
        showToast('خطأ في حفظ سجل المكالمة');
      }
    }
    setCallNumber('');
    setCallTimerSeconds(0);
    showToast('تم إنهاء المكالمة');
  }, [callNumber, callTimerSeconds, currentUser, loadData, showToast]);

  // Call timer
  useEffect(() => {
    if (showCallScreen && callStatus === 'متصل') {
      callTimerRef.current = setInterval(() => {
        setCallTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [showCallScreen, callStatus]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);

  const sendDtmf = useCallback((digit: string) => {
    showToast(`إرسال DTMF: ${digit}`);
  }, [showToast]);

  // ─────────── Contact Functions ───────────
  const saveNewContact = useCallback(async () => {
    if (!newContactName || !newContactNumber) {
      showToast('يرجى ملء اسم ورقم جهة الاتصال');
      return;
    }
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول أولاً');
      return;
    }
    try {
      const res = await fetch('/api/save-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUid: currentUser.uid, name: newContactName, number: newContactNumber }),
      });
      const data = await res.json();
      if (data.ok) {
        setContacts(prev => [data.contact, ...prev]);
        setNewContactName('');
        setNewContactNumber('');
        setSubPage(null);
        showToast('تم حفظ جهة الاتصال بنجاح');
      } else {
        showToast(data.error || 'فشل حفظ جهة الاتصال');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
  }, [newContactName, newContactNumber, currentUser, showToast]);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setContacts(prev =>
          prev.map(c => (c.id === id ? { ...c, favorite: data.contact.favorite } : c))
        );
      }
    } catch {
      showToast('خطأ في تحديث المفضلة');
    }
  }, [showToast]);

  const callContact = useCallback((number: string) => {
    setDialNumber(number);
    setCallNumber(number);
    initiateCall();
  }, [initiateCall]);

  const openAddContact = useCallback((number?: string) => {
    if (number) setNewContactNumber(number);
    setNewContactName('');
    setSubPage('add-contact');
  }, []);

  // ─────────── Chat Functions ───────────
  const openChat = useCallback(async (number: string, name?: string) => {
    setCurrentChatNumber(number);
    setCurrentChatName(name || number);

    // Load chat from DB
    if (currentUser) {
      try {
        const res = await fetch(`/api/get-chat?uid=${encodeURIComponent(currentUser.uid)}&number=${encodeURIComponent(number)}`);
        const data = await res.json();
        if (data.ok) {
          setChatMessages(data.messages || []);
        } else {
          setChatMessages([]);
        }
      } catch {
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }
    setSubPage('chat');
  }, [currentUser]);

  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    if (!currentUser) return;

    const text = chatInput;
    setChatInput('');

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUid: currentUser.uid, number: currentChatNumber, name: currentChatName, text, type: 'sent' }),
      });
      const data = await res.json();
      if (data.ok) {
        const msg: ChatMsg = {
          id: data.message.id,
          number: currentChatNumber,
          name: currentChatName,
          text,
          type: 'sent',
          timestamp: data.message.timestamp || Date.now(),
        };
        setChatMessages(prev => [...prev, msg]);
        setMessages(prev => [...prev, msg]);
      } else {
        showToast('فشل إرسال الرسالة');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
  }, [chatInput, currentUser, currentChatNumber, currentChatName, showToast]);

  const sendNewMessage = useCallback(async () => {
    if (!newMsgTo || !newMsgBody) {
      showToast('يرجى ملء جميع الحقول');
      return;
    }
    if (!currentUser) return;
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUid: currentUser.uid, number: newMsgTo, text: newMsgBody, type: 'sent' }),
      });
      const data = await res.json();
      if (data.ok) {
        const msg: ChatMsg = {
          id: data.message.id,
          number: newMsgTo,
          text: newMsgBody,
          type: 'sent',
          timestamp: data.message.timestamp || Date.now(),
        };
        setMessages(prev => [msg, ...prev]);
        setNewMsgTo('');
        setNewMsgBody('');
        setSubPage(null);
        showToast('تم إرسال الرسالة');
      } else {
        showToast(data.error || 'فشل إرسال الرسالة');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
  }, [newMsgTo, newMsgBody, currentUser, showToast]);

  // ─────────── Top-up Function ───────────
  const processPayment = useCallback(async (amount: number) => {
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول أولاً');
      return;
    }
    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUid: currentUser.uid, amount }),
      });
      const data = await res.json();
      if (data.ok) {
        setBalance(data.newBalance);
        setSelectedPrice(amount);
        showToast(`تم إضافة ${formatCurrency(amount)} إلى رصيدك`);
        // Reload to get updated transactions
        await loadData(currentUser.uid);
      } else {
        showToast(data.error || 'فشل الشحن');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
  }, [currentUser, loadData, showToast]);

  // ─────────── Rate Query ───────────
  const queryRate = useCallback(() => {
    if (!rateQueryNumber) {
      showToast('يرجى إدخال رقم الهاتف');
      return;
    }
    const rates: Record<string, string> = {
      '+970': '$0.05/دقيقة',
      '+961': '$0.08/دقيقة',
      '+962': '$0.07/دقيقة',
      '+966': '$0.06/دقيقة',
      '+971': '$0.04/دقيقة',
      '+1': '$0.02/دقيقة',
      '+44': '$0.03/دقيقة',
    };
    const prefix = Object.keys(rates).find(k => rateQueryNumber.startsWith(k));
    setRateResult(prefix ? rates[prefix] : '$0.10/دقيقة (سعر عالمي)');
  }, [rateQueryNumber, showToast]);

  // ─────────── Transfer ───────────
  const processTransfer = useCallback(async () => {
    const amount = parseFloat(transferAmount);
    if (!transferToUid || !amount || amount <= 0) {
      showToast('يرجى ملء جميع الحقول بشكل صحيح');
      return;
    }
    if (amount > balance) {
      showToast('رصيدك غير كافي');
      return;
    }
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول أولاً');
      return;
    }
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUid: currentUser.uid, toUid: transferToUid, amount }),
      });
      const data = await res.json();
      if (data.ok) {
        setBalance(data.newBalance);
        setTransferToUid('');
        setTransferAmount('');
        showToast(`تم تحويل ${formatCurrency(amount)} بنجاح`);
        // Reload to get updated transactions
        await loadData(currentUser.uid);
      } else {
        showToast(data.error || 'فشل التحويل');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم');
    }
  }, [transferToUid, transferAmount, balance, currentUser, loadData, showToast]);

  // ─────────── Refresh Data ───────────
  const refreshLogs = useCallback(() => {
    if (currentUser) {
      loadData(currentUser.uid);
    }
    showToast('تم تحديث السجلات');
  }, [currentUser, loadData, showToast]);

  const syncContacts = useCallback(() => {
    if (currentUser) {
      loadData(currentUser.uid);
    }
    showToast('تم مزامنة جهات الاتصال');
  }, [currentUser, loadData, showToast]);

  // ─────────── Long Press Handlers ───────────
  const handleLongPressStart = useCallback((key: string) => {
    if (key === '0') {
      deleteTimerRef.current = setTimeout(() => {
        dialLongPress(key);
      }, 800);
    }
  }, [dialLongPress]);

  const handleLongPressEnd = useCallback(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  }, []);

  const handleDeleteStart = useCallback(() => {
    deleteTimerRef.current = setTimeout(() => {
      clearAll();
    }, 800);
  }, [clearAll]);

  // ─────────── PWA Install Prompt ───────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      showToast('تم تثبيت التطبيق بنجاح!');
    }
    deferredPromptRef.current = null;
    setShowInstallBanner(false);
  }, [showToast]);

  // ─────────── Render: Toast ───────────
  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm animate-slide-up whitespace-nowrap">
        {toastMessage}
      </div>
    );
  };

  // ─────────── Render: Auth Start ───────────
  const renderAuthStart = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#0078D7] to-[#005A9E]">
      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
        <Phone className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">أبو الزهراء</h1>
      <p className="text-blue-100 text-sm mb-10">الاتصال الآمن بأسعار منافسة</p>
      <button
        onClick={() => setAuthScreen('login')}
        className="w-full bg-white text-[#0078D7] font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-50 transition-colors text-lg"
      >
        دخول / تسجيل
      </button>
      {showInstallBanner && (
        <button
          onClick={installApp}
          className="w-full mt-4 bg-white/20 backdrop-blur-sm text-white font-bold py-3 rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center gap-2 border border-white/30"
        >
          <Download className="w-5 h-5" />
          <span>تثبيت التطبيق على جهازك</span>
        </button>
      )}
      <p className="text-blue-200 text-xs mt-6">الإصدار 1.0.0 • PWA</p>
    </div>
  );

  // ─────────── Render: Login ───────────
  const renderLogin = () => (
    <div className="flex-1 flex flex-col p-6 animate-slide-in-right">
      <button onClick={() => setAuthScreen('start')} className="self-start mb-6 text-gray-500 flex items-center gap-1">
        <ChevronRight className="w-5 h-5" />
        <span>الرجوع</span>
      </button>

      <div className="w-16 h-16 bg-[#0078D7] rounded-2xl flex items-center justify-center mb-4 shadow-md">
        <Phone className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">تسجيل الدخول</h2>
      <p className="text-gray-500 text-sm mb-8">أدخل بياناتك للمتابعة</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-10 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100 transition-all"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={authLoading}
          className="w-full bg-[#0078D7] text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#005A9E] transition-colors disabled:opacity-50"
        >
          {authLoading ? 'جاري الدخول...' : 'دخول'}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs">أو</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Globe className="w-5 h-5" />
          <span>تسجيل عبر Google</span>
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        ليس لديك حساب؟{' '}
        <button onClick={() => setAuthScreen('register')} className="text-[#0078D7] font-bold">
          سجل الآن
        </button>
      </p>
    </div>
  );

  // ─────────── Render: Register ───────────
  const renderRegister = () => (
    <div className="flex-1 flex flex-col p-6 animate-slide-in-right">
      <button onClick={() => setAuthScreen('login')} className="self-start mb-6 text-gray-500 flex items-center gap-1">
        <ChevronRight className="w-5 h-5" />
        <span>الرجوع</span>
      </button>

      <div className="w-16 h-16 bg-[#107C10] rounded-2xl flex items-center justify-center mb-4 shadow-md">
        <UserPlus className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">إنشاء حساب</h2>
      <p className="text-gray-500 text-sm mb-8">أنشئ حسابك الجديد</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={registerEmail}
              onChange={e => setRegisterEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={registerPassword}
              onChange={e => setRegisterPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              dir="ltr"
              className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-10 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">تأكيد كلمة المرور</label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={registerConfirm}
              onChange={e => setRegisterConfirm(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              dir="ltr"
              className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100 transition-all"
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            />
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={authLoading}
          className="w-full bg-[#107C10] text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#0d5e0d] transition-colors disabled:opacity-50 mt-2"
        >
          {authLoading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
        </button>
      </div>
    </div>
  );

  // ─────────── Render: Header ───────────
  const renderHeader = () => (
    <div className="bg-[#0078D7] text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
        <h1 className="font-bold text-lg">أبو الزهراء</h1>
      </div>
      <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
        <Wallet className="w-4 h-4 text-yellow-300" />
        <span className="text-sm font-semibold">{formatCurrency(balance)}</span>
      </div>
    </div>
  );

  // ─────────── Render: Bottom Nav ───────────
  const renderBottomNav = () => {
    const tabs = [
      { id: 'page-dialer', label: 'الشبكة', icon: Grid3X3 },
      { id: 'page-logs', label: 'السجل', icon: Clock },
      { id: 'page-contacts', label: 'الأسماء', icon: BookOpen },
      { id: 'page-messages', label: 'الرسائل', icon: MessageCircle },
      { id: 'page-more', label: 'المزيد', icon: Settings },
    ];

    return (
      <div className="flex items-center bg-white border-t border-gray-200 flex-shrink-0 safe-area-bottom">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActivePage(tab.id); setSubPage(null); }}
              className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${
                isActive ? 'text-[#0078D7]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-normal'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // ─────────── Render: Dialer Page ───────────
  const renderDialerPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Number display */}
      <div className="bg-white p-4 shadow-sm">
        <div className="min-h-[48px] flex items-center justify-center">
          <input
            type="text"
            value={dialNumber}
            onChange={e => setDialNumber(e.target.value.replace(/[^0-9+*#]/g, ''))}
            placeholder="أدخل رقم الهاتف"
            dir="ltr"
            className="text-center text-2xl font-bold text-gray-800 w-full focus:outline-none bg-transparent placeholder-gray-300"
            readOnly
          />
        </div>
        {/* Alias input (shown when hideNumber is on) */}
        {hideNumber && (
          <div className="mt-2">
            <input
              type="text"
              value={aliasName}
              onChange={e => setAliasName(e.target.value)}
              placeholder="اسم المستعار (اختياري)"
              className="text-center text-sm text-gray-600 w-full focus:outline-none bg-gray-50 rounded-lg py-2 px-3"
            />
          </div>
        )}
        {/* Toggles */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setIsRecording(!isRecording)}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${isRecording ? 'bg-[#0078D7]' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isRecording ? 'left-0.5' : 'left-[22px]'}`} />
            </div>
            <span className="text-xs text-gray-600">تسجيل</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setHideNumber(!hideNumber)}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${hideNumber ? 'bg-[#0078D7]' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${hideNumber ? 'left-0.5' : 'left-[22px]'}`} />
            </div>
            <span className="text-xs text-gray-600">إخفاء الرقم</span>
          </label>
        </div>
      </div>

      {/* Keypad */}
      <div className="flex-1 grid grid-cols-3 gap-1 p-3 max-w-[320px] mx-auto w-full">
        {keypadKeys.map(key => (
          <button
            key={key.digit}
            onClick={() => dial(key.digit)}
            onMouseDown={() => handleLongPressStart(key.digit)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(key.digit)}
            onTouchEnd={handleLongPressEnd}
            className="flex flex-col items-center justify-center py-3 rounded-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors relative"
          >
            <span className="text-2xl font-semibold text-gray-800">{key.digit}</span>
            {key.letters && (
              <span className="text-[9px] tracking-widest text-gray-400 mt-0.5">{key.letters}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="bg-white px-6 pb-4 pt-2 flex items-center justify-around">
        <button
          onClick={() => openAddContact(dialNumber || undefined)}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
        </button>
        <button
          onClick={initiateCall}
          disabled={!dialNumber}
          className="w-16 h-16 rounded-full bg-[#107C10] flex items-center justify-center text-white shadow-lg hover:bg-[#0d5e0d] transition-colors disabled:opacity-40 disabled:shadow-none relative"
        >
          {dialNumber && (
            <div className="absolute inset-0 rounded-full animate-pulse-ring bg-green-500/20" />
          )}
          <Phone className="w-7 h-7 rotate-[90deg]" />
        </button>
        <button
          onMouseDown={handleDeleteStart}
          onMouseUp={() => {
            if (deleteTimerRef.current) { clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }
            deleteDigit();
          }}
          onMouseLeave={() => {
            if (deleteTimerRef.current) { clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }
          }}
          onTouchStart={handleDeleteStart}
          onTouchEnd={() => {
            if (deleteTimerRef.current) { clearTimeout(deleteTimerRef.current); deleteTimerRef.current = null; }
            deleteDigit();
          }}
          className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // ─────────── Render: Call Logs Page ───────────
  const renderLogsPage = () => (
    <div className="flex-1 flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setLogTab('all')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            logTab === 'all' ? 'text-[#0078D7] border-b-2 border-[#0078D7]' : 'text-gray-400'
          }`}
        >
          جميع المكالمات
        </button>
        <button
          onClick={() => setLogTab('recordings')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            logTab === 'recordings' ? 'text-[#0078D7] border-b-2 border-[#0078D7]' : 'text-gray-400'
          }`}
        >
          التسجيلات
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        {logTab === 'all' ? (
          logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <Clock className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm">لا توجد مكالمات بعد</p>
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                onClick={() => { setDialNumber(log.to); setActivePage('page-dialer'); }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  log.type === 'outgoing' ? 'bg-blue-100 text-blue-600' :
                  log.type === 'incoming' ? 'bg-green-100 text-green-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {log.type === 'outgoing' ? <PhoneForwarded className="w-5 h-5 rotate-180" /> :
                   log.type === 'incoming' ? <PhoneIncoming className="w-5 h-5" /> :
                   <PhoneMissed className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate" dir="ltr">{log.to}</p>
                  <p className="text-xs text-gray-400">{formatDate(log.date)}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-xs font-semibold ${
                    log.cost > 0 ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {log.cost > 0 ? `-${formatCurrency(log.cost)}` : 'مجاني'}
                  </p>
                  {log.duration > 0 && (
                    <p className="text-[10px] text-gray-400">{formatTime(log.duration)}</p>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
            <Mic className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm">لا توجد تسجيلات صوتية</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={refreshLogs}
        className="absolute bottom-20 left-5 w-12 h-12 rounded-full bg-[#0078D7] text-white shadow-lg flex items-center justify-center hover:bg-[#005A9E] transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );

  // ─────────── Render: Contacts Page ───────────
  const renderContactsPage = () => {
    const filteredContacts = contacts.filter(c => {
      if (contactTab === 'favorites') return c.favorite;
      return true;
    }).filter(c =>
      !searchQuery ||
      c.name.includes(searchQuery) ||
      c.number.includes(searchQuery)
    );

    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setContactTab('all')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              contactTab === 'all' ? 'text-[#0078D7] border-b-2 border-[#0078D7]' : 'text-gray-400'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setContactTab('favorites')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              contactTab === 'favorites' ? 'text-[#0078D7] border-b-2 border-[#0078D7]' : 'text-gray-400'
            }`}
          >
            المفضلة
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full bg-gray-50 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <BookOpen className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm">لا توجد جهات اتصال</p>
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50"
              >
                <div className="w-11 h-11 rounded-full bg-[#0078D7] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {contact.name.charAt(0)}
                  </span>
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => { setDialNumber(contact.number); setActivePage('page-dialer'); }}
                >
                  <p className="text-sm font-semibold text-gray-800 truncate">{contact.name}</p>
                  <p className="text-xs text-gray-400 truncate" dir="ltr">{contact.number}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(contact.id)}
                  className="p-1.5"
                >
                  {contact.favorite ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <button
                  onClick={() => callContact(contact.number)}
                  className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* FAB */}
        <button
          onClick={syncContacts}
          className="absolute bottom-20 left-5 w-12 h-12 rounded-full bg-[#0078D7] text-white shadow-lg flex items-center justify-center hover:bg-[#005A9E] transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // ─────────── Render: Messages Page ───────────
  const renderMessagesPage = () => {
    const filteredMessages = msgTab === 'notifications' ? notifications : messages;

    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMsgTab('notifications')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              msgTab === 'notifications' ? 'text-[#0078D7] border-b-2 border-[#0078D7]' : 'text-gray-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            الإشعارات
          </button>
          <button
            onClick={() => setMsgTab('sms')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              msgTab === 'sms' ? 'text-[#0078D7] border-b-2 border-[#0078D7]' : 'text-gray-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            SMS
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm">لا توجد رسائل</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div
                key={msg.id || msg.timestamp}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                onClick={() => openChat(msg.number, msg.name)}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'sent' ? 'bg-[#0078D7]' : 'bg-gray-200'
                }`}>
                  {msg.type === 'sent' ? (
                    <Send className="w-5 h-5 text-white rotate-180" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">{msg.name || msg.number}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(msg.timestamp || Date.now())}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB - new message */}
        {msgTab === 'sms' && (
          <button
            onClick={() => { setNewMsgTo(''); setNewMsgBody(''); setSubPage('new-message'); }}
            className="absolute bottom-20 left-5 w-12 h-12 rounded-full bg-[#0078D7] text-white shadow-lg flex items-center justify-center hover:bg-[#005A9E] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  };

  // ─────────── Render: More Page ───────────
  const renderMorePage = () => {
    const cards = [
      { id: 'topup', label: 'إعادة الشحن', icon: CreditCard, color: 'bg-orange-500', textColor: 'text-orange-500' },
      { id: 'rates', label: 'التعرفة', icon: DollarSign, color: 'bg-purple-500', textColor: 'text-purple-500' },
      { id: 'reports', label: 'التقارير', icon: BarChart3, color: 'bg-gray-500', textColor: 'text-gray-500' },
      { id: 'account', label: 'حسابي', icon: User, color: 'bg-green-600', textColor: 'text-green-600' },
      { id: 'transfer', label: 'تحويل الرصيد', icon: ArrowLeftRight, color: 'bg-red-500', textColor: 'text-red-500' },
      { id: 'support', label: 'الدعم', icon: MessageCircle, color: 'bg-green-500', textColor: 'text-green-500' },
    ];

    return (
      <div className="flex-1 flex flex-col bg-gray-50 p-4">
        <div className="grid grid-cols-3 gap-3">
          {cards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setSubPage(card.id)}
                className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700">{card.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 bg-white shadow-sm hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  };

  // ─────────── Render: Sub Page Header ───────────
  const renderSubHeader = (title: string) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
      <button
        onClick={() => { setSubPage(null); setSearchQuery(''); }}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <h2 className="font-bold text-gray-800 text-base">{title}</h2>
    </div>
  );

  // ─────────── Render: Top-up Page ───────────
  const renderTopUpPage = () => {
    const prices = [0.99, 4.99, 9.99, 24.99, 49.99];

    return (
      <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
        {renderSubHeader('إعادة الشحن')}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">اختر مبلغ الشحن:</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {prices.map(price => (
              <button
                key={price}
                onClick={() => setSelectedPrice(price)}
                className={`py-4 rounded-2xl text-center transition-all ${
                  selectedPrice === price
                    ? 'bg-[#0078D7] text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-gray-700 shadow-sm hover:shadow-md'
                }`}
              >
                <p className="text-xl font-bold">{formatCurrency(price)}</p>
              </button>
            ))}
            <button
              onClick={() => setSelectedPrice(10)}
              className={`py-4 rounded-2xl text-center transition-all ${
                selectedPrice === 10
                  ? 'bg-[#FFC107] text-white shadow-lg scale-[1.02]'
                  : 'bg-[#FFC107]/10 text-yellow-700 shadow-sm hover:shadow-md border-2 border-[#FFC107]'
              }`}
            >
              <p className="text-xl font-bold">{formatCurrency(10)}</p>
              <p className="text-[10px] mt-0.5">🎁 بونص</p>
            </button>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-yellow-400 text-yellow-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-300 transition-colors">
              <CreditCard className="w-5 h-5" />
              الدفع عبر PayPal
            </button>
            <button
              onClick={() => processPayment(selectedPrice)}
              className="w-full bg-[#107C10] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0d5e0d] transition-colors"
            >
              <Check className="w-5 h-5" />
              شراء تجريبي (عرض)
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────── Render: Rates Page ───────────
  const renderRatesPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('التعرفة')}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-sm text-gray-600 mb-3">أدخل رقم الهاتف للاستعلام عن السعر:</p>
          <div className="relative mb-3">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={rateQueryNumber}
              onChange={e => setRateQueryNumber(e.target.value)}
              placeholder="+970599123456"
              dir="ltr"
              className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            onClick={queryRate}
            className="w-full bg-purple-500 text-white font-bold py-3 rounded-xl hover:bg-purple-600 transition-colors"
          >
            استعلام السعر
          </button>
        </div>

        {rateResult && (
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-semibold text-gray-700">نتيجة الاستعلام</p>
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-1">{rateResult}</p>
            <p className="text-xs text-gray-400" dir="ltr">الرقم: {rateQueryNumber}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">أسعار شائعة:</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">فلسطين (+970)</span><span className="font-semibold">$0.05/د</span></div>
            <div className="flex justify-between"><span className="text-gray-600">الأردن (+962)</span><span className="font-semibold">$0.07/د</span></div>
            <div className="flex justify-between"><span className="text-gray-600">مصر (+20)</span><span className="font-semibold">$0.06/د</span></div>
            <div className="flex justify-between"><span className="text-gray-600">أمريكا (+1)</span><span className="font-semibold">$0.02/د</span></div>
            <div className="flex justify-between"><span className="text-gray-600">بريطانيا (+44)</span><span className="font-semibold">$0.03/د</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────── Render: Reports Page ───────────
  const renderReportsPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('التقارير')}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BarChart3 className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm">لا توجد معاملات</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    log.type === 'outgoing' ? 'bg-blue-100 text-blue-600' :
                    log.type === 'incoming' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {log.type === 'outgoing' ? <PhoneForwarded className="w-5 h-5 rotate-180" /> :
                     log.type === 'incoming' ? <PhoneIncoming className="w-5 h-5" /> :
                     <PhoneMissed className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800" dir="ltr">{log.to}</p>
                    <p className="text-xs text-gray-400">{formatDate(log.date)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${log.cost > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {log.cost > 0 ? `-${formatCurrency(log.cost)}` : 'مجاني'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─────────── Render: Account Page ───────────
  const renderAccountPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('حسابي')}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#0078D7] flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">{currentUser?.email || 'مستخدم'}</p>
              <p className="text-xs text-gray-400 mt-0.5">عضو منذ اليوم</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">معرّف المستخدم (UID)</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-gray-700 flex-1 truncate" dir="ltr">{currentUser?.uid || '-'}</p>
                <button
                  onClick={() => { if (currentUser?.uid) { navigator.clipboard?.writeText(currentUser.uid); } showToast('تم النسخ'); }}
                  className="text-gray-400 hover:text-[#0078D7]"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">البريد الإلكتروني</p>
              <p className="text-sm text-gray-700" dir="ltr">{currentUser?.email || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">الرقم الأمريكي</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#0078D7]" dir="ltr">{assignedUSNumber || 'غير معين'}</p>
                <button
                  onClick={() => { if (assignedUSNumber) { navigator.clipboard?.writeText(assignedUSNumber); } showToast('تم نسخ الرقم'); }}
                  className="text-gray-400 hover:text-[#0078D7]"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3.5">
              <p className="text-xs text-gray-400 mb-1">الرصيد الحالي</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────── Render: Transfer Page ───────────
  const renderTransferPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('تحويل الرصيد')}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600">التحويل غير قابل للاسترجاع. تأكد من صحة المعرّف.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">معرّف المستلم (UID)</label>
              <input
                type="text"
                value={transferToUid}
                onChange={e => setTransferToUid(e.target.value)}
                placeholder="أدخل معرّف المستلم"
                dir="ltr"
                className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">المبلغ</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">رصيدك: {formatCurrency(balance)}</p>
            </div>
            <button
              onClick={processTransfer}
              className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 transition-colors"
            >
              تأكيد التحويل
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────── Render: Support Page ───────────
  const renderSupportPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('الدعم')}
      <div className="p-4 flex-1 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">تواصل معنا عبر واتساب</h3>
          <p className="text-sm text-gray-500 mb-6">نحن هنا لمساعدتك على مدار الساعة</p>
          <button
            onClick={() => showToast('سيتم توجيهك إلى واتساب')}
            className="w-full bg-green-500 text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            فتح واتساب
          </button>
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-2">أو راسلنا عبر:</p>
            <p className="text-sm text-gray-700 font-semibold" dir="ltr">support@abualzahra.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────── Render: Chat Page ───────────
  const renderChatPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => { setSubPage(null); setCurrentChatNumber(''); setCurrentChatName(''); }}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#0078D7] flex items-center justify-center">
          <span className="text-white font-bold">{currentChatName?.charAt(0) || '?'}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm">{currentChatName || 'محادثة'}</p>
          <p className="text-[10px] text-gray-400" dir="ltr">{currentChatNumber}</p>
        </div>
        <button
          onClick={() => callContact(currentChatNumber)}
          className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600"
        >
          <Phone className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-220px)]">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">لا توجد رسائل بعد</p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex ${msg.type === 'sent' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                msg.type === 'sent'
                  ? 'bg-[#0078D7] text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${
                  msg.type === 'sent' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="اكتب رسالة..."
          className="flex-1 bg-gray-50 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
        />
        <button
          onClick={sendChatMessage}
          disabled={!chatInput.trim()}
          className="w-10 h-10 rounded-full bg-[#0078D7] flex items-center justify-center text-white hover:bg-[#005A9E] transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );

  // ─────────── Render: Add Contact Page ───────────
  const renderAddContactPage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('إضافة جهة اتصال')}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">الاسم</label>
              <input
                type="text"
                value={newContactName}
                onChange={e => setNewContactName(e.target.value)}
                placeholder="أدخل الاسم"
                className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">رقم الهاتف</label>
              <input
                type="text"
                value={newContactNumber}
                onChange={e => setNewContactNumber(e.target.value)}
                placeholder="+970599123456"
                dir="ltr"
                className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={saveNewContact}
              className="w-full bg-[#0078D7] text-white font-bold py-3.5 rounded-xl hover:bg-[#005A9E] transition-colors"
            >
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────── Render: New Message Page ───────────
  const renderNewMessagePage = () => (
    <div className="flex-1 flex flex-col bg-gray-50 animate-slide-in-right">
      {renderSubHeader('رسالة جديدة')}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">إلى</label>
              <input
                type="text"
                value={newMsgTo}
                onChange={e => setNewMsgTo(e.target.value)}
                placeholder="+970599123456"
                dir="ltr"
                className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">الرسالة</label>
              <textarea
                value={newMsgBody}
                onChange={e => setNewMsgBody(e.target.value)}
                placeholder="اكتب رسالتك..."
                rows={4}
                className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#0078D7] focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
            <button
              onClick={sendNewMessage}
              className="w-full bg-[#0078D7] text-white font-bold py-3.5 rounded-xl hover:bg-[#005A9E] transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 rotate-180" />
              إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────── Render: Active Call Screen ───────────
  const renderCallScreen = () => (
    <div className="absolute inset-0 z-50 flex flex-col bg-gradient-to-b from-[#003366] via-[#004488] to-[#001a33] text-white animate-slide-up">
      {/* Status bar area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Avatar */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border-2 border-white/20">
            <span className="text-4xl font-bold text-white">{callNumber ? callNumber.slice(-2) : '??'}</span>
          </div>
          <div className="absolute inset-0 rounded-full animate-pulse-ring bg-white/10" />
        </div>

        {/* Caller info */}
        <h2 className="text-xl font-bold mb-1" dir="ltr">{callNumber}</h2>
        <p className={`text-sm mb-8 ${callStatus === 'متصل' ? 'text-green-300' : 'text-blue-200'}`}>
          {callStatus}
        </p>

        {/* Timer */}
        <p className="text-3xl font-mono font-bold mb-12 tracking-widest">
          {formatTime(callTimerSeconds)}
        </p>

        {/* DTMF keypad overlay */}
        {showDtmf && (
          <div className="grid grid-cols-3 gap-2 mb-8 animate-slide-up">
            {keypadKeys.map(key => (
              <button
                key={key.digit}
                onClick={() => sendDtmf(key.digit)}
                className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-white text-lg font-semibold hover:bg-white/25 active:bg-white/30 transition-colors backdrop-blur-sm"
              >
                {key.digit}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-8 pb-6">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-white text-[#003366]' : 'bg-white/15 text-white hover:bg-white/25'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button
          onClick={() => setShowDtmf(!showDtmf)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            showDtmf ? 'bg-white text-[#003366]' : 'bg-white/15 text-white hover:bg-white/25'
          }`}
        >
          <Hash className="w-6 h-6" />
        </button>
        <button
          onClick={toggleSpeaker}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isSpeakerOn ? 'bg-white text-[#003366]' : 'bg-white/15 text-white hover:bg-white/25'
          }`}
        >
          {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>

      {/* End call */}
      <div className="px-8 pb-10">
        <button
          onClick={hangupCall}
          className="w-full py-4 bg-[#A80000] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#8B0000] transition-colors shadow-lg"
        >
          <PhoneOff className="w-6 h-6" />
          إنهاء المكالمة
        </button>
      </div>
    </div>
  );

  // ─────────── Render Sub Pages ───────────
  const renderSubPage = () => {
    switch (subPage) {
      case 'topup': return renderTopUpPage();
      case 'rates': return renderRatesPage();
      case 'reports': return renderReportsPage();
      case 'account': return renderAccountPage();
      case 'transfer': return renderTransferPage();
      case 'support': return renderSupportPage();
      case 'chat': return renderChatPage();
      case 'add-contact': return renderAddContactPage();
      case 'new-message': return renderNewMessagePage();
      default: return null;
    }
  };

  // ─────────── Render Active Page ───────────
  const renderActivePage = () => {
    switch (activePage) {
      case 'page-dialer': return renderDialerPage();
      case 'page-logs': return renderLogsPage();
      case 'page-contacts': return renderContactsPage();
      case 'page-messages': return renderMessagesPage();
      case 'page-more': return renderMorePage();
      default: return renderDialerPage();
    }
  };

  // ─────────── Main Render ───────────
  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-300">
      <div className="w-full max-w-[400px] h-screen max-h-[850px] bg-white relative overflow-hidden flex flex-col shadow-2xl">
        {/* Auth Screens */}
        {!isLoggedIn ? (
          <>
            {authScreen === 'start' && renderAuthStart()}
            {authScreen === 'login' && renderLogin()}
            {authScreen === 'register' && renderRegister()}
          </>
        ) : (
          <>
            {/* Header */}
            {renderHeader()}

            {/* Content */}
            {subPage ? renderSubPage() : renderActivePage()}

            {/* Bottom Nav (only when not on sub-page) */}
            {!subPage && renderBottomNav()}
          </>
        )}

        {/* Call Screen Overlay */}
        {showCallScreen && renderCallScreen()}

        {/* Toast */}
        {renderToast()}
      </div>
    </div>
  );
}
