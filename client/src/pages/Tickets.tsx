import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../lib/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Tickets() {
  const [eventId, setEventId] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['tickets', eventId],
    queryFn: () => ticketsApi.getByEvent(eventId),
    enabled: !!eventId,
  });

  const tickets = data?.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Tickets</h1>
        <p className="text-gray-500 mt-1">Manage ticket types and pricing</p>
      </motion.div>

      <motion.div variants={item} className="card p-6">
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter Event ID to view tickets..."
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="input-field flex-1"
          />
          <button className="btn-primary">Load Tickets</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              <path d="M13 5v2"/>
              <path d="M13 17v2"/>
              <path d="M13 11v2"/>
            </svg>
            <p className="text-sm">Enter an event ID to view tickets</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket: any) => (
              <div key={ticket._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{ticket.name}</h3>
                    <p className="text-sm text-gray-500">{ticket.description}</p>
                  </div>
                  <span className="badge badge-primary">{ticket.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-xl">
                    {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
                  </span>
                  <span className="text-gray-500">
                    {ticket.soldCount}/{ticket.quantity} sold
                  </span>
                </div>
                {ticket.benefits?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Benefits:</p>
                    <div className="flex flex-wrap gap-1">
                      {ticket.benefits.map((b: string, i: number) => (
                        <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
