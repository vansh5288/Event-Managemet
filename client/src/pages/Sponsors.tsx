import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sponsorsApi, eventsApi } from '../lib/api';
import Modal from '../components/ui/Modal';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const tierColors: Record<string, string> = {
  platinum: 'bg-gradient-to-r from-blue-500 to-purple-500',
  gold: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  silver: 'bg-gradient-to-r from-gray-300 to-gray-400',
  bronze: 'bg-gradient-to-r from-amber-600 to-amber-700',
  media: 'bg-gradient-to-r from-pink-500 to-rose-500',
};

const emptyForm = {
  event: '',
  name: '',
  website: '',
  description: '',
  tier: 'silver',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  amount: 0,
};

export default function Sponsors() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ['sponsors'],
    queryFn: () => sponsorsApi.getAll(),
  });

  const { data: eventsData } = useQuery<any>({
    queryKey: ['events-all'],
    queryFn: () => eventsApi.getAll({ limit: '100' }),
  });

  const events = eventsData?.data || [];

  const createMutation = useMutation({
    mutationFn: () => sponsorsApi.create(form),
    onSuccess: () => {
      toast.success('Sponsor added successfully');
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add sponsor'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sponsorsApi.delete(id),
    onSuccess: () => {
      toast.success('Sponsor removed');
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to remove sponsor'),
  });

  const sponsors = data?.data || [];
  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sponsors</h1>
          <p className="text-gray-500 mt-1">Manage event sponsors and partners</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>Add Sponsor</button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <div className="skeleton h-2 w-full" />
              <div className="p-6 space-y-3">
                <div className="skeleton h-14 w-14 rounded-xl" />
                <div className="skeleton h-6 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <motion.div variants={item} className="text-center py-16 text-gray-400">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M11 17a1 1 0 0 1-1 1H5a2 2 0 0 0-2 2v2"/>
            <path d="M20 21v-2a2 2 0 0 0-2-2h-5a1 1 0 0 1-1-1"/>
            <path d="M4 10V3"/>
            <path d="M20 10V3"/>
            <path d="M8 3v7a4 4 0 0 0 8 0V3"/>
          </svg>
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No sponsors yet</h3>
          <p className="text-gray-400">Add your first sponsor to get started</p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor: any) => (
            <div key={sponsor._id} className="card p-0 overflow-hidden relative">
              <div className={`${tierColors[sponsor.tier] || tierColors.silver} h-2`} />
              <button
                onClick={() => deleteMutation.mutate(sponsor._id)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                title="Remove sponsor"
              >
                ×
              </button>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.name} className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                      {(sponsor.name || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{sponsor.name}</h3>
                    <span className="badge badge-primary capitalize">{sponsor.tier}</span>
                  </div>
                </div>
                {sponsor.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{sponsor.description}</p>}
                {(() => {
                  const ev = typeof sponsor.event === 'object' ? sponsor.event : events.find((e: any) => e._id === sponsor.event);
                  return ev ? <p className="text-xs text-gray-400 mb-3">Event: {ev.title}</p> : null;
                })()}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Contribution</span>
                  <span className="font-bold text-lg">{sponsor.currency || 'USD'} {Number(sponsor.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Add Sponsor Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Sponsor">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sponsor Name *</label>
            <input className="input-field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Event *</label>
            <select className="input-field" value={form.event} onChange={(e) => update('event', e.target.value)}>
              <option value="">Select an event</option>
              {events.map((ev: any) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <select className="input-field" value={form.tier} onChange={(e) => update('tier', e.target.value)}>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
                <option value="media">Media</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (USD)</label>
              <input type="number" min={0} className="input-field" value={form.amount} onChange={(e) => update('amount', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input className="input-field" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="input-field min-h-[80px]" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Brief sponsorship description" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input className="input-field" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <input type="email" className="input-field" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="btn-primary flex-1"
              disabled={createMutation.isPending || !form.name || !form.event}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Adding…' : 'Add Sponsor'}
            </button>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

