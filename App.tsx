import React, { useState, useMemo } from 'react';
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
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Personality {
  id: number;
  name: string;
  category: 'Teacher' | 'Leader' | 'Social Worker';
  image: string;
  votes: number;
  short_bio: string;
  full_bio: string;
  born: string;
  impact: string;
  current_status: string;
}

// --- Initial Data ---
const INITIAL_DATA: Personality[] = [
  {
    id: 1,
    name: "Vikas Divyakirti",
    category: "Teacher",
    image: "https://images.unsplash.com/photo-1544717297-fa154da09f9b?auto=format&fit=crop&w=400&q=80",
    votes: 1250,
    short_bio: "Founder of Drishti IAS, renowned for his teaching style and insights.",
    full_bio: "Dr. Vikas Divyakirti is a former civil servant and a legendary teacher in India. He is known for making complex topics simple for UPSC aspirants. His deep understanding of humanities, philosophy, and history has made him an icon among students. He founded Drishti IAS in 1999 with a vision to provide quality guidance to aspirants from various backgrounds.",
    born: "Haryana, India",
    impact: "Guided thousands of students to clear the civil services exam.",
    current_status: "Active Educator and Speaker"
  },
  {
    id: 2,
    name: "Ratan Tata",
    category: "Leader",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    votes: 5000,
    short_bio: "Industrialist and Philanthropist, former chairman of Tata Group.",
    full_bio: "Ratan Tata is a visionary leader who transformed the Tata Group into a global powerhouse while maintaining high ethical standards. Under his leadership, Tata Motors acquired Jaguar Land Rover and Corus, among other major global acquisitions. He is equally famous for his humility and extensive philanthropic work through the Tata Trusts.",
    born: "Mumbai, India",
    impact: "Donated billions through Tata Trusts for social welfare and education.",
    current_status: "Philanthropist & Chairman Emeritus"
  },
  {
    id: 3,
    name: "Medha Patkar",
    category: "Social Worker",
    image: "https://images.unsplash.com/photo-1489424155312-428b5783ee4a?auto=format&fit=crop&w=400&q=80",
    votes: 850,
    short_bio: "Famous social activist known for Narmada Bachao Andolan.",
    full_bio: "Medha Patkar has dedicated her life to social causes, specifically fighting for the rights of tribal people and farmers displaced by large dam projects. She is a core member of the Narmada Bachao Andolan and the National Alliance of People's Movements. Her persistence in non-violent protests has gained global recognition.",
    born: "Mumbai, India",
    impact: "Environmental protection and tribal rights advocacy across India.",
    current_status: "Activist"
  },
  {
    id: 4,
    name: "Dr. A.P.J. Abdul Kalam",
    category: "Leader",
    image: "https://images.unsplash.com/photo-1549419133-722a3641ed85?auto=format&fit=crop&w=400&q=80",
    votes: 8500,
    short_bio: "The 'Missile Man of India' and former President reflecting wisdom and simplicity.",
    full_bio: "Avul Pakir Jainulabdeen Abdul Kalam was an Indian aerospace scientist and statesman who served as the 11th president of India. He spent four decades as a scientist and science administrator, mainly at the DRDO and ISRO. He was intimately involved in India's civilian space programme and military missile development efforts.",
    born: "Rameswaram, India",
    impact: "Inspiring millions of youth through science, education, and his vision for India 2020.",
    current_status: "Legacy Artist"
  },
  {
    id: 5,
    name: "Anand Kumar",
    category: "Teacher",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    votes: 2100,
    short_bio: "Mathematician known for his Super 30 program.",
    full_bio: "Anand Kumar is a mathematician best known for his Super 30 program, which he started in Patna, Bihar. The program coaches economically backward sections of society for the IIT-JEE. By 2018, 422 out of 480 had made it to ITIs and Discovery Channel showcased his work in a documentary.",
    born: "Patna, India",
    impact: "Empowering underprivileged students to achieve world-class education.",
    current_status: "Active Educator"
  },
  {
    id: 6,
    name: "Sonam Wangchuk",
    category: "Social Worker",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    votes: 3200,
    short_bio: "Engineer and innovator known for SECMOL and Ice Stupas.",
    full_bio: "Sonam Wangchuk is an Indian engineer, innovator and education reformist from Ladakh. He is the founding-director of the SECMOL. He is also known for designing the SECMOL campus that runs entirely on solar energy. He invented the 'Ice Stupa' technique to address water shortages in high-altitude deserts.",
    born: "Ladakh, India",
    impact: "Revolutionizing education and water conservation in the Himalayan region.",
    current_status: "Innovator & Activist"
  }
];

