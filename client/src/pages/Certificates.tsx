import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { certificatesApi } from '../lib/api';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Certificates() {
  const { data, isLoading } = useQuery<any>({ queryKey: ['certificates'], queryFn: () => certificatesApi.getMy() });
  const certs = data?.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}><h1 className="text-2xl font-bold">Certificates</h1><p className="text-gray-500 mt-1">View and download your event certificates</p></motion.div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>
      ) : certs.length === 0 ? (
        <motion.div variants={item} className="text-center py-16 text-gray-400">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
          <h3 className="text-lg font-semibold text-gray-500 mb-2">No certificates yet</h3>
          <p className="text-gray-400">Complete an event to earn a certificate</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map((cert: any) => (
            <motion.div key={cert._id} variants={item} className="card p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white mx-auto mb-4">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
              </div>
              <h3 className="font-semibold">{cert.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{cert.event?.title}</p>
              <p className="text-xs text-gray-400 mb-4">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
              <div className="flex gap-2 justify-center">
                <button className="btn-primary text-sm py-1.5 px-4">Download PDF</button>
                <button className="btn-secondary text-sm py-1.5 px-4">Verify</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
