import React from 'react';
import { mockCabinet, mockUsers } from '../data/mockData';
import { Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cabinet() {
  const cabinetMembers = mockCabinet.map(cab => {
    const user = mockUsers.find(u => u.id === cab.userId);
    return { ...cab, ...user };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Cabinet Members</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          The elected representatives responsible for managing the affairs, funds, and initiatives of Zwanan Jawkhela.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {cabinetMembers.map((member, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={member.id} 
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="h-32 bg-primary-950 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              <div className="absolute inset-0 bg-noise" />
            </div>
            
            <div className="relative px-6 pb-6">
              <div className="w-24 h-24 mx-auto -mt-12 mb-4 bg-white rounded-full p-1 shadow-md group-hover:scale-110 transition-transform duration-300">
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name?.charAt(0)
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-sm font-semibold text-primary-600 mb-4">{member.position}</p>
              
              <div className="space-y-2 mt-6">
                <a href={`tel:${member.phone}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <Phone className="w-4 h-4" /> {member.phone}
                </a>
                <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <Mail className="w-4 h-4" /> {member.email}
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
