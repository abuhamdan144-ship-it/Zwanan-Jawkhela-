export type Role = 'guest' | 'member' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  fatherName: string;
  cnic: string;
  phone: string;
  bloodGroup: string;
  address: string;
  role: Role;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  validUntil?: string;
  canDonateBlood: boolean;
}

export const mockUsers: User[] = [
  {
    id: 'M-001',
    name: 'Ahmad Khan',
    fatherName: 'Muhammad Khan',
    cnic: '15101-1234567-1',
    phone: '0300-1234567',
    bloodGroup: 'O+',
    address: 'Main Bazar, Jawkhela',
    role: 'superadmin',
    status: 'approved',
    validUntil: '2028-12-31',
    canDonateBlood: true,
  },
  {
    id: 'M-002',
    name: 'Ali Rehman',
    fatherName: 'Abdul Rehman',
    cnic: '15101-7654321-3',
    phone: '0311-7654321',
    bloodGroup: 'A+',
    address: 'Mohallah Upper, Jawkhela',
    role: 'admin',
    status: 'approved',
    validUntil: '2028-12-31',
    canDonateBlood: false,
  },
  {
    id: 'M-003',
    name: 'Zahid Ali',
    fatherName: 'Sher Ali',
    cnic: '15101-1112233-5',
    phone: '0333-1112233',
    bloodGroup: 'B-',
    address: 'Mohallah Lower, Jawkhela',
    role: 'member',
    status: 'approved',
    validUntil: '2025-06-30',
    canDonateBlood: true,
  },
  {
    id: 'M-004',
    name: 'Usman Ghani',
    fatherName: 'Fazal Ghani',
    cnic: '15101-9998877-9',
    phone: '0345-9998877',
    bloodGroup: 'O-',
    address: 'Fields side, Jawkhela',
    role: 'member',
    status: 'pending',
    canDonateBlood: true,
  }
];

export const mockCabinet = [
  { id: '1', userId: 'M-001', position: 'President', email: 'president@zwananjawkhela.org' },
  { id: '2', userId: 'M-002', position: 'General Secretary', email: 'gsec@zwananjawkhela.org' }
];

export type NewsCategory = 'Death' | 'Marriage' | 'Nikah' | 'Engagement' | 'Announcement';

export interface NewsPost {
  id: string;
  title: string;
  titleUrdu?: string;
  category: NewsCategory;
  date: string;
  description: string;
  descriptionUrdu?: string;
  namesInvolved?: string[];
  photoUrl?: string;
  comments: { id: string, authorName: string, text: string, date: string }[];
}

export const mockNews: NewsPost[] = [
  {
    id: 'N-1',
    title: 'Marriage Ceremony of Usman',
    titleUrdu: 'عثمان کی شادی کی تقریب',
    category: 'Marriage',
    date: '2024-05-15',
    description: 'We congratulate Usman on his marriage and wish him a happy life.',
    descriptionUrdu: 'ہم عثمان کو ان کی شادی پر مبارکباد دیتے ہیں اور ان کے لیے خوشگوار زندگی کی دعا کرتے ہیں۔',
    namesInvolved: ['Usman Ghani'],
    comments: [
      { id: 'C-1', authorName: 'Zahid Ali', text: 'Mubarak ho brother!', date: '2024-05-15T10:00:00Z' }
    ]
  },
  {
    id: 'N-2',
    title: 'Sad Demise of Haji Sahib',
    titleUrdu: 'حاجی صاحب کا انتقال',
    category: 'Death',
    date: '2024-05-12',
    description: 'With profound grief, we announce the passing of Haji Sahib.',
    descriptionUrdu: 'انتہائی دکھ کے ساتھ حاجی صاحب کے انتقال کی اطلاع دی جاتی ہے۔',
    namesInvolved: ['Haji Sahib'],
    comments: [
      { id: 'C-2', authorName: 'Ahmad Khan', text: 'Inna lillahi wa inna ilayhi raji\'un', date: '2024-05-12T14:30:00Z' }
    ]
  },
  {
    id: 'N-3',
    title: 'General Body Meeting Announced',
    category: 'Announcement',
    date: '2024-05-18',
    description: 'A meeting will be held this Friday after Jummah prayers to discuss the water project.',
    comments: []
  }
];

export const mockEvents = [
  {
    id: 'E-1',
    title: 'Annual Sports Day',
    date: '2024-06-20',
    location: 'Jawkhela Ground',
    description: 'Cricket, Volleyball, and traditional games.',
  },
  {
    id: 'E-2',
    title: 'Blood Donation Drive',
    date: '2024-07-05',
    location: 'Main Health Unit, Jawkhela',
    description: 'Organized in collaboration with the district hospital.',
  }
];

export const mockDonations = [
  { id: 'D-1', donorName: 'Ahmad Khan', amount: 5000, date: '2024-05-10', purpose: 'General Welfare' },
  { id: 'D-2', donorName: 'Anonymous', amount: 2000, date: '2024-05-12', purpose: 'Water Pump Project' },
  { id: 'D-3', donorName: 'Ali Rehman', amount: 10000, date: '2024-05-15', purpose: 'Emergency Relief' },
];

export const mockPolls = [
  {
    id: 'P-1',
    title: 'Select Next Year\'s Major Project',
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    options: [
      { id: 'O-1', text: 'Water Supply Expansion', votes: 45 },
      { id: 'O-2', text: 'Street Lights Installation', votes: 30 },
      { id: 'O-3', text: 'Graveyard Boundary Wall', votes: 65 }
    ],
    voterIds: ['M-001', 'M-002', 'M-003']
  }
];

export const mockActivityFeed = [
  { id: 'A-1', imageUrl: 'https://images.unsplash.com/photo-1593113565694-c1000c021178?auto=format&fit=crop&q=80&w=800', description: 'Cleaning drive near the main stream.', date: '2024-05-17' },
  { id: 'A-2', imageUrl: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=800', description: 'Distribution of ration bags during Ramadan.', date: '2024-04-05' }
];

export const emergencyContacts = [
  { name: 'Police Station Buner', phone: '0939-510000', type: 'Police' },
  { name: 'Dr. Shahzad Clinic', phone: '0300-1111111', type: 'Doctor' },
  { name: 'Ambulance Service', phone: '1122', type: 'Ambulance' },
  { name: 'President (Ahmad Khan)', phone: '0300-1234567', type: 'Cabinet' },
];
