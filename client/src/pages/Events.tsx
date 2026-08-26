import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventsApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Events() {
  const { isOrganizer } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<any>({
    queryKey: ['events', search, category, status],
    queryFn: () => eventsApi.getAll({ search, category, status, limit: '50' }),
  });

  const events = data?.data || [];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge badge-warning',
      published: 'badge badge-primary',
      ongoing: 'badge badge-success',
      completed: 'badge',
      cancelled: 'badge badge-danger',
    };
    return badges[status] || 'badge';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-gray-500 mt-1">Manage and browse all events</p>
        </div>
        {isOrganizer && (
          <Link to="/dashboard/events/create" className="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Create Event
          </Link>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-auto">
          <option value="">All Categories</option>
          <option value="conference">Conference</option>
          <option value="workshop">Workshop</option>
          <option value="seminar">Seminar</option>
          <option value="webinar">Webinar</option>
          <option value="meetup">Meetup</option>
          <option value="concert">Concert</option>
          <option value="festival">Festival</option>
          <option value="exhibition">Exhibition</option>
          <option value="networking">Networking</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </motion.div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <div className="skeleton h-48 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div variants={item} className="text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect width="18" height="18" x="3" y="4" rx="2"/>
            <path d="M3 10h18"/>
            <path d="M8 2v4"/>
            <path d="M16 2v4"/>
          </svg>
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No events found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
          {isOrganizer && (
            <Link to="/dashboard/events/create" className="btn-primary inline-flex items-center gap-2 mt-4">
              Create your first event
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <motion.div key={event._id} variants={item} className="card p-0 overflow-hidden group">
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-cyan-100 overflow-hidden">
                {event.banner ? (
                  <img src={event.banner} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect width="18" height="18" x="3" y="4" rx="2"/>
                      <path d="M3 10h18"/>
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={getStatusBadge(event.status)}>{event.status}</span>
                </div>
                {event.isPrivate && (
                  <div className="absolute top-3 left-3">
                    <span className="badge bg-gray-800 text-white">Private</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{event.category}</span>
                  <span className="text-xs text-gray-400">{event.location?.city || 'Online'}</span>
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.shortDescription}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {event.registeredCount}/{event.capacity}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-lg">
                    {event.price === 0 ? 'Free' : `$${event.price}`}
                  </span>
                  <Link to={`/dashboard/events/${event._id}`} className="btn-secondary text-sm py-1.5 px-4">
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
