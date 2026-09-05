import React, { useState } from 'react';
import { mockUsers } from '../data/mockData';
import { Phone, MessageCircle, Droplet, Search } from 'lucide-react';
import { motion } from 'motion/react';

const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function BloodBank() {
  const [filterGroup, setFilterGroup] = useState('All');
  const [search, setSearch] = useState('');

  const donors = mockUsers.filter(u => 
    u.status === 'approved' && 
    u.canDonateBlood &&
    (filterGroup === 'All' || u.bloodGroup === filterGroup) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-full mb-4">
          <Droplet className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 font-serif mb-4">Blood Donor Directory</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          In case of emergency, contact the available donors below. The Zwanan Jawkhela blood bank network is maintained by community volunteers.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search name or address..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
          {bloodGroups.map(bg => (
            <button
              key={bg}
              onClick={() => setFilterGroup(bg)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterGroup === bg 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donors.map((donor, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={donor.id} 
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{donor.name}</h3>
                <p className="text-sm text-gray-500">{donor.address}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 text-red-600 font-bold text-lg rounded-full flex items-center justify-center shrink-0">
                {donor.bloodGroup}
              </div>
            </div>
            
            <div className="mt-auto pt-4 flex gap-3">
              <a 
                href={`tel:${donor.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
              <a 
                href={`https://wa.me/${donor.phone.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </motion.div>
        ))}
      </div>
      
      {donors.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No available donors found matching your criteria.
        </div>
      )}
    </div>
  );
}
