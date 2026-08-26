import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '../lib/api';
import Modal from '../components/ui/Modal';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Volunteers() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<any>({
    queryKey: ['all-users'],
    queryFn: () => usersApi.getAll(),
  });

  const volunteers = (data?.data || []).filter((u: any) => u.role === 'volunteer');

  const addMutation = useMutation({
    mutationFn: async () => {
      // Find existing user by email
      const users = data?.data || [];
      const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return usersApi.updateRole(existing._id, 'volunteer');
      }
      throw new Error('User not found. Ask them to sign up first, then assign the volunteer role.');
    },
    onSuccess: () => {
      toast.success('Volunteer role assigned');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowModal(false);
      setEmail('');
      setName('');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add volunteer'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => usersApi.updateRole(id, 'participant'),
    onSuccess: () => {
      toast.success('Volunteer role removed');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to remove volunteer'),
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Volunteers</h1>
          <p className="text-gray-500 mt-1">Manage event volunteers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>Add Volunteer</button>
      </motion.div>

      <motion.div variants={item} className="card p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
          </div>
        ) : volunteers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm">No volunteers yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v: any) => (
                  <tr key={v._id}>
                    <td className="font-medium">{v.name}</td>
                    <td className="text-gray-500">{v.email}</td>
                    <td>{v.organization || '—'}</td>
                    <td><span className={v.isActive ? 'badge badge-success' : 'badge badge-danger'}>{v.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-ghost text-sm text-red-500"
                        onClick={() => removeMutation.mutate(v._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Volunteer">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Assign the volunteer role to a registered user by their email address.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">User Email *</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="volunteer@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="btn-primary flex-1"
              disabled={addMutation.isPending || !email}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? 'Assigning…' : 'Assign Volunteer'}
            </button>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

