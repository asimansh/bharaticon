import React, { useState, useEffect } from 'react';
import { 
  Award, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  PlusCircle, 
  LayoutDashboard,
  ExternalLink,
  Trash2,
  Database,
  User as UserIcon,
  Search as SearchIcon,
  ChevronLeft
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
  serverTimestamp,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

interface Personality {
  id?: string;
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
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
      setIsAdmin(u?.email === 'asimbyans@gmail.com');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'list') {
      fetchPersonalities();
    }
  }, [isAdmin, activeTab]);

  const fetchPersonalities = async () => {
    try {
      const q = query(collection(db, 'personalities'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Personality));
      setPersonalities(data);
    } catch (error) {
      handleFirestoreError(error, 'list', 'personalities');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this icon? This action cannot be undone.")) return;
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, 'personalities', id));
      setPersonalities(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `personalities/${id}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm("Do you want to seed the initial data?")) return;
    
    const INITIAL_DATA = [
      {
        name: "Vikas Divyakirti",
        category: "Teacher",
        image: "https://images.unsplash.com/photo-1544717297-fa154da09f9b?auto=format&fit=crop&w=400&q=80",
        votes: 1250,
        short_bio: "Founder of Drishti IAS, renowned for his teaching style and insights.",
        full_bio: "Dr. Vikas Divyakirti is a former civil servant and a legendary teacher in India. He is known for making complex topics simple for UPSC aspirants. His deep understanding of humanities, philosophy, and history has made him an icon among students. He founded Drishti IAS in 1999 with a vision to provide quality guidance to aspirants from various backgrounds.",
        born: "Haryana, India",
        impact: "Guided thousands of students to clear the civil services exam.",
        current_status: "Active Educator and Speaker",
        state: "Haryana"
      },
      {
        name: "Ratan Tata",
        category: "Leader",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
        votes: 5000,
        short_bio: "Industrialist and Philanthropist, former chairman of Tata Group.",
        full_bio: "Ratan Tata is a visionary leader who transformed the Tata Group into a global powerhouse while maintaining high ethical standards. Under his leadership, Tata Motors acquired Jaguar Land Rover and Corus, among other major global acquisitions. He is equally famous for his humility and extensive philanthropic work through the Tata Trusts.",
        born: "Mumbai, India",
        impact: "Donated billions through Tata Trusts for social welfare and education.",
        current_status: "Philanthropist & Chairman Emeritus",
        state: "Maharashtra"
      },
      {
        name: "Medha Patkar",
        category: "Social Worker",
        image: "https://images.unsplash.com/photo-1489424155312-428b5783ee4a?auto=format&fit=crop&w=400&q=80",
        votes: 850,
        short_bio: "Famous social activist known for Narmada Bachao Andolan.",
        full_bio: "Medha Patkar has dedicated her life to social causes, specifically fighting for the rights of tribal people and farmers displaced by large dam projects. She is a core member of the Narmada Bachao Andolan and the National Alliance of People's Movements. Her persistence in non-violent protests has gained global recognition.",
        born: "Mumbai, India",
        impact: "Environmental protection and tribal rights advocacy across India.",
        current_status: "Activist",
        state: "Maharashtra"
      },
      {
        name: "Dr. A.P.J. Abdul Kalam",
        category: "Leader",
        image: "https://images.unsplash.com/photo-1549419133-722a3641ed85?auto=format&fit=crop&w=400&q=80",
        votes: 8500,
        short_bio: "The 'Missile Man of India' and former President reflecting wisdom and simplicity.",
        full_bio: "Avul Pakir Jainulabdeen Abdul Kalam was an Indian aerospace scientist and statesman who served as the 11th president of India. He spent four decades as a scientist and science administrator, mainly at the DRDO and ISRO. He was intimately involved in India's civilian space programme and military missile development efforts.",
        born: "Rameswaram, India",
        impact: "Inspiring millions of youth through science, education, and his vision for India 2020.",
        current_status: "Legacy Artist",
        state: "Tamil Nadu"
      },
      {
        name: "Anand Kumar",
        category: "Teacher",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        votes: 2100,
        short_bio: "Mathematician known for his Super 30 program.",
        full_bio: "Anand Kumar is a mathematician best known for his Super 30 program, which he started in Patna, Bihar. The program coaches economically backward sections of society for the IIT-JEE. By 2018, 422 out of 480 had made it to ITIs and Discovery Channel showcased his work in a documentary.",
        born: "Patna, India",
        impact: "Empowering underprivileged students to achieve world-class education.",
        current_status: "Active Educator",
        state: "Bihar"
      },
      {
        name: "Sonam Wangchuk",
        category: "Social Worker",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
        votes: 3200,
        short_bio: "Engineer and innovator known for SECMOL and Ice Stupas.",
        full_bio: "Sonam Wangchuk is an Indian engineer, innovator and education reformist from Ladakh. He is the founding-director of the SECMOL. He is also known for designing the SECMOL campus that runs entirely on solar energy. He invented the 'Ice Stupa' technique to address water shortages in high-altitude deserts.",
        born: "Ladakh, India",
        impact: "Revolutionizing education and water conservation in the Himalayan region.",
        current_status: "Innovator & Activist",
        state: "Ladakh"
      }
    ];

    try {
      for (const item of INITIAL_DATA) {
        const newDocRef = doc(collection(db, 'personalities'));
        await setDoc(newDocRef, {
          ...item,
          createdAt: serverTimestamp(),
          addedBy: user?.uid
        });
      }
      alert("Seeding complete!");
      fetchPersonalities();
    } catch (error) {
      handleFirestoreError(error, 'create', 'personalities');
    }
  };

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

    if (!formData.image) {
      alert("Please provide an image URL or upload a photo.");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, image: base64String }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-heritage-cream">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-2 border-navy border-t-gold rounded-full" 
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-heritage-cream p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md p-12 rounded-[3rem] shadow-2xl text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-navy text-white flex items-center justify-center rounded-3xl mx-auto mb-8 shadow-xl shadow-navy/20">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-serif text-navy mb-4">Portal Locked</h2>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed">This terminal is restricted to authorized heritage custodians. Please authenticate to continue.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-navy text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-navy/30 hover:bg-navy/90 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Authenticate via Google
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-heritage-cream p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-md p-12 rounded-[3rem] shadow-2xl text-center border-t-4 border-gold"
        >
          <div className="w-20 h-20 bg-gold/10 text-gold flex items-center justify-center rounded-3xl mx-auto mb-8">
            <Award size={32} />
          </div>
          <h2 className="text-3xl font-serif text-navy mb-4">Access Denied</h2>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">Your account ({user.email}) does not have administrative clearance for the heritage catalog.</p>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-10">Security Protocol Alpha-9</p>
          <button 
            onClick={handleLogout}
            className="w-full py-4 border border-gray-100 text-gray-400 hover:text-navy hover:bg-gray-50 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
          >
            End Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-heritage-cream text-navy selection:bg-gold/30 font-sans">
      {/* Premium Sidebar Background Element */}
      <div className="fixed top-0 left-0 w-64 h-full bg-navy hidden lg:block overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-40 h-40 border border-white rounded-full" />
          <div className="absolute bottom-40 -right-20 w-60 h-60 border-2 border-gold rounded-full" />
        </div>
        
        <div className="relative z-10 p-8 pt-12 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded shadow-lg shadow-black/20">
              <span className="text-navy font-serif text-2xl font-bold">B</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight leading-none">ADMIN</h1>
              <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mt-1 uppercase">Control Center</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <button 
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <PlusCircle size={18} /> Add Icon
            </button>
            <button 
              onClick={() => setActiveTab('list')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard size={18} /> Database
            </button>

            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={16} /> Exit to Site
              </button>
            </div>
          </div>

          <div className="mt-auto pb-8">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-4">Security Protocol</p>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-400 font-bold">Encrypted Node</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <nav className="h-24 px-8 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-[100] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif text-navy">
              {activeTab === 'create' ? 'Initialize New Profile' : 'Legacy Database'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="/" 
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gold transition-colors flex items-center gap-2"
            >
              <ExternalLink size={14} /> Live View
            </a>
            
            {user ? (
              <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-navy leading-none mb-1">{user.displayName}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Master Admin</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Force Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-navy text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-navy/90 hover:shadow-xl transition-all"
              >
                Access Portal
              </button>
            )}
          </div>
        </nav>

        {/* Dynamic Canvas */}
        <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
          {!isAdmin ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-20 text-center py-24 bg-white border border-gray-100 shadow-2xl rounded-[3rem] p-12"
            >
              <div className="w-24 h-24 bg-[#fdfaf6] border-2 border-gold/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Award size={48} className="text-gold opacity-30" />
              </div>
              <h2 className="text-3xl font-serif text-navy mb-4">Unauthorized Access</h2>
              <p className="text-gray-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                {user 
                  ? "Your credentials do not match the administrative clearance required for this terminal." 
                  : "You must authenticate with a verified administrator account to access the heritage database."}
              </p>
              {!user && (
                <button 
                  onClick={handleLogin}
                  className="bg-navy text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-navy/90 shadow-2xl shadow-navy/20 active:scale-95 transition-all"
                >
                  Initiate Secure Login
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'create' ? (
                <motion.div 
                  key="create"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-12"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-3">Module 01</p>
                      <h3 className="text-4xl font-serif text-navy">Metadata Infusion</h3>
                      <p className="text-gray-400 font-medium mt-2">Enter factual specifications for the iconic personality.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl shadow-gray-200 border border-gray-100 space-y-12 relative overflow-hidden">
                    {/* Success notification */}
                    <AnimatePresence>
                      {success && (
                        <motion.div 
                          initial={{ y: -100 }}
                          animate={{ y: 0 }}
                          exit={{ y: -100 }}
                          className="absolute inset-x-0 top-0 bg-gold text-white p-5 flex items-center justify-center gap-4 z-50 shadow-xl"
                        >
                          <CheckCircle2 size={24} />
                          <span className="font-bold uppercase tracking-[0.2em] text-xs">Identity Profile Synchronized</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Section 1: Identity */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                        <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold">01</span>
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Core Identity</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Full Legal Name</label>
                          <input 
                            required
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Dr. B.R. Ambedkar"
                            className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Primary Discipline</label>
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                            className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold transition-all cursor-pointer shadow-inner appearance-none"
                          >
                            <option value="Teacher">Teacher / Academic</option>
                            <option value="Leader">Political / Spiritual Leader</option>
                            <option value="Social Worker">Humanitarian / Reformer</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Visual & Location */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                        <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold">02</span>
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Visuals & Heritage</h4>
                      </div>

                      <div className="space-y-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Official Portrait (URL or Upload)</label>
                          <div className="flex gap-4">
                            <input 
                              required
                              type="url" 
                              value={formData.image.startsWith('data:') ? 'Image uploaded' : formData.image}
                              onChange={(e) => setFormData({...formData, image: e.target.value})}
                              placeholder="https://cloud-storage.com/portrait.png"
                              className="flex-1 bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner"
                              disabled={formData.image.startsWith('data:')}
                            />
                            <div className="relative">
                              <input 
                                type="file" 
                                id="admin-image-upload"
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                              />
                              <label 
                                htmlFor="admin-image-upload"
                                className="h-full px-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-center cursor-pointer hover:border-gold transition-colors text-[10px] font-bold uppercase tracking-widest text-gray-400 group"
                              >
                                {isUploading ? (
                                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span className="group-hover:text-gold transition-colors">Upload</span>
                                )}
                              </label>
                            </div>
                            {formData.image.startsWith('data:') && (
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, image: ''})}
                                className="px-4 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          {formData.image.startsWith('data:') && (
                            <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-gold/20 shadow-lg">
                              <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Ancestral Origin (Born)</label>
                            <input 
                              required
                              type="text" 
                              value={formData.born}
                              onChange={(e) => setFormData({...formData, born: e.target.value})}
                              placeholder="City, Province"
                              className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold transition-all shadow-inner"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">State Designation</label>
                            <input 
                              required
                              type="text" 
                              value={formData.state}
                              onChange={(e) => setFormData({...formData, state: e.target.value})}
                              placeholder="e.g. Maharashtra"
                              className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold transition-all shadow-inner"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Biography */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                        <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold">03</span>
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Legacy Documents</h4>
                      </div>

                      <div className="space-y-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Current Status / Title</label>
                          <input 
                            required
                            type="text" 
                            value={formData.current_status}
                            onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                            placeholder="e.g. Former President of India"
                            className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Executive Summary (Max 100 char)</label>
                          <input 
                            required
                            maxLength={100}
                            type="text" 
                            value={formData.short_bio}
                            onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                            placeholder="The architect of modern India's constitution..."
                            className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-gold transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Full Historical Account</label>
                          <textarea 
                            required
                            rows={8}
                            value={formData.full_bio}
                            onChange={(e) => setFormData({...formData, full_bio: e.target.value})}
                            placeholder="Enter detailed facts, education, and contributions..."
                            className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-8 text-sm focus:outline-none focus:border-gold transition-all resize-none shadow-inner leading-relaxed"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Primary Impact (Callout)</label>
                          <textarea 
                            required
                            rows={3}
                            value={formData.impact}
                            onChange={(e) => setFormData({...formData, impact: e.target.value})}
                            placeholder="Key achievement that defines their legacy..."
                            className="w-full bg-[#fdfaf6] border border-gray-100 rounded-2xl px-6 py-6 text-sm focus:outline-none focus:border-gold transition-all resize-none shadow-inner italic"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-6 bg-navy text-white rounded-[2rem] font-bold uppercase tracking-[0.3em] text-xs shadow-2xl shadow-navy/30 hover:bg-navy/90 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 relative group overflow-hidden mt-10"
                    >
                      <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <PlusCircle size={24} className="text-gold" />
                      Commence Data Publication
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-12"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-3">Module 02</p>
                      <h3 className="text-4xl font-serif text-navy">Legacy Database</h3>
                    </div>
                    {personalities.length === 0 && (
                      <button 
                        onClick={handleSeed}
                        className="bg-white border border-gray-200 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-gold transition-all flex items-center gap-2"
                      >
                        <Database size={14} className="text-gold" /> Seed Sample Data
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {personalities.length === 0 ? (
                      <div className="text-center py-40 bg-white rounded-[3rem] border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <LayoutDashboard size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-serif text-navy mb-2">Inventory Empty</h3>
                        <p className="text-gray-400">No iconic profiles have been initialized yet.</p>
                      </div>
                    ) : (
                      personalities.map((person) => (
                        <div key={person.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-shadow">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={person.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-lg font-serif text-navy">{person.name}</h4>
                              <span className="px-2 py-0.5 bg-gold/10 text-gold text-[8px] font-bold uppercase tracking-widest rounded-full">{person.category}</span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium line-clamp-1">{person.short_bio}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right mr-4">
                              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Votes</p>
                              <p className="text-lg font-serif text-navy">{person.votes}</p>
                            </div>
                            <button 
                              onClick={() => person.id && handleDelete(person.id)}
                              disabled={isDeleting === person.id}
                              className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              {isDeleting === person.id ? (
                                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={20} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* System Footer */}
        <footer className="h-24 px-8 border-t border-gray-100 bg-white flex items-center justify-between text-gray-400 font-bold uppercase tracking-[0.2em] text-[8px]">
          <div>© BHARAT ICONS HERITAGE PROGRAM 2024-2026</div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={10} className="text-green-500" />
              DATABASE CONNECTED
            </span>
            <span>SECURE TERMINAL : {user?.uid.slice(0, 8)}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
