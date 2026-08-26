import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { venuesApi } from '../lib/api';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Venues() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['venues'],
    queryFn: () => venuesApi.getAll(),
  });

  const venues = data?.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Venues</h1>
          <p className="text-gray-500 mt-1">Manage event venues and locations</p>
        </div>
        <button className="btn-primary">Add Venue</button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <div className="skeleton h-40 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : venues.length === 0 ? (
        <motion.div variants={item} className="text-center py-16 text-gray-400">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No venues yet</h3>
          <p className="text-gray-400">Add your first venue to get started</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue: any) => (
            <motion.div key={venue._id} variants={item} className="card p-0 overflow-hidden group">
              <div className="h-40 bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center">
                <svg className="w-16 h-16 text-cyan-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{venue.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{venue.address}, {venue.city}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    Capacity: {venue.capacity}
                  </span>
                  {venue.amenities?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      {venue.amenities.length} amenities
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
