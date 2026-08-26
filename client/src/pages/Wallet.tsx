import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, RefreshCw, Copy } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { walletApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { item, container } from '../components/ui/GlassCard';

export default function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isDebit, setIsDebit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getMe(),
    enabled: !!user,
  });

  const wallet = (data as any)?.data?.wallet;
  const transactions = (data as any)?.data?.transactions || [];

  const addMutation = useMutation({
    mutationFn: () => {
      const payload = {
        amount: Number(amount),
        description,
      };
      if (isDebit) return walletApi.debit(payload);
      return walletApi.credit({ ...payload, userId: targetUser || user?._id! });
    },
    onSuccess: () => {
      toast.success(isDebit ? 'Debit successful' : 'Credit successful');
      setAddOpen(false);
      setAmount('');
      setDescription('');
      setTargetUser('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Transaction failed'),
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet?.currency || 'USD' }).format(n || 0);

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast.success('Address copied');
    } else {
      toast('No blockchain address set. Add one in Profile.');
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Wallet"
        subtitle="Manage your balance, rewards and transactions"
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => { setIsDebit(false); setAddOpen(true); }}>
              <ArrowDownCircle size={15} /> Credit
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setIsDebit(true); setAddOpen(true); }}>
              <ArrowUpCircle size={15} /> Request Debit
            </button>
          </div>
        }
      />

      {/* Hero wallet card */}
      <motion.div variants={item} className="gradient-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-200">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 -left-6 w-40 h-40 rounded-full bg-cyan-300/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-50 mb-2">
              <WalletIcon size={18} />
              <span className="uppercase tracking-wider text-xs font-semibold">EventHub Wallet</span>
            </div>
            <div className="text-4xl font-bold drop-shadow">{formatCurrency(wallet?.balance ?? 0)}</div>
            <p className="text-blue-50 text-sm mt-1">{wallet?.currency || 'USD'} balance</p>
          </div>
          {user?.walletAddress && (
            <button onClick={copyAddress} className="glass rounded-xl px-4 py-3 text-sm flex items-center gap-2 hover:bg-white/20 transition-colors">
              <Copy size={15} />
              <span className="max-w-[140px] truncate font-mono text-xs">{user.walletAddress}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Transactions */}
      <motion.div variants={item} className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Transaction History</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['wallet'] })}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <WalletIcon size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No transactions yet. Credit your wallet or earn rewards.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx._id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                  {tx.type === 'credit' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {tx.status} · {new Date(tx.createdAt).toLocaleString()}
                    {tx.reference ? ` · ${tx.reference}` : ''}
                  </p>
                </div>
                <div className={`font-semibold text-sm ${tx.type === 'credit' ? 'text-green-600' : 'text-orange-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title={isDebit ? 'Request Debit' : 'Credit Wallet'}>
        <div className="space-y-4">
          {!isDebit && (
            <div>
              <label className="input-label">User ID (optional, admin)</label>
              <input
                className="input-field"
                placeholder={user ? user._id : 'User ID'}
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="input-label">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Description</label>
            <input
              className="input-field"
              placeholder="e.g. Event reward, refund credit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary w-full disabled:opacity-50"
            disabled={!amount || Number(amount) <= 0 || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? 'Processing...' : isDebit ? 'Request Debit' : 'Credit Wallet'}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

