import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth-context';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Profile</h1><p className="text-gray-500 mt-1">Manage your personal information</p></div>
        <button onClick={() => setEditing(!editing)} className={editing ? 'btn-primary' : 'btn-secondary'}>
          {editing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </motion.div>

      <motion.div variants={item} className="card p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-gray-500 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editing} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input-field" value={form.email} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} placeholder="+1 (555) 000-0000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <input className="input-field" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} disabled={!editing} placeholder="Your company or org" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea className="input-field min-h-[100px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} disabled={!editing} placeholder="Tell us about yourself..." />
        </div>
      </motion.div>

      <motion.div variants={item} className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Account Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Events Attended', value: '12' },
            { label: 'Certificates', value: '5' },
            { label: 'Reviews Written', value: '8' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
