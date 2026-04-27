import React, { useState, useEffect } from 'react';
import { 
  Award, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  PlusCircle, 
  LayoutDashboard,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

interface Personality {
  name: string;
  category: 'Teacher' | 'Leader' | 'Social Worker';
  image: string;
  votes: number;
  short_bio: string;
  full_bio: string;
  born: string;
  impact: string;
  current_status: string;
  state: string;
}

export default function AdminApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<Personality>({
    name: '',
    category: 'Teacher',
    image: '',
    short_bio: '',
    full_bio: '',
    born: '',
    impact: '',
    current_status: '',
    state: '',
    votes: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first!");
      return;
    }

    try {
      const newDocRef = doc(collection(db, 'personalities'));
      await setDoc(newDocRef, {
        ...formData,
        createdAt: serverTimestamp(),
        addedBy: user.uid
      });
      
      setSuccess(true);
      setFormData({
        name: '',
        category: 'Teacher',
        image: '',
        short_bio: '',
        full_bio: '',
        born: '',
        impact: '',
        current_status: '',
        state: '',
        votes: 0
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, 'create', 'personalities');
    }
  };

  const isAdmin = user?.email === 'asimbyans@gmail.com';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-navy border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] selection:bg-gold/30 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#002147] flex items-center justify-center rounded shadow-md">
              <span className="text-white font-serif text-2xl font-bold">B</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none uppercase">
                Admin <span className="text-[#C5A021]">Portal</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">BHARAT ICONS MANAGEMENT</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="/" 
              target="_blank"
              className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-navy transition-colors px-4 py-2 border border-gray-200 rounded"
            >
              <ExternalLink size={14} />
              View Main Site
            </a>
            {user ? (
              <div className="flex items-center gap-3 bg-gray-50 pl-4 pr-2 py-1.5 rounded-full border border-gray-100">
                <span className="text-xs font-bold text-gray-500 truncate max-w-[120px]">{user.displayName}</span>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-[#002147] text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 flex items-center gap-2"
              >
                <LogIn size={16} /> Admin Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4">
        {!isAdmin ? (
          <div className="text-center py-20 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Award size={40} />
            </div>
            <h2 className="text-2xl font-serif mb-4">Access Restricted</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              {user 
                ? "Your account does not have administrative privileges." 
                : "Please sign in with an official Google account to manage iconic personality data."}
            </p>
            {!user && (
              <button 
                onClick={handleLogin}
                className="bg-[#002147] text-white px-10 py-4 rounded font-bold uppercase tracking-widest text-sm hover:shadow-xl transition-all"
              >
                Sign In to Continue
              </button>
            )}
            {user && (
              <button 
                onClick={handleLogout}
                className="text-red-500 font-bold uppercase tracking-widest text-xs hover:underline"
              >
                Sign Out
              </button>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <header className="flex justify-between items-end border-b border-gray-200 pb-8">
              <div>
                <h2 className="text-4xl font-serif mb-2">Create New <span className="text-[#C5A021]">Profile</span></h2>
                <p className="text-gray-500 text-sm">Add precise facts and biographies for the ranking dashboard.</p>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <LayoutDashboard size={20} className="text-[#C5A021]" />
              </div>
            </header>

            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-8 sm:p-12 shadow-2xl rounded-2xl space-y-8 relative overflow-hidden">
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    exit={{ y: -100 }}
                    className="absolute inset-x-0 top-0 bg-green-500 text-white p-4 flex items-center justify-center gap-3 z-50 shadow-lg"
                  >
                    <CheckCircle2 size={24} />
                    <span className="font-bold uppercase tracking-widest text-sm">Icon Added Successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Iconic Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Dr. B.R. Ambedkar"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all cursor-pointer"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Leader">Leader</option>
                    <option value="Social Worker">Social Worker</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">State / Region</label>
                  <input 
                    required
                    type="text" 
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image Source URL</label>
                <input 
                  required
                  type="url" 
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Birthplace / Location</label>
                  <input 
                    required
                    type="text" 
                    value={formData.born}
                    onChange={(e) => setFormData({...formData, born: e.target.value})}
                    placeholder="City, State"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Professional Status</label>
                  <input 
                    required
                    type="text" 
                    value={formData.current_status}
                    onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                    placeholder="e.g. Active Educator"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Short Introduction (TOC)</label>
                <input 
                  required
                  maxLength={100}
                  type="text" 
                  value={formData.short_bio}
                  onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                  placeholder="Summarize their greatness in one sentence..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Biography & Legacy</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.full_bio}
                  onChange={(e) => setFormData({...formData, full_bio: e.target.value})}
                  placeholder="Detailed historical account..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Primary Impact (Highlight Quote)</label>
                <textarea 
                  required
                  rows={2}
                  value={formData.impact}
                  onChange={(e) => setFormData({...formData, impact: e.target.value})}
                  placeholder="What is their most significant contribution?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm focus:outline-none focus:border-gold transition-all resize-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#002147] text-white py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-sm hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <PlusCircle size={20} className="text-[#C5A021]" />
                Publish to Bharat Icons Database
              </button>
            </form>
          </motion.div>
        )}
      </main>

      <footer className="py-12 border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">System Status: Secure & Operational</p>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Bharat Icons Administration Portal</p>
          <div className="flex items-center gap-4 mt-6">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none">© 2024-2026</p>
            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none">All Data Encrypted via AES-256</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
