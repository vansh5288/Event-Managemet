import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BadgePercent, Plus, Trash2, Tag, Calendar, Users, Infinity as InfinityIcon } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { couponsApi } from '../lib/api';
import { container, item } from '../components/ui/GlassCard';

interface CouponForm {
  code: string;
  description?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  event?: string;
  expiresAt?: string;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: 0,
  minAmount: 0,
  maxDiscount: 0,
  maxUses: 0,
  event: '',
  expiresAt: '',
};

export default function Coupons() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsApi.getAll(),
  });

  const coupons: any[] = (data as any)?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: CouponForm) => couponsApi.create(payload),
    onSuccess: () => {
      toast.success('Coupon created');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => {
      toast.success('Coupon deleted');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete coupon'),
  });

  const discountLabel = (c: any) => {
    if (c.discountType === 'percent') return `${c.discountValue}% OFF`;
    return `${c.currency || '$'}${c.discountValue} OFF`;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Create and manage discount codes for your events"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={15} /> New Coupon
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <motion.div variants={item} className="card p-8">
          <EmptyState
            icon={<BadgePercent size={32} />}
            title="No coupons yet"
            description="Create discount codes to boost ticket sales and reward attendees."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
                <Plus size={15} /> Create Coupon
              </button>
            }
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon, i) => {
            const active = coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date());
            const usedPercent = coupon.maxUses ? Math.min(100, Math.round((coupon.usedCount || 0) / coupon.maxUses * 100)) : 0;
            return (
              <motion.div key={coupon._id} variants={item} custom={i * 0.03} className="card p-5 card-hover-glow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                      <BadgePercent size={18} />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-base uppercase tracking-wider">{coupon.code}</p>
                      <p className="text-xs text-gray-400">{coupon.discountType === 'percent' ? 'Percent discount' : 'Flat discount'}</p>
                    </div>
                  </div>
                  <StatusBadge status={active ? 'active' : 'expired'} />
                </div>

                <div className="text-2xl font-bold text-blue-600 mb-2">{discountLabel(coupon)}</div>
                {coupon.description && <p className="text-sm text-gray-500 mb-3">{coupon.description}</p>}

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                  {coupon.minAmount > 0 && <span className="flex items-center gap-1"><Tag size={12} /> Min ${coupon.minAmount}</span>}
                  {coupon.maxUses ? (
                    <span className="flex items-center gap-1"><Users size={12} /> {coupon.usedCount || 0}/{coupon.maxUses} used</span>
                  ) : (
                    <span className="flex items-center gap-1"><InfinityIcon size={12} /> Unlimited</span>
                  )}
                  {coupon.expiresAt && (
                    <span className="flex items-center gap-1"><Calendar size={12} /> Exp {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>

                {coupon.maxUses ? (
                  <div className="h-1.5 rounded bg-gray-100 overflow-hidden mb-4">
                    <div className="h-full rounded bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${usedPercent}%` }} />
                  </div>
                ) : null}

                <button
                  className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 w-full"
                  onClick={() => deleteMutation.mutate(coupon._id)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Coupon" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Coupon Code *</label>
            <input
              className="input-field font-mono uppercase"
              placeholder="SAVE20"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="input-label">Discount Type</label>
            <select
              className="input-field"
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
            >
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (currency)</option>
            </select>
          </div>
          <div>
            <label className="input-label">Discount Value *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input-field"
              placeholder={form.discountType === 'percent' ? 'e.g. 20' : 'e.g. 15'}
              value={form.discountValue || ''}
              onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="input-label">Min. Order Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0 = no minimum"
              value={form.minAmount || ''}
              onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="input-label">Max Discount (percent only)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0 = unlimited"
              value={form.maxDiscount || ''}
              onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="input-label">Max Uses</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input-field"
              placeholder="0 = unlimited"
              value={form.maxUses || ''}
              onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="input-label">Expiry Date</label>
            <input
              type="datetime-local"
              className="input-field"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="input-label">Description (optional)</label>
          <input
            className="input-field"
            placeholder="e.g. Early bird discount for TechConf"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary disabled:opacity-50"
            disabled={!form.code || form.discountValue <= 0 || createMutation.isPending}
            onClick={() => createMutation.mutate(form)}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

