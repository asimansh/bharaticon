import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ChevronUp, 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  Activity,
  X,
  Menu,
  TrendingUp,
  Filter,
  LogIn,
  LogOut,
  Mail,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Heart,
  ExternalLink,
  Plus,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  increment, 
  setDoc, 
  getDoc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import html2canvas from 'html2canvas';

// --- Types ---
interface UserStats {
  votesCount: number;
  badges: string[];
}

interface UserProfile {
  firstName: string;
  lastName: string;
  dob: string;
  mobile: string;
  email: string;
  photoURL: string;
}

interface Tribute {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  personalityId: string | number;
  message: string;
  createdAt: any;
}

interface Personality {
  id: string | number;
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

// --- Initial Data ---
// Personalities are now fetched from Firestore.

// --- Components ---

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${className}`}>
    {children}
  </span>
);

export default function App() {
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');
  const [selectedPerson, setSelectedPerson] = useState<Personality | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success'>('idle');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [showTributeModal, setShowTributeModal] = useState(false);
  const [tributeMessage, setTributeMessage] = useState('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // New Auth Form State
  const [authFormData, setAuthFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    mobile: '',
    password: ''
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterStatus('success');
      setTimeout(() => {
        setNewsletterStatus('idle');
        setNewsletterEmail('');
      }, 3000);
    }
  };
  const fetchUserProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users_profiles', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists
      const profileRef = doc(db, 'users_profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        const names = (user.displayName || '').split(' ');
        const profile: UserProfile = {
          firstName: names[0] || 'User',
          lastName: names.slice(1).join(' ') || '',
          dob: '',
          mobile: '',
          email: user.email || '',
          photoURL: user.photoURL || ''
        };
        await setDoc(profileRef, profile);
        setUserProfile(profile);
      } else {
        setUserProfile(profileSnap.data() as UserProfile);
      }
      
      setShowAuthModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authFormData.email, authFormData.password);
        const user = userCredential.user;
        
        await updateProfile(user, {
          displayName: `${authFormData.firstName} ${authFormData.lastName}`
        });

        const profile: UserProfile = {
          firstName: authFormData.firstName,
          lastName: authFormData.lastName,
          dob: authFormData.dob,
          mobile: authFormData.mobile,
          email: authFormData.email,
          photoURL: ''
        };

        await setDoc(doc(db, 'users_profiles', user.uid), profile);
        setUserProfile(profile);
      } else {
        await signInWithEmailAndPassword(auth, authFormData.email, authFormData.password);
      }
      setShowAuthModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // Fetch Personalities from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchUserProfile(u.uid);
      } else {
        setUserProfile(null);
      }
    });

    const fetchData = async () => {
      try {
        const q = query(collection(db, 'personalities'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Personality));
        setPersonalities(data);
      } catch (error: any) {
        // Only report as list if it truly failed listing OR if we don't know
        handleFirestoreError(error, 'list', 'personalities');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => unsubscribe();
  }, []);

  // Fetch User Stats
  useEffect(() => {
    if (!user) {
      setUserStats(null);
      return;
    }

    const fetchStats = async () => {
      try {
        const statsRef = doc(db, 'users_stats', user.uid);
        const statsDoc = await getDoc(statsRef);
        if (statsDoc.exists()) {
          setUserStats(statsDoc.data() as UserStats);
        } else {
          // Init stats
          const initialStats: UserStats = { votesCount: 0, badges: [] };
          await setDoc(statsRef, initialStats);
          setUserStats(initialStats);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, [user]);

  // Fetch Tributes
  useEffect(() => {
    if (!selectedPerson) {
      setTributes([]);
      return;
    }

    const fetchTributes = async () => {
      try {
        const q = query(
          collection(db, 'tributes'), 
          where('personalityId', '==', selectedPerson.id),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        setTributes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tribute)));
      } catch (err) {
        console.error("Error fetching tributes:", err);
      }
    };

    fetchTributes();
  }, [selectedPerson]);

  const categories = ['All', 'Teacher', 'Leader', 'Social Worker'];
  const states = useMemo(() => {
    const allStates = personalities.map(p => p.state).filter(Boolean);
    return ['All', ...Array.from(new Set(allStates)).sort()];
  }, [personalities]);

  const filteredAndSortedData = useMemo(() => {
    return personalities
      .filter(p => (selectedCategory === 'All' || p.category === selectedCategory))
      .filter(p => (selectedState === 'All' || p.state === selectedState))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'votes') return b.votes - a.votes;
        return a.name.localeCompare(b.name);
      });
  }, [personalities, selectedCategory, searchQuery, sortBy]);

  const handleShare = (person: Personality, platform: 'whatsapp' | 'twitter' | 'facebook') => {
    const text = `I just voted for ${person.name} on Bharat Icons! Check out their legacy and vote for your favorite hero: `;
    const url = window.location.href;
    
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + url)}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    
    window.open(shareUrl, '_blank');
  };

  const handleVote = async (id: string | number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const voteId = `${user.uid}_${id}`;
    const voteRef = doc(db, 'votes', voteId);
    const statsRef = doc(db, 'users_stats', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        if (voteDoc.exists()) {
          throw new Error("You have already voted for this icon!");
        }

        const personalityRef = doc(db, 'personalities', String(id));
        const statsDoc = await transaction.get(statsRef);
        let currentStats = statsDoc.data() as UserStats || { votesCount: 0, badges: [] };
        
        const newVotesCount = currentStats.votesCount + 1;
        let newBadges = [...currentStats.badges];
        
        if (newVotesCount === 5 && !newBadges.includes('Legacy Guardian')) {
          newBadges.push('Legacy Guardian');
        }
        if (newVotesCount === 10 && !newBadges.includes('Icon Historian')) {
          newBadges.push('Icon Historian');
        }

        transaction.set(voteRef, {
          userId: user.uid,
          personalityId: id,
          timestamp: serverTimestamp()
        });
        transaction.update(personalityRef, {
          votes: increment(1)
        });
        transaction.set(statsRef, {
          votesCount: newVotesCount,
          badges: newBadges
        }, { merge: true });

        // Update local stats state
        setUserStats({ votesCount: newVotesCount, badges: newBadges });
      });

      // Update local state for immediate feedback
      setPersonalities(prev => prev.map(p => 
        p.id === id ? { ...p, votes: p.votes + 1 } : p
      ));
      
      if (selectedPerson?.id === id) {
        setSelectedPerson(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
      }

      // Show tribute modal after successful vote
      setShowTributeModal(true);

    } catch (error: any) {
      if (error.message === "You have already voted for this icon!") {
        alert(error.message);
      }
      console.error("Voting error:", error);
    }
  };

  const submitTribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPerson || !tributeMessage.trim()) return;

    try {
      const tributeRef = doc(collection(db, 'tributes'));
      const newTribute: Omit<Tribute, 'id'> = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userImage: user.photoURL || '',
        personalityId: selectedPerson.id,
        message: tributeMessage,
        createdAt: serverTimestamp()
      };
      
      await setDoc(tributeRef, newTribute);
      setTributes(prev => [{ id: tributeRef.id, ...newTribute, createdAt: new Date() } as Tribute, ...prev]);
      setTributeMessage('');
      setShowTributeModal(false);
    } catch (error) {
      console.error("Tribute submission failed:", error);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await updateDoc(doc(db, 'users_profiles', user.uid), {
            photoURL: base64String
          });
          setUserProfile(prev => prev ? { ...prev, photoURL: base64String } : null);
        } catch (err) {
          console.error("Photo update failed:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateShareCard = async () => {
    if (!selectedPerson) return;
    setIsGeneratingCard(true);
    
    const cardEl = document.getElementById('share-card-template');
    if (!cardEl) {
      setIsGeneratingCard(false);
      return;
    }

    try {
      cardEl.style.display = 'flex';
      const canvas = await html2canvas(cardEl, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#002147'
      });
      cardEl.style.display = 'none';
      
      const link = document.createElement('a');
      link.download = `${selectedPerson.name}_LegacyCard.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Card generation failed:", error);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-navy border-t-gold rounded-full"
        />
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-off-white selection:bg-gold/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-charcoal hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Toggle Menu"
              >
                <Menu size={24} />
              </button>
                  <div className="flex items-center gap-4 cursor-pointer">
                    <div className="w-10 h-10 bg-navy flex items-center justify-center rounded-sm shadow-sm">
                      <span className="text-white font-serif text-2xl">B</span>
                    </div>
                    <h1 className="text-2xl font-serif tracking-tight text-charcoal leading-none">
                      Bharat <span className="text-gold">Icons</span>
                    </h1>
                  </div>
                </div>