// --- Components ---

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded ${className}`}>
    {children}
  </span>
);

export default function App() {
  const [personalities, setPersonalities] = useState<Personality[]>(INITIAL_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');
  const [selectedPerson, setSelectedPerson] = useState<Personality | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'add'>('dashboard');

  // Form State
  const [formData, setFormData] = useState<Omit<Personality, 'id' | 'votes'>>({
    name: '',
    category: 'Teacher',
    image: '',
    short_bio: '',
    full_bio: '',
    born: '',
    impact: '',
    current_status: ''
  });

  const categories = ['All', 'Teacher', 'Leader', 'Social Worker'];

  const filteredAndSortedData = useMemo(() => {
    return personalities
      .filter(p => (selectedCategory === 'All' || p.category === selectedCategory))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'votes') return b.votes - a.votes;
        return a.name.localeCompare(b.name);
      });
  }, [personalities, selectedCategory, searchQuery, sortBy]);

  const handleVote = (id: number) => {
    setPersonalities(prev => prev.map(p => 
      p.id === id ? { ...p, votes: p.votes + 1 } : p
    ));
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const newPerson: Personality = {
      ...formData,
      id: Date.now(),
      votes: 0
    };
    setPersonalities(prev => [newPerson, ...prev]);
    setView('dashboard');
    setFormData({
      name: '',
      category: 'Teacher',
      image: '',
      short_bio: '',
      full_bio: '',
      born: '',
      impact: '',
      current_status: ''
    });
  };

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
              <div 
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setView('dashboard')}
              >
                <div className="w-10 h-10 bg-navy flex items-center justify-center rounded-sm shadow-sm">
                  <span className="text-white font-serif text-2xl">B</span>
                </div>
                <h1 className="text-2xl font-serif tracking-tight text-charcoal leading-none">
                  Bharat <span className="text-gold">Icons</span>
                </h1>
              </div>
            </div>

            {view === 'dashboard' && (
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
            )}

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-6 text-sm font-semibold uppercase tracking-widest">
                <span 
                  onClick={() => setView('dashboard')}
                  className={`cursor-pointer transition-colors ${view === 'dashboard' ? 'text-navy' : 'text-gray-400 hover:text-navy'}`}
                >
                  Dashboard
                </span>
                <span 
                  onClick={() => setView('add')}
                  className={`cursor-pointer transition-colors ${view === 'add' ? 'text-navy' : 'text-gray-400 hover:text-navy'}`}
                >
                  Contribute
                </span>
              </div>
              <div className="w-10 h-10 rounded-full border border-gold flex items-center justify-center text-xs font-bold text-gold cursor-pointer hover:bg-gold hover:text-white transition-all">
                AS
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-0 flex">
        {/* Sidebar Desktop (Only for Dashboard) */}
        {view === 'dashboard' && (
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
              <button 
                onClick={() => setView('add')}
                className="w-full bg-navy text-white py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Award size={14} className="text-gold" />
                Add New Icon
              </button>
            </div>

            <div className="mt-auto p-4 bg-slate-50 rounded-lg border-l-4 border-gold">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Daily Highlight</p>
              <p className="font-serif text-sm italic leading-relaxed text-charcoal/80">
                "Education is the manifestation of perfection already in man."
              </p>
            </div>
          </aside>
        )}

        {/* Dashboard View */}
        {view === 'dashboard' && (
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
                        className="bg-navy text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 hover:bg-opacity-90 transition-all active:scale-95"
                        id={`vote-btn-${person.id}`}
                      >
                        Upvote
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
                    setSearchQuery('');
                  }}
                  className="mt-6 text-gold font-bold text-xs uppercase tracking-widest hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </main>
        )}

        {/* Add Icon Form View */}
        {view === 'add' && (
          <main className="flex-1 p-6 lg:p-10 flex justify-center bg-off-white">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl"
            >
              <div className="mb-10 text-center">
                <h2 className="text-4xl font-serif text-charcoal mb-2">Contribute a <span className="text-gold italic underline underline-offset-8">Legacy</span></h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto">Fill in the details below to add a new personality to the Bharat Icons ranking list.</p>
              </div>

              <form onSubmit={handleAddPerson} className="bg-white border border-gray-100 p-8 sm:p-12 shadow-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Swami Vivekananda"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all cursor-pointer"
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="Leader">Leader</option>
                      <option value="Social Worker">Social Worker</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image URL</label>
                  <input 
                    required
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                  <p className="text-[10px] text-gray-400 italic">Provide a direct link to a high-quality photo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Born (Location)</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Kolkata, India"
                      value={formData.born}
                      onChange={(e) => setFormData({...formData, born: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Status</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Active Educator"
                      value={formData.current_status}
                      onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Short Bio</label>
                  <input 
                    required
                    maxLength={100}
                    type="text" 
                    placeholder="A brief summary (max 100 characters)"
                    value={formData.short_bio}
                    onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Biography</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Detailed history and achievements..."
                    value={formData.full_bio}
                    onChange={(e) => setFormData({...formData, full_bio: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Legacy Impact</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="Describe their lasting contribution to society..."
                    value={formData.impact}
                    onChange={(e) => setFormData({...formData, impact: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:border-gold transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setView('dashboard')}
                    className="flex-1 border border-gray-200 text-gray-400 py-4 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-navy text-white py-4 rounded-sm font-bold uppercase tracking-widest text-xs hover:shadow-xl transition-all shadow-navy/20"
                  >
                    Publish to Dashboard
                  </button>
                </div>
              </form>
            </motion.div>
          </main>
        )}
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

                  <div className="flex justify-center pt-8">
                    <button 
                      onClick={() => handleVote(selectedPerson!.id)}
                      className="w-full bg-navy text-white py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm hover:bg-navy/90 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-navy/20 flex items-center justify-center gap-3"
                    >
                      Upvote this Icon <ChevronUp size={20} />
                    </button>
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold tracking-tighter text-navy uppercase mb-4">
            Bharat <span className="text-gold">Icons</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
            A tribute to the teachers, leaders, and social workers who continue to shape the destiny of India.
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <a href="#" className="text-gray-400 hover:text-navy transition-colors"><Award size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-navy transition-colors"><MapPin size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-navy transition-colors"><Calendar size={20} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
