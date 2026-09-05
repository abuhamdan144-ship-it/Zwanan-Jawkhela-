import { Logo } from "../components/ui/LogoFallback";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Download, Search, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { firebaseApp, db } from '../firebase';
import { collection, setDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

function downloadCardImage(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><rect width="900" height="560" rx="32" fill="#052e16"/><rect x="28" y="28" width="844" height="504" rx="22" fill="#0f5132" stroke="#eab308" stroke-width="3"/><text x="70" y="100" fill="#facc15" font-family="Arial" font-size="34" font-weight="700">ZWANAN JAWKHELA</text><text x="70" y="135" fill="#dcfce7" font-family="Arial" font-size="18">OFFICIAL MEMBERSHIP CARD</text><circle cx="130" cy="285" r="72" fill="#dcfce7"/><text x="130" y="300" text-anchor="middle" fill="#166534" font-family="Arial" font-size="58" font-weight="700">${user.name.charAt(0)}</text><text x="245" y="260" fill="#ffffff" font-family="Arial" font-size="30" font-weight="700">${user.name}</text><text x="245" y="295" fill="#bbf7d0" font-family="Arial" font-size="18">Member ID: ${user.id}</text><text x="245" y="330" fill="#bbf7d0" font-family="Arial" font-size="18">Blood Group: ${user.bloodGroup}</text><text x="70" y="465" fill="#bbf7d0" font-family="Arial" font-size="18">Valid until: ${user.validUntil || 'Active'}</text><text x="650" y="465" fill="#facc15" font-family="Arial" font-size="18">JAWKHELA · BUNER</text></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `${user.id}-membership-card.svg`; link.click(); URL.revokeObjectURL(url);
}

function downloadCardPdf(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, 56] });
  pdf.setFillColor(5, 46, 22); pdf.roundedRect(3, 3, 84, 50, 4, 4, 'F');
  pdf.setTextColor(250, 204, 21); pdf.setFontSize(13); pdf.text('ZWANAN JAWKHELA', 8, 12);
  pdf.setTextColor(220, 252, 231); pdf.setFontSize(6); pdf.text('OFFICIAL MEMBERSHIP CARD', 8, 16);
  pdf.setFillColor(220, 252, 231); pdf.circle(17, 30, 8, 'F'); pdf.setTextColor(22, 101, 52); pdf.setFontSize(16); pdf.text(user.name.charAt(0), 14.5, 34);
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(10); pdf.text(user.name, 29, 29); pdf.setTextColor(187, 247, 208); pdf.setFontSize(6); pdf.text(`Member ID: ${user.id}`, 29, 34); pdf.text(`Blood Group: ${user.bloodGroup}`, 29, 39); pdf.text(`Valid until: ${user.validUntil || 'Active'}`, 8, 48);
  pdf.save(`${user.id}-membership-card.pdf`);
}

