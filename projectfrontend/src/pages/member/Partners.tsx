import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Facility } from '../../types';
import {
  Users, Search, Plus, MapPin, Calendar, Clock, Loader2, 
  CheckCircle2, AlertCircle, Info, Trash2
} from 'lucide-react';

interface PartnerPost {
  _id: string;
  creator: { _id: string; name: string };
  sport: string;
  facility: Facility;
  date: string;
  time: string;
  description: string;
  maxPlayers: number;
  joinedPlayers: { _id: string; name: string }[];
  status: 'open' | 'full' | 'completed' | 'cancelled';
}

const SPORTS = ['Badminton', 'Football', 'Squash', 'Tennis', 'Swimming', 'Basketball', 'Table Tennis', 'Gym', 'Other'];

export default function Partners() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PartnerPost[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sport: 'Badminton',
    facility: '',
    date: '',
    time: '',
    maxPlayers: 2,
    description: ''
  });

  useEffect(() => {
    fetchPosts();
    fetchFacilities();
  }, []);

  async function fetchPosts() {
    try {
      const data = await api.get<PartnerPost[]>('/partners');
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }

  async function fetchFacilities() {
    try {
      const data = await api.get<Facility[]>('/facilities');
      setFacilities(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, facility: data[0]._id }));
    } catch (err) {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/partners', formData);
      setShowCreateModal(false);
      fetchPosts();
      setFormData({
        sport: 'Badminton',
        facility: facilities[0]?._id || '',
        date: '',
        time: '',
        maxPlayers: 2,
        description: ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create recruitment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(postId: string) {
    setJoinLoading(postId);
    try {
      await api.put(`/partners/${postId}/join`);
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to join');
    } finally {
      setJoinLoading(null);
    }
  }

  async function handleDelete(postId: string) {
    if (!window.confirm('Are you sure you want to cancel this recruitment?')) return;
    try {
      await api.delete(`/partners/${postId}`);
      fetchPosts();
    } catch (err) {}
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Partner Recruitment</h1>
          <p className="text-slate-500 font-medium">Find elite partners for your next training session.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-700 text-white font-bold rounded-2xl hover:shadow-glow transition-all active:scale-95"
        >
          <Plus size={20} /> Create Recruitment
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-400 font-bold">Loading recruitment board...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-soft">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No active recruitments</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Be the first to host a session and find teammates!</p>
          <button onClick={() => setShowCreateModal(true)} className="text-teal-600 font-bold hover:underline">Create one now</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
          {posts.map((post) => {
            const isCreator = user?._id === post.creator._id;
            const hasJoined = post.joinedPlayers.some(p => p._id === user?._id);
            const spotsLeft = post.maxPlayers - post.joinedPlayers.length;

            return (
              <div key={post._id} className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-soft hover:shadow-soft-xl transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                {/* Status Badge */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest text-white ${spotsLeft === 0 ? 'bg-slate-400' : 'bg-teal-500 shadow-glow'}`}>
                  {spotsLeft === 0 ? 'Full' : `${spotsLeft} Slots Left`}
                </div>

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-700">
                      {post.creator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-none mb-1">{post.creator.name}</h3>
                      <div className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[10px] font-black w-fit uppercase">
                        {post.sport}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-600">{post.facility.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-600">{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-600">{post.time}</span>
                  </div>
                  {post.description && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 font-medium italic">
                      "{post.description}"
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {post.joinedPlayers.map((p, i) => (
                      <div key={p._id} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-600" title={p.name}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {spotsLeft > 0 && (
                      <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-300">
                        +{spotsLeft}
                      </div>
                    )}
                  </div>

                  {isCreator ? (
                    <button onClick={() => handleDelete(post._id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  ) : hasJoined ? (
                    <div className="flex items-center gap-1.5 text-teal-600 font-bold text-sm">
                      <CheckCircle2 size={16} /> Joined
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(post._id)}
                      disabled={!!joinLoading || spotsLeft === 0}
                      className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-teal-600 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                      {joinLoading === post._id ? <Loader2 size={14} className="animate-spin" /> : 'Join Game'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl border border-white/50 animate-scale-in overflow-hidden">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Host Recruitment</h2>
              <p className="text-slate-500 font-medium">Post a request to find players for your game.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sport</label>
                  <select
                    required
                    value={formData.sport}
                    onChange={e => setFormData(p => ({ ...p, sport: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  >
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Team Size</label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={20}
                    value={formData.maxPlayers}
                    onChange={e => setFormData(p => ({ ...p, maxPlayers: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Venue / Facility</label>
                <select
                  required
                  value={formData.facility}
                  onChange={e => setFormData(p => ({ ...p, facility: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                >
                  {facilities.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input
                    type="date"
                    required
                    lang="en-US"
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                  <input
                    type="time"
                    required
                    lang="en-US"
                    value={formData.time}
                    onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Additional Info</label>
                <textarea
                  placeholder="e.g. Friendly match, looking for intermediate players..."
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none h-24 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-2 py-4 bg-gradient-to-r from-teal-600 to-cyan-700 text-white font-bold rounded-2xl shadow-glow hover:shadow-glow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Launch Recruitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
