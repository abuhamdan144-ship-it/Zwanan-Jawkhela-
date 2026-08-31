import React from 'react';
import { mockDonations } from '../data/mockData';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Landmark, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function Donations() {
  const totalCollected = mockDonations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: How to Donate & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-primary-900 text-white p-6 rounded-2xl shadow-lg"
          >
            <h2 className="text-xl font-bold mb-2">Total Funds Raised</h2>
            <p className="text-4xl font-bold text-primary-100 mb-6">Rs. {totalCollected.toLocaleString()}</p>
            <p className="text-sm text-primary-200">
              Your contributions fuel our local initiatives, emergency relief, and community welfare projects in Jawkhela.
            </p>
          </motion.div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-green-600" />
              How to Donate
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">Easypaisa / JazzCash</p>
                <p className="text-lg font-mono tracking-wider text-green-700">0300-1234567</p>
                <p className="text-xs text-gray-500 mt-1">Title: Zwanan Jawkhela Welfare</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">Bank Transfer</p>
                <p className="text-sm font-mono text-gray-700">Bank of Khyber, Jawkhela Branch</p>
                <p className="text-sm font-mono text-gray-700">Acc: 0011-2233445566</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                After transferring, please WhatsApp your receipt to our Treasurer at <strong>0311-7654321</strong> to have it recorded in the public ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Transparent Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transparent Ledger</h2>
                <p className="text-sm text-gray-500 mt-1">Recent contributions from the community</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Donor</th>
                    <th className="px-6 py-4 font-medium">Purpose</th>
                    <th className="px-6 py-4 font-medium text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {format(new Date(donation.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {donation.donorName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium">
                          {donation.purpose}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600 flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-4 h-4" />
                        {donation.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              All records are verified by the Zwanan Jawkhela Cabinet.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
