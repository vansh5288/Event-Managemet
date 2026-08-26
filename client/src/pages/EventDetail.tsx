import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { eventsApi, ticketsApi, reviewsApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isOrganizer } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { data: eventRes, isLoading, error, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!),
  });

  const { data: ticketsRes } = useQuery({
    queryKey: ['event-tickets', id],
    queryFn: () => ticketsApi.getByEvent(id!),
    enabled: !!id,
  });

  const { data: reviewsRes } = useQuery({
    queryKey: ['event-reviews', id],
    queryFn: () => reviewsApi.getByEvent(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-40 rounded-xl" />
            <div className="skeleton h-40 rounded-xl" />
          </div>
          <div className="skeleton h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState message={(error as any)?.message || 'Failed to load event'} onRetry={() => refetch()} />
    );
  }

  const event = eventRes?.data;
  if (!event) return <EmptyState title="Event not found" />;

  const tickets = ticketsRes?.data || [];
  const reviews = reviewsRes?.data || [];

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast('Please login to register', { icon: '🔐' });
      navigate('/login');
      return;
    }
    if (!selectedTicket) {
      toast.error('Please select a ticket type');
      return;
    }
    if (event.status !== 'published' && event.status !== 'ongoing') {
      toast.error('This event is not accepting registrations');
      return;
    }
    navigate(`/checkout?event=${event._id}&ticket=${selectedTicket}&quantity=${quantity}`);

  };

  const isOwner = isOrganizer && (typeof event.organizer === 'object' ? event.organizer?._id === user?._id : event.organizer === user?._id);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hero */}
      <motion.div variants={item} className="relative rounded-2xl overflow-hidden h-72">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-400" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 space-y-2">
          <div className="flex gap-2">
            <span className="badge bg-white/20 text-white backdrop-blur capitalize">{event.category}</span>
            <span className="badge bg-white/20 text-white backdrop-blur capitalize">{event.status}</span>
            {event.isPrivate && <span className="badge bg-white/20 text-white backdrop-blur">Private</span>}
          </div>
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          <p className="text-white/80 text-sm">{event.shortDescription}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={item} className="card p-6">
            <h3 className="font-semibold text-lg mb-3">About this event</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {event.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">#{tag}</span>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="card p-6">
            <h3 className="font-semibold text-lg mb-3">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-gray-500">{new Date(event.startDate).toLocaleString()} – {new Date(event.endDate).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-500">{event.location?.address || ''} {event.location?.city} {event.location?.country} {event.isVirtual ? '(Virtual)' : ''}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <svg className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <div>
                  <p className="font-medium">Capacity</p>
                  <p className="text-gray-500">{event.registeredCount || 0} / {event.capacity} registered</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                <div>
                  <p className="font-medium">Rating</p>
                  <p className="text-gray-500">{event.rating ? `${event.rating.toFixed(1)} / 5` : 'No ratings yet'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="card p-6">
            <h3 className="font-semibold text-lg mb-3">Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review: any) => (
                  <div key={review._id} className="p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="avatar w-8 h-8 text-xs">{review.user?.name?.charAt(0) || 'U'}</div>
                        <span className="font-medium text-sm">{review.user?.name || 'Anonymous'}</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-500">{'★'.repeat(Math.round(review.rating))}<span className="text-gray-300">{'★'.repeat(5 - Math.round(review.rating))}</span></span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div variants={item} className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Get Tickets</h3>
            {tickets.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-4">No tickets available for this event yet</p>
                <p className="text-2xl font-bold text-gray-600">{event.price === 0 ? 'Free' : `${event.currency} ${event.price}`}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.filter((t: any) => t.status === 'available').map((ticket: any) => (
                  <label key={ticket._id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTicket === ticket._id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{ticket.name}</p>
                        <p className="text-xs text-gray-500">{ticket.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{ticket.price === 0 ? 'Free' : `${ticket.currency || event.currency} ${ticket.price}`}</p>
                        <p className="text-xs text-gray-400">{ticket.quantity - ticket.soldCount} left</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <input type="radio" name="ticket" checked={selectedTicket === ticket._id} onChange={() => setSelectedTicket(ticket._id)} className="accent-blue-500" />
                      <span className="text-sm text-gray-500">Select</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.min(10, ticket.quantity - ticket.soldCount)}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        disabled={selectedTicket !== ticket._id}
                        className="input-field w-20 ml-auto text-sm disabled:opacity-50"
                      />
                    </div>
                  </label>
                ))}
                {tickets.filter((t: any) => t.status === 'available').length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">All ticket types sold out</p>
                )}
              </div>
            )}
            <button onClick={handleBookNow} className="btn-primary w-full mt-4" disabled={event.status !== 'published' && event.status !== 'ongoing'}>
              {event.status === 'published' || event.status === 'ongoing' ? 'Book Now' : 'Registrations Closed'}
            </button>
            {isOwner && (
              <div className="flex gap-2 mt-3">
                <Link to={`/dashboard/events/${event._id}/edit`} className="btn-secondary flex-1 text-center">Edit</Link>
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="card p-6">
            <h3 className="font-semibold text-lg mb-3">Organizer</h3>
            <div className="flex items-center gap-3">
              <div className="avatar">{typeof event.organizer === 'object' ? event.organizer?.name?.charAt(0) : 'O'}</div>
              <div>
                <p className="font-medium">{typeof event.organizer === 'object' ? event.organizer?.name : 'Organizer'}</p>
                <p className="text-xs text-gray-400">{typeof event.organizer === 'object' ? event.organizer?.email : ''}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