export default function Membership() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'register' | 'directory' | 'card'>(user ? 'directory' : 'register');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  
  // Registration form state
  const [regData, setRegData] = useState({ name: '', fatherName: '', cnic: '', phone: '', address: '', bloodGroup: 'A+', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regMessage, setRegMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const q = query(collection(db, 'members'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRegMessage({ type: '', text: '' });
    try {
      const auth = getAuth(firebaseApp);
      const cleanCnic = regData.cnic.replace(/[^0-9]/g, '');
      if (!cleanCnic) throw new Error("Please enter a valid CNIC numbers only.");
      const email = `${cleanCnic}@zwananjawkhela.com`;
      
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, regData.password);
      } catch (authError: any) {
        throw new Error(authError.message);
      }
      
      const memberData = {
        name: regData.name,
        fatherName: regData.fatherName,
        cnic: cleanCnic,
        phone: regData.phone,
        address: regData.address,
        bloodGroup: regData.bloodGroup,
        status: 'pending',
        role: 'member',
        createdAt: new Date().toISOString()
      };
      
      try {
        await setDoc(doc(db, 'members', userCredential.user.uid), memberData);
      } catch (dbError: any) {
        // If database write fails (e.g. missing permissions), clean up the auth user to prevent orphan accounts
        if (userCredential && userCredential.user) {
          await deleteUser(userCredential.user);
        }
        if (dbError.code === 'permission-denied') {
          throw new Error("Firestore Rules are blocking writes. Please update your Firebase Security Rules.");
        }
        throw new Error(dbError.message);
      }

      setRegMessage({ type: 'success', text: 'Registration successful! Your application is pending admin approval.' });
      setRegData({ name: '', fatherName: '', cnic: '', phone: '', address: '', bloodGroup: 'A+', password: '' });
    } catch (error: any) {
      setRegMessage({ type: 'error', text: 'Registration failed: ' + error.message });
    }
    setIsSubmitting(false);
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('register')}
            className={`${activeTab === 'register' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Registration
          </button>
          {user && (user.role === 'admin' || user.role === 'superadmin') && (
            <button
              onClick={() => setActiveTab('directory')}
              className={`${activeTab === 'directory' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Member Directory
            </button>
          )}
          {user && user.status === 'approved' && (
            <button
              onClick={() => setActiveTab('card')}
              className={`${activeTab === 'card' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My ID Card
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'register' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Membership Application</h2>
          <p className="text-gray-500 mb-6 text-sm">Membership is exclusively for residents and families of Jawkhela. All applications are subject to cabinet approval.</p>
          
          <form className="space-y-6" onSubmit={handleRegister}>
            {regMessage.text && (
              <div className={`p-4 rounded-md text-sm font-medium ${regMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {regMessage.text}
              </div>
            )}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                <input required value={regData.fatherName} onChange={e => setRegData({...regData, fatherName: e.target.value})} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CNIC / ID Number</label>
                <input required value={regData.cnic} onChange={e => setRegData({...regData, cnic: e.target.value})} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone / WhatsApp</label>
                <input required value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address in Jawkhela</label>
                <input required value={regData.address} onChange={e => setRegData({...regData, address: e.target.value})} type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <select value={regData.bloodGroup} onChange={e => setRegData({...regData, bloodGroup: e.target.value})} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Password</label>
                <input required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} type="password" placeholder="Create a strong password" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Upload Photo</label>
                <input type="file" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>
            <div>
              <button disabled={isSubmitting} type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'directory' && user && (user.role === 'admin' || user.role === 'superadmin') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or blood group..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredMembers.map(member => (
                <li key={member.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                      {member.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-primary-600 truncate">{member.name}</p>
                      <p className="text-sm text-gray-500 truncate">S/O {member.fatherName} • {member.address}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex items-center gap-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {member.bloodGroup}
                    </span>
                    <span className="text-sm text-gray-500 hidden sm:block">{member.id}</span>
                  </div>
                </li>
              ))}
              {filteredMembers.length === 0 && (
                <li className="p-8 text-center text-gray-500">No members found matching your search.</li>
              )}
            </ul>
          </div>
        </motion.div>
      )}

      {activeTab === 'card' && user && user.status === 'approved' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
          <div className="bg-white w-[350px] rounded-xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="bg-primary-900 text-white p-4 text-center relative">
              <div className="flex justify-center mb-3">
                <div className="bg-white p-1 rounded-lg shadow-sm">
                  <Logo src="/IMG_0342.jpeg" alt="Logo" className="h-10 w-10 object-contain" />
                </div>
              </div>
              <h3 className="font-bold font-urdu text-xl tracking-wider">Zwanan Jawkhela</h3>
              <p className="text-xs text-primary-200">Official Membership Card</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 border-4 border-white shadow-sm flex items-center justify-center text-3xl text-gray-500 font-bold">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">S/O {user.fatherName}</p>
              
              <div className="w-full mt-6 space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Member ID</span><span className="font-semibold">{user.id}</span></div>
                <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Blood Group</span><span className="font-semibold text-red-600">{user.bloodGroup}</span></div>
                <div className="flex justify-between border-b pb-1"><span className="text-gray-500">CNIC</span><span className="font-semibold">{user.cnic}</span></div>
                <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Valid Till</span><span className="font-semibold">{user.validUntil}</span></div>
              </div>
              
              <div className="mt-6 p-2 bg-gray-50 rounded-lg">
                <QRCodeSVG value={`Zwanan Jawkhela Member: ${user.id} - ${user.name}`} size={80} />
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-center">
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => downloadCardPdf(user)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"><Download className="w-4 h-4" /> Download PDF</button>
                <button onClick={() => downloadCardImage(user)} className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"><Download className="w-4 h-4" /> Download Image</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