                <div className="hidden md:flex items-center flex-1 max-w-md mx-12">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search icons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-gold transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden lg:flex items-center gap-6 text-sm font-semibold uppercase tracking-widest">
                    <span 
                      className="text-navy font-bold"
                    >
                      Dashboard
                    </span>
                  </div>
              
              {user ? (
                <div 
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <img 
                    src={userProfile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                    alt={user.displayName || ''} 
                    className="w-10 h-10 rounded-full border border-gold group-hover:scale-105 transition-transform object-cover"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                      {userStats?.badges?.[0] || 'Contributor'}
                    </p>
                    <p className="text-xs font-bold text-navy truncate max-w-[100px] leading-tight">{user.displayName}</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 bg-navy text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-opacity-90 transition-all rounded-sm"
                >
                  <LogIn size={14} className="text-gold" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-0 flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-72 border-r border-gray-100 p-8 flex-col gap-10 bg-white flex-shrink-0">
          <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between p-2 rounded transition-all text-sm ${
                        selectedCategory === cat 
                          ? 'bg-slate-50 text-navy font-semibold' 
                          : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat === 'All' ? 'All Personalities' : `${cat}s`}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        selectedCategory === cat ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {personalities.filter(p => cat === 'All' || p.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">State / Region</h3>
                <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-hide pr-1">
                  {states.map(state => (
                    <button
                      key={state}
                      onClick={() => setSelectedState(state)}
                      className={`w-full flex items-center justify-between p-2 rounded transition-all text-sm ${
                        selectedState === state 
                          ? 'bg-gold/10 text-navy font-semibold' 
                          : 'text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${selectedState === state ? 'bg-gold' : 'bg-gray-200'}`} />
                         <span>{state}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        selectedState === state ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {personalities.filter(p => state === 'All' || p.state === state).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Sort by</h3>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent border-b border-gray-200 py-2 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="votes">Highest Rank</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {/* Add New Icon button removed from here */}
            </div>

            <div className="mt-auto p-4 bg-slate-50 rounded-lg border-l-4 border-gold">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Daily Highlight</p>
              <p className="font-serif text-sm italic leading-relaxed text-charcoal/80">
                "Education is the manifestation of perfection already in man."
              </p>
            </div>
        </aside>

        {/* Dashboard View */}
        <main className="flex-1 p-6 lg:p-10 transition-all duration-300">
          <div className="flex justify-between items-end mb-10">
              <div className="space-y-1">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl font-serif text-charcoal"
                >
                  {selectedCategory === 'All' ? 'All Iconic Leaders' : `Iconic ${selectedCategory}s`}
                </motion.h2>
                <p className="text-gray-500 text-sm">Ranking based on community impact and votes.</p>
              </div>
              <div className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-tighter">
                Page 01 — 03
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedData.map((person, index) => (
                  <motion.div
                    key={person.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group relative bg-white border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col"
                    onClick={() => setSelectedPerson(person)}
                    id={`card-${person.id}`}
                  >
                    {/* Floating Rank Badge */}
                    <div className={`absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center font-serif italic text-lg shadow-lg text-white z-10 transition-colors ${
                      index === 0 ? 'bg-gold' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'
                    }`}>
                      #{index + 1}
                    </div>

                    <div className="w-full aspect-[4/5] bg-slate-200 mb-4 overflow-hidden relative">
                      <img 
                        src={person.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'} 
                        alt={person.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/10 transition-colors" />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1">
                      {person.category}
                    </p>
                    <h4 className="font-serif text-2xl mb-2 text-charcoal group-hover:text-navy transition-colors">
                      {person.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">
                      {person.short_bio}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Votes</p>
                        <p className="text-lg font-semibold text-navy">{person.votes.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(person.id);
                        }}
                        className="text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all active:scale-95 bg-navy text-white hover:bg-opacity-90"
                        id={`vote-btn-${person.id}`}
                        title={user ? 'Click to vote' : 'Login to vote'}
                      >
                        {user ? 'Upvote' : 'Login to Vote'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredAndSortedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <Search size={32} />
                </div>
                <h3 className="text-xl font-serif text-charcoal">No icons found</h3>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your search or category filter.</p>
                <button 
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedState('All');
                    setSearchQuery('');
                  }}
                  className="mt-6 text-gold font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </main>
      </div>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedPerson(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className="md:w-2/5 relative">
                <img 
                  src={selectedPerson.image} 
                  alt={selectedPerson.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover min-h-[300px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <Badge className="bg-gold text-charcoal mb-4">
                    {selectedPerson.category}
                  </Badge>
                  <h2 className="text-4xl font-bold text-white mb-2 leading-tight">
                    {selectedPerson.name}
                  </h2>
                  <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                    <TrendingUp size={16} className="text-gold" />
                    <span>{selectedPerson.votes} Votes in Rank List</span>
                  </div>
                </div>
              </div>

              <div className="md:w-3/5 p-8 sm:p-12 overflow-y-auto scrollbar-hide">
                <div className="space-y-10">
                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">
                       Personal Details
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-navy">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Born</p>
                          <p className="text-sm font-semibold">{selectedPerson.born}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-navy">
                          <Activity size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                          <p className="text-sm font-semibold">{selectedPerson.current_status}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">
                       Full Biography
                    </h3>
                    <p className="text-gray-600 leading-relaxed font-sans text-base">
                      {selectedPerson.full_bio}
                    </p>
                  </section>

                  <section>
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">
                       Impact & Contribution
                    </h3>
                    <div className="p-6 bg-gold/5 rounded-2xl border border-gold/10">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-gold">
                          <Award size={24} />
                        </div>
                        <p className="text-sm italic font-medium text-navy/80 leading-relaxed">
                          "{selectedPerson.impact}"
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 border-b border-gray-100 pb-2">
                       <span>Community Tributes</span>
                       <span className="text-[10px] text-gold">{tributes.length} Message{tributes.length !== 1 ? 's' : ''}</span>
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {tributes.length > 0 ? tributes.map((tribute) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={tribute.id} 
                          className="bg-gray-50 p-4 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <img src={tribute.userImage} alt="" className="w-5 h-5 rounded-full" />
                            <span className="text-[10px] font-bold text-navy uppercase tracking-widest">{tribute.userName}</span>
                            <span className="text-[8px] text-gray-400 ml-auto">
                              {tribute.createdAt?.toDate ? tribute.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 italic">"{tribute.message}"</p>
                        </motion.div>
                      )) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                          <p className="text-xs text-gray-400">No tributes yet. Be the first to honor {selectedPerson.name}!</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="flex flex-col gap-4 pt-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleVote(selectedPerson!.id)}
                        className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm transition-all shadow-xl flex items-center justify-center gap-3 bg-navy text-white hover:bg-navy/90 hover:scale-[1.02] active:scale-95 shadow-navy/20"
                      >
                        {user ? (<>Vote <ChevronUp size={20} /></>) : 'Login to Vote'}
                      </button>
                      <button 
                        onClick={generateShareCard}
                        disabled={isGeneratingCard}
                        className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm transition-all border-2 border-gold text-gold hover:bg-gold/5 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isGeneratingCard ? 'Generating...' : (<>Get Quote Card <Activity size={18} /></>)}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Share Legacy</p>
                      <div className="h-px flex-1 bg-gray-100"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleShare(selectedPerson!, 'whatsapp')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:bg-green-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                          <ExternalLink size={16} />
                        </div>
                        <span className="text-[8px] font-bold uppercase text-gray-400">WhatsApp</span>
                      </button>
                      <button 
                        onClick={() => handleShare(selectedPerson!, 'twitter')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:bg-sky-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                          <Twitter size={16} />
                        </div>
                        <span className="text-[8px] font-bold uppercase text-gray-400">Twitter</span>
                      </button>
                      <button 
                        onClick={() => handleShare(selectedPerson!, 'facebook')}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <Facebook size={16} />
                        </div>
                        <span className="text-[8px] font-bold uppercase text-gray-400">Facebook</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-charcoal/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[70] shadow-2xl p-8 lg:hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold tracking-tighter text-navy uppercase leading-none">
                  Bharat <span className="text-gold">Icons</span>
                </h1>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Categories</h3>
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all font-sans text-sm font-semibold ${
                          selectedCategory === cat 
                            ? 'bg-navy text-white shadow-lg' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">States</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {states.map(state => (
                      <button
                        key={state}
                        onClick={() => {
                          setSelectedState(state);
                          setIsSidebarOpen(false);
                        }}
                        className={`text-left px-4 py-3 rounded-xl transition-all font-sans text-xs font-semibold ${
                          selectedState === state 
                            ? 'bg-gold text-white shadow-md' 
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Sort By</h3>
                   <div className="space-y-1">
                     <button 
                      onClick={() => {
                        setSortBy('votes');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all font-sans text-sm font-semibold ${
                        sortBy === 'votes' ? 'bg-gold/10 text-gold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                     >
                        Rank (Votes)
                     </button>
                     <button 
                      onClick={() => {
                        setSortBy('name');
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all font-sans text-sm font-semibold ${
                        sortBy === 'name' ? 'bg-gold/10 text-gold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                     >
                        Alphabetical
                     </button>
                   </div>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                  © 2024 Bharat Icons
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-[#fcfaf7] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
            >
              {/* Left Side - Visual/Prestige */}
              <div className="hidden md:flex md:w-1/3 bg-navy p-8 flex-col justify-between text-white relative h-full">
                <div className="z-10">
                  <div className="w-10 h-10 bg-white flex items-center justify-center rounded-sm mb-6">
                    <span className="text-navy font-serif text-2xl font-bold">B</span>
                  </div>
                  <h4 className="text-xl font-serif leading-tight mb-2">Preserving the <span className="text-gold italic">Legacy</span> of India.</h4>
                </div>
                <div className="z-10 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Join the Community
                </div>
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 border-4 border-white rounded-full" />
                  <div className="absolute top-20 -left-10 w-20 h-20 border border-gold rounded-full" />
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 p-8 md:p-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-serif text-navy mb-1">
                      {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h3>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                      {authMode === 'login' ? 'Sign in to your profile' : 'Begin your journey'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAuthModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex bg-gray-100/50 p-1 rounded-xl mb-8">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${authMode === 'login' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg ${authMode === 'signup' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-gray-400 ml-1">First Name</label>
                          <input 
                            required
                            type="text" 
                            placeholder="e.g. Rahul"
                            value={authFormData.firstName}
                            onChange={(e) => setAuthFormData({...authFormData, firstName: e.target.value})}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-gray-400 ml-1">Last Name</label>
                          <input 
                            required
                            type="text" 
                            placeholder="e.g. Kumar"
                            value={authFormData.lastName}
                            onChange={(e) => setAuthFormData({...authFormData, lastName: e.target.value})}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-gray-400 ml-1">Birth Date</label>
                          <input 
                            required
                            type="date" 
                            value={authFormData.dob}
                            onChange={(e) => setAuthFormData({...authFormData, dob: e.target.value})}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-gray-400 ml-1">Mobile</label>
                          <input 
                            required
                            type="tel" 
                            placeholder="+91..."
                            value={authFormData.mobile}
                            onChange={(e) => setAuthFormData({...authFormData, mobile: e.target.value})}
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-gray-400 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        required
                        type="email" 
                        placeholder="name@example.com"
                        value={authFormData.email}
                        onChange={(e) => setAuthFormData({...authFormData, email: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-gray-400 ml-1">Password</label>
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••"
                      value={authFormData.password}
                      onChange={(e) => setAuthFormData({...authFormData, password: e.target.value})}
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-sm"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full py-4 bg-navy text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-navy/20 hover:bg-navy/90 active:scale-[0.98] transition-all pt-5"
                  >
                    {authMode === 'login' ? 'Enter Dashboard' : 'Create Legacy Profile'}
                  </button>
                </form>

                <div className="mt-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-100"></div>
                  <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">Social Entry</span>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full mt-6 py-3 border border-gray-100 rounded-xl flex items-center justify-center gap-3 text-xs font-bold text-navy hover:bg-white hover:shadow-md transition-all group px-4"
                >
                  <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                  Continue with Google
                </button>

                <p className="mt-6 text-center text-[10px] text-gray-400 font-medium">
                  By continuing, you agree to our <span className="text-gold cursor-pointer hover:underline">Honor Code</span> & <span className="text-gold cursor-pointer hover:underline">Privacy</span>.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileModal && user && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-navy/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#fdfaf6] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gold/20"
            >
              {/* Header Banner */}
              <div className="bg-navy p-10 pt-16 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gold/50" />
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute -top-10 -right-10 w-32 h-32 border-2 border-white rounded-full" />
                  <div className="absolute top-10 -left-10 w-24 h-24 border border-gold rounded-full" />
                </div>

                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute right-6 top-6 p-2 text-white/50 hover:text-white transition-colors z-20"
                >
                  <X size={20} />
                </button>
                
                <div className="relative inline-block group mb-6">
                  <div className="absolute inset-0 bg-gold rounded-full blur-xl opacity-20 animate-pulse" />
                  <img 
                    src={userProfile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                    alt="" 
                    className="w-28 h-28 rounded-full border-4 border-gold shadow-2xl object-cover relative z-10"
                  />
                  <label className="absolute inset-x-0 -bottom-2 z-20 flex justify-center">
                    <div className="bg-white text-navy p-2 rounded-full shadow-lg cursor-pointer hover:bg-gold hover:text-white transition-colors">
                      <Plus size={16} />
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                  </label>
                </div>
                
                <h3 className="text-2xl font-serif text-white mb-2 relative z-10">{user.displayName}</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 rounded-full border border-gold/20 relative z-10">
                  <Award size={12} className="text-gold" />
                  <span className="text-[9px] font-bold text-gold uppercase tracking-[0.2em]">{userStats?.badges?.[0] || 'Community Guardian'}</span>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-center group hover:border-gold/30 transition-colors">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Impact Score</p>
                    <p className="text-2xl font-serif text-navy group-hover:text-gold transition-colors">{userStats?.votesCount || 0}</p>
                  </div>
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-center group hover:border-gold/30 transition-colors">
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Rank Level</p>
                    <p className="text-2xl font-serif text-navy">Member</p>
                  </div>
                </div>

                <div className="space-y-5">
                   <div className="flex items-center justify-between pb-3 border-b border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-gray-300 group-hover:text-gold transition-colors" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">Verified Email</span>
                    </div>
                    <span className="text-xs font-semibold text-navy">{user.email}</span>
                  </div>
                  {userProfile && (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 group">
                        <div className="flex items-center gap-3">
                          <Activity size={14} className="text-gray-300 group-hover:text-gold transition-colors" />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">Identity Link</span>
                        </div>
                        <span className="text-xs font-semibold text-navy">{userProfile.mobile || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 group">
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-gray-300 group-hover:text-gold transition-colors" />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">Date of Birth</span>
                        </div>
                        <span className="text-xs font-semibold text-navy">{userProfile.dob || '—'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-10 flex gap-3">
                  <button 
                    onClick={() => {
                      alert("Profile sharing is coming soon!");
                    }}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    Share Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex-1 py-4 border border-red-50/50 bg-red-50/20 text-red-500 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={14} /> End Session
                  </button>
                </div>

                {user.email === 'asimbyans@gmail.com' && (
                  <a 
                    href="/admin.html"
                    className="mt-4 w-full py-4 bg-navy text-white rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-navy/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-navy/20"
                  >
                    <LayoutDashboard size={14} className="text-gold" /> Admin Dashboard
                  </a>
                )}
                
                <p className="mt-8 text-center text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
                  Trusted Member since 2024<br/>Bharat Icons Heritage Program
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTributeModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowTributeModal(false)} 
              className="absolute inset-0 bg-navy/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-serif mb-1">Honor {selectedPerson?.name}</h3>
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Leave your tribute</p>
                </div>
                <button 
                  onClick={() => setShowTributeModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={submitTribute} className="space-y-6">
                <textarea 
                  required
                  maxLength={200}
                  rows={4}
                  value={tributeMessage}
                  onChange={(e) => setTributeMessage(e.target.value)}
                  placeholder="Tell us why this icon inspires you... (max 200 characters)"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:outline-none focus:border-gold transition-all resize-none shadow-inner"
                />
                <button 
                  type="submit" 
                  className="w-full py-4 bg-navy text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-navy/20 active:scale-95 transition-all"
                >
                  Post to Tribute Stream
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Card Template (Hidden) */}
      {selectedPerson && (
        <div 
          id="share-card-template" 
          className="fixed left-[-9999px] top-[-9999px] w-[600px] h-[800px] bg-[#002147] p-12 flex flex-col items-center text-center text-white"
          style={{ display: 'none' }}
        >
          <div className="w-16 h-16 bg-white flex items-center justify-center rounded-sm mb-10">
            <span className="text-[#002147] font-serif text-3xl font-bold">B</span>
          </div>
          <div className="w-[350px] h-[350px] border-4 border-gold p-2 mb-10 overflow-hidden">
            <img src={selectedPerson.image} className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          <h2 className="text-4xl font-serif font-bold mb-4">{selectedPerson.name}</h2>
          <div className="w-12 h-1 bg-gold mb-10"></div>
          <p className="text-xl italic font-serif leading-relaxed px-4 text-gray-300">
            "{selectedPerson.impact}"
          </p>
          <div className="mt-auto flex flex-col items-center">
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-2">Bharat Icons | Legacy Card</p>
             <p className="text-[8px] text-gray-500 uppercase tracking-widest">A tribute to the architects of modern India</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#002147] text-white pt-20 pb-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white flex items-center justify-center rounded-sm">
                  <span className="text-navy font-serif text-2xl font-bold">B</span>
                </div>
                <h2 className="text-2xl font-serif font-bold tracking-tight">
                  Bharat <span className="text-gold">Icons</span>
                </h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Honoring the legends and architects of modern India. A platform designed to preserve and celebrate the impact of those who shaped our nation.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram].map((Icon, idx) => (
                  <a key={idx} href="#" className="w-10 h-10 border border-gray-700 flex items-center justify-center rounded hover:bg-gold hover:border-gold transition-all group">
                    <Icon size={18} className="text-gray-400 group-hover:text-navy" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-8">Categories</h3>
              <ul className="space-y-4">
                {[
                  { name: 'Teachers', cat: 'Teacher' },
                  { name: 'Leaders', cat: 'Leader' },
                  { name: 'Social Workers', cat: 'Social Worker' },
                  { name: 'Top Ranked', cat: 'All' }
                ].map((item) => (
                  <li key={item.name}>
                    <button 
                      onClick={() => {
                        setSelectedCategory(item.cat);
                        if (item.name === 'Top Ranked') setSortBy('votes');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-gray-400 text-sm hover:text-gold transition-colors flex items-center gap-2 group cursor-pointer"
                    >
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-8">Resources</h3>
              <ul className="space-y-4">
                {['Our Mission', 'Nomination Guide', 'Privacy Policy', 'Terms of Service'].map((link) => (
                  <li key={link}>
                    <button 
                      onClick={() => {
                        alert(`${link} page is coming soon! Our digital library is currently being expanded.`);
                      }}
                      className="text-gray-400 text-sm hover:text-gold transition-colors flex items-center gap-2 group cursor-pointer"
                    >
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-6 text-right">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-8 text-left md:text-right">Stay Updated</h3>
              <p className="text-gray-400 text-sm">Join our mailing list to receive stories about India's icons.</p>
              
              <AnimatePresence mode="wait">
                {newsletterStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-green-500/10 border border-green-500/50 p-4 text-green-500 text-xs font-bold uppercase tracking-widest text-center"
                  >
                    Thank you for subscribing!
                  </motion.div>
                ) : (
                  <motion.form 
                    key="newsletter-form"
                    onSubmit={handleNewsletterSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative group"
                  >
                    <input 
                      required
                      type="email" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email" 
                      className="w-full bg-navy-light/30 border border-gray-700 p-4 pr-12 text-sm text-white focus:outline-none focus:border-gold transition-all"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold group-hover:scale-110 transition-transform"
                    >
                      <Mail size={18} />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
              © 2024-2026 Bharat Icons | All Rights Reserved
            </p>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Designed with</span>
              <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
