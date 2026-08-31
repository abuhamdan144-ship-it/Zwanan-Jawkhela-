import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, FileText, Image as ImageIcon, Heart, CheckCircle, XCircle } from 'lucide-react';
import { mockUsers } from '../data/mockData';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'news' | 'donations' | 'activity'>('members');

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }

  const pendingMembers = mockUsers.filter(u => u.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 text-center">
            <h2 className="font-bold text-gray-900">Admin Portal</h2>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <nav className="flex flex-col p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'members' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users className="w-4 h-4" /> Manage Members
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'news' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <FileText className="w-4 h-4" /> Post News
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'activity' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ImageIcon className="w-4 h-4" /> Activity Feed
            </button>
            <button 
              onClick={() => setActiveTab('donations')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'donations' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Heart className="w-4 h-4" /> Record Donation
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        {activeTab === 'members' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
            {pendingMembers.length === 0 ? (
              <p className="text-gray-500 bg-white p-6 rounded-xl border border-gray-100">No pending membership requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingMembers.map(member => (
                  <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">CNIC: {member.cnic} • Address: {member.address}</p>
                      <p className="text-sm text-gray-500">Phone: {member.phone} • Blood: {member.bloodGroup}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Post New Announcement</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border border-gray-300 rounded-md p-2">
                  <option>Death</option><option>Marriage</option><option>Nikah</option><option>Engagement</option><option>Announcement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                <input type="text" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Urdu)</label>
                <input type="text" dir="rtl" className="w-full border border-gray-300 rounded-md p-2 font-urdu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={4} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Names Involved (comma separated)</label>
                <input type="text" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <button className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">Publish News</button>
            </form>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Activity Photo</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image Upload</label>
                <input type="file" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input type="text" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <button className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">Post to Feed</button>
            </form>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Record Offline Donation</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
                <input type="text" placeholder="Enter name or 'Anonymous'" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                <input type="number" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Project</label>
                <input type="text" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Add to Ledger</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
