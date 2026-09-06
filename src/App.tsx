// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { db as firestoreDB, auth } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.warn('Firestore Error: ', errInfo.error);
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    toast('Firebase permission denied. Check your Firestore rules.', 'err');
  } else {
    toast('Firestore Error: ' + errInfo.error, 'err');
  }
}


/* =========================================================================
   ZWANAN JAWKHELA — community platform (single-file build)
   ========================================================================= */

/* ---------------- constants ---------------- */
const NS = 'zj_v1_';
const TODAY = new Date();
const iso = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
};
const isoT = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return iso(dt) + 'T' + p(dt.getHours()) + ':' + p(dt.getMinutes());
};
const shiftDate = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return d; };
const fmtDate = (s) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return s; }
};
const fmtDateTime = (s) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return s; }
};
const money = (n) => 'PKR ' + Number(n || 0).toLocaleString();
const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const hashHue = (s) => { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) % 360; return h; };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const GOLD = '#d4a843', GOLD_L = '#f5d77b';
const PALETTE = ['#d4a843', '#f5d77b', '#5b8def', '#34d399', '#f87171', '#a78bfa', '#fbbf24', '#38bdf8'];

const EVENT_TYPES = {
  Community: '#d4a843',
  Charity: '#f87171',
  Social: '#a78bfa',
  Event: '#34d399'
};

/* ---------------- storage ---------------- */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}
function writeStore(key, val) {
  try { localStorage.setItem(NS + key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}

/* localStorage-backed state that also syncs across browser tabs */
function useStore(key, initial) {
  const [val, setVal] = useState(() => {
    const stored = readStore(key, undefined);
    return stored === undefined ? initial : stored;
  });
  useEffect(() => {
    if (key === 'isAdmin') return;
    const unsub = onSnapshot(doc(firestoreDB, 'zwanan', key), (snap) => {
      if (snap.exists()) {
        setVal(snap.data());
        writeStore(key, snap.data());
      } else {
        setDoc(doc(firestoreDB, 'zwanan', key), initial).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'zwanan/' + key));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'zwanan/' + key);
    });
    return unsub;
  }, [key]);
  const setValFirebase = useCallback((updater) => {
    setVal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (key !== 'isAdmin') {
         setDoc(doc(firestoreDB, 'zwanan', key), next).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'zwanan/' + key));
      }
      writeStore(key, next);
      return next;
    });
  }, [key]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === NS + key) {
        try { setVal(e.newValue == null ? initial : JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initial]);
  return [val, setValFirebase];
}

/* ---------------- seed data ---------------- */
function seedData() {
  const d = (n) => iso(shiftDate(n));
  const cabinet = [
    { id: 'c1', name: 'Sheikh Hamdan Khan', role: 'President', phone: '0300-1234567', email: 'hamdan@zwananjawkhela.pk', bio: 'Founder & chief patron of the community alliance.', since: '2019-03-01', photo: '' },
    { id: 'c2', name: 'Sheikh Hashim Khan', role: 'Vice President', phone: '0301-2345678', email: 'hashim@zwananjawkhela.pk', bio: 'Co-founder. Leads welfare & ration drives.', since: '2019-03-01', photo: '' },
    { id: 'c3', name: 'Ali Khan', role: 'General Secretary', phone: '0302-3456789', email: 'ali@zwananjawkhela.pk', bio: 'Records, minutes and official correspondence.', since: '2019-06-15', photo: '' },
    { id: 'c4', name: 'Fatima Ahmed', role: 'Treasurer', phone: '0303-4567890', email: 'fatima@zwananjawkhela.pk', bio: 'Manages the community fund and transparent accounts.', since: '2020-01-10', photo: '' },
    { id: 'c5', name: 'Muhammad Usman', role: 'Social Media Manager', phone: '0304-5678901', email: 'usman@zwananjawkhela.pk', bio: 'Runs outreach, announcements and village pages.', since: '2021-02-20', photo: '' },
    { id: 'c6', name: 'Sara Malik', role: 'Youth Coordinator', phone: '0305-6789012', email: 'sara@zwananjawkhela.pk', bio: 'Sports days, tournaments and youth mentorship.', since: '2022-04-05', photo: '' },
    { id: 'c7', name: 'Omar Hashim', role: 'Community Outreach Lead', phone: '0306-7890123', email: 'omar@zwananjawkhela.pk', bio: 'Neighbourhood liaison and dispute mediation.', since: '2022-09-12', photo: '' }
  ];
  const donors = [
    { id: 'd1', name: 'Bilal Ahmed', group: 'A+', contact: '0311-1000001', last: d(-14), status: 'Available', city: 'Main Bazaar' },
    { id: 'd2', name: 'Usman Ghani', group: 'A-', contact: '0311-1000002', last: d(-95), status: 'Available', city: 'Neighbourhood 4' },
    { id: 'd3', name: 'Kamran Aslam', group: 'B+', contact: '0312-1000003', last: d(-30), status: 'Available', city: 'Canal Road' },
    { id: 'd4', name: 'Zoya Bibi', group: 'B-', contact: '0313-1000004', last: d(-210), status: 'Available', city: 'Old Colony' },
    { id: 'd5', name: 'Hamza Iqbal', group: 'AB+', contact: '0314-1000005', last: d(-8), status: 'Recent donor', city: 'Main Bazaar' },
    { id: 'd6', name: 'Nadia Shah', group: 'AB-', contact: '0315-1000006', last: d(-180), status: 'Available', city: 'Hospital Lane' },
    { id: 'd7', name: 'Sajid Ali', group: 'O+', contact: '0316-1000007', last: d(-45), status: 'Available', city: 'Neighbourhood 2' },
    { id: 'd8', name: 'Rukhsana Bibi', group: 'O-', contact: '0317-1000008', last: d(-120), status: 'Available', city: 'Old Colony' },
    { id: 'd9', name: 'Faisal Mehmood', group: 'A+', contact: '0318-1000009', last: d(-5), status: 'Recent donor', city: 'Canal Road' },
    { id: 'd10', name: 'Tariq Javed', group: 'B+', contact: '0319-1000010', last: d(-70), status: 'Available', city: 'Hospital Lane' }
  ];
  const complaints = [
    { id: 'r1', ref: 'ZJ-CMP-4821', name: 'Rashid Mehmood', contact: '0321-1112223', category: 'Incident', subject: 'Street brawl near the bazaar', description: 'Two shopkeepers got into a shouting match that turned physical around 8pm. Crowd gathered, no police called.', location: 'Main Bazaar, Shop 14', date: d(-3), priority: 'High', status: 'In Progress', assigned: 'Ali Khan', notes: 'Mediated a first meeting; follow-up scheduled.', images: [] },
    { id: 'r2', ref: 'ZJ-CMP-4822', name: 'Ayesha Noor', contact: '0322-2223334', category: 'Lost & Found', subject: 'Lost kid goat near the canal', description: 'Brown and white kid goat wandered off in the afternoon. Reward offered.', location: 'Canal Road', date: d(-2), priority: 'Medium', status: 'Open', assigned: '', notes: '', images: [] },
    { id: 'r3', ref: 'ZJ-CMP-4823', name: 'Imran Safari', contact: '0323-3334445', category: 'Accident', subject: 'Motorbike collision at the turn', description: 'A motorbike skidded on the unfinished turn; rider taken to THQ hospital, minor injuries.', location: 'Bypass Turn', date: d(-5), priority: 'Critical', status: 'Resolved', assigned: 'Omar Hashim', notes: 'Traffic cones placed. District notified about the pending carpeting.', images: [] },
    { id: 'r4', ref: 'ZJ-CMP-4824', name: 'Nasreen Bibi', contact: '0324-4445556', category: 'General', subject: 'Request for a community clean water point', description: 'Families in Neighbourhood 4 want a shared filtration point near the mosque.', location: 'Neighbourhood 4', date: d(-1), priority: 'Low', status: 'Open', assigned: '', notes: '', images: [] },
    { id: 'r5', ref: 'ZJ-CMP-4825', name: 'Khalid Sheikh', contact: '0325-5556667', category: 'Property', subject: 'Encroachment on shared alley', description: 'Neighbour extended a wall into the shared alley, blocking the water channel.', location: 'Old Colony, Lane 3', date: d(-7), priority: 'High', status: 'In Progress', assigned: 'Sheikh Hamdan Khan', notes: 'Site visit done; requested measurements from the union council.', images: [] }
  ];
  const transactions = [
    { id: 't1', type: 'Income', category: 'Donations', amount: 25000, description: 'Monthly donation drive — Phase 1', date: d(-24), by: 'Fatima Ahmed' },
    { id: 't2', type: 'Expense', category: 'Charity', amount: 12000, description: 'Ramadan ration packs for 40 families', date: d(-18), by: 'Sheikh Hashim Khan' },
    { id: 't3', type: 'Income', category: 'Membership', amount: 8000, description: 'Annual membership fees (16 members)', date: d(-12), by: 'Ali Khan' },
    { id: 't4', type: 'Expense', category: 'Events', amount: 5500, description: 'Sports Day — trophies, water, first aid', date: d(-6), by: 'Sara Malik' },
    { id: 't5', type: 'Income', category: 'Zakat', amount: 30000, description: 'Zakat contribution from a family abroad', date: d(-2), by: 'Fatima Ahmed' }
  ];
  const polls = [
    {
      id: 'p1', title: 'Where should the next welfare project go?', description: 'Pick the project the cabinet should prioritise this quarter.',
      options: [
        { id: 'o1', text: 'Solar tube-well for the fields', votes: 34 },
        { id: 'o2', text: 'Renovate the primary school', votes: 51 },
        { id: 'o3', text: 'Community health clinic', votes: 28 },
        { id: 'o4', text: 'Bore water filtration plant', votes: 19 }
      ], ends: d(9), created: d(-6)
    },
    {
      id: 'p2', title: 'Weekly community majlis — which evening?', description: 'We want the largest possible turnout. Choose the evening that suits your family.',
      options: [
        { id: 'o1', text: 'Friday after Jumma', votes: 62 },
        { id: 'o2', text: 'Saturday evening', votes: 47 },
        { id: 'o3', text: 'Sunday morning', votes: 12 }
      ], ends: d(4), created: d(-3)
    }
  ];
  const events = [
    { id: 'e1', title: 'Neighbourhood Cleanup Drive', type: 'Community', description: 'Volunteers meet at the bazaar chowk at 8am. Gloves and bags provided.', start: iso(shiftDate(5)) + 'T08:00', end: iso(shiftDate(5)) + 'T11:00', location: 'Bazaar Chowk' },
    { id: 'e2', title: 'Ramadan Ration Distribution', type: 'Charity', description: 'Ration packs for 40 registered families. Cabinet members required.', start: iso(shiftDate(12)) + 'T10:00', end: iso(shiftDate(12)) + 'T15:00', location: 'Community Hall' },
    { id: 'e3', title: 'Wedding — Fatima & Bilal', type: 'Social', description: 'Community-wide invitation. Baraat at the marquee, Walima on Sunday.', start: iso(shiftDate(19)) + 'T18:00', end: iso(shiftDate(19)) + 'T23:00', location: 'Zwanan Marquee' },
    { id: 'e4', title: 'Annual Sports Day', type: 'Event', description: 'Cricket, tug of war and races for all age groups. Prizes sponsored by the cabinet.', start: iso(shiftDate(26)) + 'T09:00', end: iso(shiftDate(26)) + 'T17:00', location: 'Village Ground' }
  ];
  const updates = [
    { id: 'u1', title: 'New community water project inaugurated', category: 'Announcement', pinned: true, date: d(-1), body: 'Alhamdulillah, the solar-powered filtration plant in Neighbourhood 2 is now operational. It will serve roughly 180 households. Maintenance rota is published on the notice board and every household contributes PKR 50 monthly.' },
    { id: 'u2', title: 'Election 2026 nominations now open', category: 'Election', pinned: true, date: d(-2), body: 'Nominations for President, General Secretary and Treasurer are open until the last day of the voting window. Submit your name and a short manifesto to the General Secretary. Only paid members in good standing may contest.' },
    { id: 'u3', title: 'Blood donation camp with THQ Hospital', category: 'Health', pinned: false, date: d(-4), body: 'A mobile blood donation camp will be set up at the community hall. Bring water and a light breakfast. O− and B− donors are especially needed — three patients are currently waiting.' },
    { id: 'u4', title: 'Winter ration drive — volunteers wanted', category: 'Welfare', pinned: false, date: d(-8), body: 'The cabinet has approved PKR 12,000 for winter ration packs. We need eight volunteers for packing and delivery on the announced date. Sign up through the Donations tab.' },
    { id: 'u5', title: 'Street lighting repaired on Canal Road', category: 'Development', pinned: false, date: d(-11), body: 'Six faulty street lights on Canal Road have been repaired and two new poles installed near the turn. Residents are asked to report outages through the Complaints portal.' },
    { id: 'u6', title: 'Weekly majlis minutes published', category: 'Minutes', pinned: false, date: d(-14), body: 'Minutes of the last community majlis — including the decisions on the school renovation and the sports day budget — are available in the Admin panel under Meeting Summaries.' }
  ];
  const donations = [
    { id: 'g1', name: 'Abdul Sattar', amount: 5000, date: d(-1), note: 'Monthly pledge', method: 'EasyPaisa' },
    { id: 'g2', name: 'Anonymous', amount: 2500, date: d(-2), note: '', method: 'EasyPaisa' },
    { id: 'g3', name: 'Bilal Family', amount: 10000, date: d(-4), note: 'For the ration drive', method: 'EasyPaisa' },
    { id: 'g4', name: 'Zeeshan Butt', amount: 1500, date: d(-6), note: '', method: 'EasyPaisa' },
    { id: 'g5', name: 'Hina Rauf', amount: 3000, date: d(-9), note: 'Zakat', method: 'EasyPaisa' }
  ];
  const elections = [
    {
      id: 'el1', title: 'Zwanan Jawkhela Cabinet Election 2026', status: 'Active',
      starts: d(-4), ends: d(8),
      positions: ['President', 'General Secretary', 'Treasurer'],
      candidates: [
        { id: 'cd1', name: 'Sheikh Hamdan Khan', position: 'President', manifesto: 'Second term: finish the water project, expand the blood bank to 200 donors and publish audited accounts every quarter.', votes: 68, color: '#d4a843', photo: '' },
        { id: 'cd2', name: 'Omar Hashim', position: 'President', manifesto: 'A community-first mandate: monthly open majlis, a formal grievance SLA and a youth apprenticeship network with local traders.', votes: 54, color: '#5b8def', photo: '' },
        { id: 'cd3', name: 'Ali Khan', position: 'General Secretary', manifesto: 'Digitise every record, publish minutes within 48 hours and keep a public, searchable archive of all decisions.', votes: 41, color: '#34d399', photo: '' },
        { id: 'cd4', name: 'Muhammad Usman', position: 'General Secretary', manifesto: 'Weekly bilingual bulletins, a WhatsApp broadcast tree and live coverage of every community event.', votes: 33, color: '#a78bfa', photo: '' },
        { id: 'cd5', name: 'Fatima Ahmed', position: 'Treasurer', manifesto: 'Double-entry bookkeeping, monthly public statements and a hard cap of 10% administrative spend.', votes: 72, color: '#f87171', photo: '' },
        { id: 'cd6', name: 'Sara Malik', position: 'Treasurer', manifesto: 'Ring-fenced youth and welfare funds, transparent bidding for all works and quarterly third-party review.', votes: 29, color: '#fbbf24', photo: '' }
      ]
    }
  ];
  const meetings = [
    { id: 'm1', title: 'Monthly Community Majlis', date: d(-9), agenda: 'Water project status, election preparations, ration drive logistics', attendees: 'Sheikh Hamdan Khan, Sheikh Hashim Khan, Ali Khan, Fatima Ahmed, Sara Malik, Omar Hashim, 22 residents', decisions: 'Approved PKR 12,000 winter ration budget. Election nominations open in 5 days. Water plant rota finalised.' },
    { id: 'm2', title: 'Emergency Welfare Committee', date: d(-20), agenda: 'Accident response review, blood bank drive, school renovation tender', attendees: 'Sheikh Hamdan Khan, Fatima Ahmed, Omar Hashim, Kamran Aslam', decisions: 'First-aid kit purchased for the bazaar. Blood camp scheduled. Three renovation bids shortlisted.' }
  ];
  const activity = [
    { id: 'a1', text: 'Fatima Ahmed recorded an income of PKR 30,000 (Zakat)', at: d(-2) },
    { id: 'a2', text: 'Ali Khan mediated complaint ZJ-CMP-4821', at: d(-3) },
    { id: 'a3', text: 'Blood camp announced for the community hall', at: d(-4) },
    { id: 'a4', text: 'Poll opened: Where should the next welfare project go?', at: d(-6) }
  ];
  return {
    v: 1,
    cabinet, donors, complaints, transactions, polls, events, updates,
    donations, elections, meetings, activity,
    emergencies: [],
    bloodRequests: [],
    votes: {},
    member: {
      name: 'Sheikh Hamdan Khan', id: 'ZJ-2026-001', joined: '2019-03-01',
      blood: 'A+', phone: '0300-1234567', photo: '', tier: 'Lifetime Patron', approved: true
    },
    memberApplications: [],
    settings: { siteName: 'Zwanan Jawkhela', tagline: 'Together We Thrive', dark: true, donationGoal: 500000, account: 'Aziz Ul Haq', accountNumber: '03429395868' }
  };
}

/* =========================================================================
   UI PRIMITIVES
   ========================================================================= */
let toastHandler = null;
function toast(msg, kind) { if (toastHandler) toastHandler(msg, kind || 'ok'); }

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  downloadBlob('\ufeff' + csv, filename, 'text/csv;charset=utf-8');
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallback());
  }
  return Promise.resolve(fallback());
  function fallback() {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove(); return ok;
    } catch (e) { return false; }
  }
}
function fileToDataURL(file, max) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        try {
          const lim = max || 720;
          const s = Math.min(1, lim / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * s);
          cv.height = Math.round(img.height * s);
          const cx = cv.getContext('2d');
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL('image/jpeg', 0.68));
        } catch (e) { resolve(reader.result); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
    const t = setTimeout(() => els.forEach((e) => e.classList.add('in')), 900);
    return () => { clearTimeout(t); io.disconnect(); };
  });
  return ref;
}

/* ---------------- small components ---------------- */
function Icon({ n, className, spin }) {
  return <i aria-hidden="true" className={'fa-solid fa-' + n + (spin ? ' spin-slow' : '') + (className ? ' ' + className : '')}></i>;
}

function Avatar({ name, photo, size, className }) {
  const s = size || 44;
  const hue = hashHue(name);
  const style = { width: s, height: s, minWidth: s, fontSize: Math.round(s * 0.34), borderRadius: '30%' };
  if (photo) {
    return <img src={photo} alt={name} loading="lazy" style={{ width: s, height: s, minWidth: s, objectFit: 'cover', borderRadius: '30%' }} className={className} />;
  }
  return (
    <div className={'flex items-center justify-center font-extrabold text-[#1a1206] shrink-0 ' + (className || '')}
      style={{ ...style, background: 'linear-gradient(135deg, hsl(' + hue + ',62%,58%), hsl(' + ((hue + 42) % 360) + ',74%,72%))' }}
      aria-hidden="true">{initials(name)}</div>
  );
}

function Field({ label, hint, required, children, className }) {
  return (
    <div className={className || ''}>
      <label className="lbl">{label}{required ? <span className="text-red-400"> *</span> : null}</label>
      {children}
      {hint ? <p className="muted text-[.7rem] mt-1">{hint}</p> : null}
    </div>
  );
}

function SectionHead({ eyebrow, title, sub, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow ? <p className="text-[.7rem] font-bold tracking-[.22em] uppercase muted mb-1">{eyebrow}</p> : null}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>
        {sub ? <p className="muted text-sm mt-1 max-w-2xl">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

function Progress({ value, max, color, height, glow }) {
  const pct = clamp((Number(value) / (Number(max) || 1)) * 100, 0, 100);
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: height || 9, background: 'rgba(148,163,184,.2)' }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
      <div className="bar-fill h-full rounded-full" style={{ width: pct + '%', background: color || 'linear-gradient(90deg,#d4a843,#f5d77b)', boxShadow: glow ? '0 0 14px rgba(212,168,67,.6)' : 'none' }} />
    </div>
  );
}

function Modal({ open, onClose, title, children, footer, wide }) {
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && box.current) {
        const f = box.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = box.current && box.current.querySelector('input,select,textarea,button');
      if (el) el.focus();
    }, 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(t);
      if (prev && prev.focus) prev.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title}
        className={'modal-body card w-full ' + (wide ? 'max-w-3xl' : 'max-w-xl') + ' my-6 p-5 sm:p-6'}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog"><Icon n="xmark" /></button>
        </div>
        <div>{children}</div>
        {footer ? <div className="flex flex-wrap gap-2 justify-end mt-6 pt-4" style={{ borderTop: '1px solid var(--line2)' }}>{footer}</div> : null}
      </div>
    </div>
  );
}

function Empty({ icon, title, text }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: 'rgba(212,168,67,.1)', border: '1px solid var(--line)' }}>
        <Icon n={icon} className="text-xl" />
      </div>
      <p className="font-bold">{title}</p>
      {text ? <p className="muted text-sm mt-1">{text}</p> : null}
    </div>
  );
}

function Confirm({ open, title, text, onYes, onNo, yesLabel }) {
  return (
    <Modal open={open} onClose={onNo} title={title || 'Are you sure?'}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onNo}>Cancel</button><button className="btn btn-red" onClick={onYes}>{yesLabel || 'Confirm'}</button></React.Fragment>}>
      <p className="muted text-sm">{text}</p>
    </Modal>
  );
}

function ChartCanvas({ type, data, options, height }) {
  const ref = useRef(null);
  const inst = useRef(null);
  const sig = JSON.stringify([type, data, options]);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (inst.current) { inst.current.destroy(); inst.current = null; }
    try {
      inst.current = new Chart(ref.current.getContext('2d'), {
        type: type,
        data: data,
        options: Object.assign({
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#93a1bd', boxWidth: 12, usePointStyle: true, font: { size: 11 } } } }
        }, options || {})
      });
    } catch (e) { /* chart optional */ }
    return () => { if (inst.current) { inst.current.destroy(); inst.current = null; } };
  }, [sig]);
  return (
    <div style={{ position: 'relative', height: height || 260 }}>
      <canvas ref={ref} aria-hidden="true"></canvas>
    </div>
  );
}

/* deterministic decorative QR-style code (inline SVG, no library) */
function QRCode({ value, size, fg }) {
  const N = 25;
  const cells = useMemo(() => {
    let h = 2166136261;
    const s = String(value || 'zwanan');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    const grid = [];
    for (let y = 0; y < N; y++) { const row = []; for (let x = 0; x < N; x++) row.push(rnd() > 0.5 ? 1 : 0); grid.push(row); }
    const finder = (ox, oy) => {
      for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) {
        const gy = oy + y, gx = ox + x;
        if (gy < 0 || gx < 0 || gy >= N || gx >= N) continue;
        const edge = (x === 0 || x === 6 || y === 0 || y === 6) && x >= 0 && y >= 0 && x < 7 && y < 7;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[gy][gx] = (edge || core) ? 1 : 0;
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (let i = 8; i < N - 8; i++) { grid[6][i] = i % 2 === 0 ? 1 : 0; grid[i][6] = i % 2 === 0 ? 1 : 0; }
    return grid;
  }, [value]);
  const px = size || 140;
  return (
    <svg width={px} height={px} viewBox={'0 0 ' + N + ' ' + N} role="img" aria-label="QR code" style={{ imageRendering: 'pixelated', borderRadius: 8, background: '#fff', padding: 0 }}>
      <rect width={N} height={N} fill="#fff" />
      {cells.map((row, y) => row.map((c, x) => (c ? <rect key={x + '-' + y} x={x} y={y} width="1" height="1" fill={fg || '#0a0e1a'} /> : null)))}
    </svg>
  );
}

/* =========================================================================
   BRANDING
   ========================================================================= */
function Logo({ size, stacked, sub }) {
  const big = size || 30;
  return (
    <div className="flex items-center gap-3">
      <img src="/zwanan-jawkhela-3d-logo.png" alt="Zwanan Jawkhela — Together We Thrive" className="h-auto max-w-[min(72vw,360px)] object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,.35)]" style={{ width: Math.max(big * 4.5, 150) }} />
    </div>
  );
}

/* =========================================================================
   HOME
   ========================================================================= */
function TaskArt({ kind }) {
  if (kind === 'clean') {
    return (
      <svg viewBox="0 0 400 225" className="w-full h-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Community cleanup illustration">
        <defs>
          <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16305c" /><stop offset="100%" stopColor="#25406e" /></linearGradient>
          <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1f6b4d" /><stop offset="100%" stopColor="#12402f" /></linearGradient>
        </defs>
        <rect width="400" height="225" fill="url(#sky1)" />
        <circle cx="330" cy="45" r="26" fill="#f5d77b" opacity=".85" />
        <circle cx="330" cy="45" r="40" fill="#f5d77b" opacity=".13" />
        <path d="M0 150 Q100 108 200 142 T400 132 V225 H0 Z" fill="url(#hill1)" />
        <path d="M0 178 Q120 150 240 176 T400 168 V225 H0 Z" fill="#0e3325" />
        <rect x="96" y="132" width="26" height="34" rx="4" fill="#d4a843" />
        <rect x="99" y="126" width="20" height="8" rx="3" fill="#f5d77b" />
        <rect x="240" y="140" width="24" height="32" rx="4" fill="#5b8def" />
        <rect x="243" y="134" width="18" height="8" rx="3" fill="#93c5fd" />
        <circle cx="170" cy="150" r="9" fill="#f3d0a8" /><rect x="163" y="160" width="14" height="26" rx="6" fill="#d4a843" />
        <circle cx="200" cy="155" r="8" fill="#e8bd97" /><rect x="194" y="164" width="12" height="22" rx="5" fill="#5b8def" />
        <circle cx="140" cy="157" r="8" fill="#f3d0a8" /><rect x="134" y="166" width="12" height="22" rx="5" fill="#a78bfa" />
      </svg>
    );
  }
  if (kind === 'blood') {
    return (
      <svg viewBox="0 0 400 225" className="w-full h-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Blood donation camp illustration">
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2a1220" /><stop offset="100%" stopColor="#4a1b2b" /></linearGradient>
          <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b6b" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
        </defs>
        <rect width="400" height="225" fill="url(#sky2)" />
        <path d="M200 34 C225 76 244 96 244 120 A44 44 0 0 1 156 120 C156 96 175 76 200 34 Z" fill="url(#drop)" />
        <path d="M200 58 C214 80 224 94 224 112 A24 24 0 0 1 176 112 C176 94 186 80 200 58 Z" fill="#fff" opacity=".16" />
        <path d="M0 168 H400 V225 H0 Z" fill="#2d0f19" />
        <path d="M40 168 L92 118 L144 168 Z" fill="#d4a843" opacity=".9" />
        <path d="M256 168 L308 118 L360 168 Z" fill="#d4a843" opacity=".9" />
        <rect x="92" y="168" width="52" height="4" fill="#f5d77b" opacity=".5" />
        <circle cx="330" cy="48" r="20" fill="#f5d77b" opacity=".28" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 225" className="w-full h-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Street light repair illustration">
      <defs>
        <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#080d1c" /><stop offset="100%" stopColor="#182a4c" /></linearGradient>
        <radialGradient id="lamp" cx="50%" cy="50%"><stop offset="0%" stopColor="#ffe89a" /><stop offset="100%" stopColor="#d4a843" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="225" fill="url(#sky3)" />
      <circle cx="60" cy="42" r="18" fill="#f5d77b" opacity=".7" />
      <circle cx="60" cy="42" r="34" fill="#f5d77b" opacity=".09" />
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={110 + i * 46} cy={30 + (i % 3) * 22} r="1.4" fill="#fff" opacity=".65" />)}
      <ellipse cx="252" cy="92" rx="72" ry="60" fill="url(#lamp)" />
      <rect x="248" y="86" width="8" height="112" rx="4" fill="#3d4a68" />
      <path d="M252 86 C252 66 236 60 220 62" stroke="#3d4a68" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M206 60 h30 l-7 16 h-16 Z" fill="#d4a843" />
      <circle cx="221" cy="80" r="6" fill="#ffe89a" />
      <path d="M0 178 H400 V225 H0 Z" fill="#050a16" />
      <path d="M0 196 H400" stroke="#d4a843" strokeWidth="2" strokeDasharray="16 14" opacity=".35" />
      <circle cx="120" cy="168" r="9" fill="#f3d0a8" /><rect x="112" y="178" width="17" height="30" rx="7" fill="#d4a843" />
    </svg>
  );
}

function Counter({ to, label, icon }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = clamp((t - start) / 1400, 0, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { raf = requestAnimationFrame(step); io.disconnect(); } });
    }, { threshold: .4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return (
    <div ref={ref} className="card card-hover p-4 sm:p-5 text-center float" style={{ animationDelay: (label.length * 90) + 'ms' }}>
      <Icon n={icon} className="text-xl mb-2" />
      <div className="text-3xl sm:text-4xl font-black gold-text tabular-nums">{n}</div>
      <div className="muted text-[.68rem] font-bold tracking-[.16em] uppercase mt-1">{label}</div>
    </div>
  );
}

const DAILY_TASKS = [
  { id: 't1', kind: 'clean', title: 'Neighbourhood Cleanup Drive', time: 'Saturday • 08:00 AM', place: 'Bazaar Chowk', body: 'Eight volunteers needed for the quarterly deep-clean. Gloves, bags and a rickshaw are provided by the cabinet.' },
  { id: 't2', kind: 'blood', title: 'Blood Donation Camp', time: 'Sunday • 10:00 AM', place: 'Community Hall', body: 'In partnership with THQ Hospital. Three patients are waiting on O− and B− donors right now.' },
  { id: 't3', kind: 'lights', title: 'Street Light Repair Crew', time: 'Daily • After Maghrib', place: 'Canal Road', body: 'Report outages, join the repair crew or sponsor a new pole. Four poles remain this month.' }
];

function Home({ db, set, go }) {
  const ref = useReveal();
  const [task, setTask] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTask((v) => (v + 1) % DAILY_TASKS.length), 5200);
    return () => clearInterval(t);
  }, []);
  const s = db.settings;
  const raised = db.donations.reduce((a, b) => a + Number(b.amount || 0), 0) + db.transactions.filter((t) => t.type === 'Income').reduce((a, b) => a + Number(b.amount || 0), 0);
  const activeDonors = db.donors.filter((d) => d.status === 'Available').length;
  const openComplaints = db.complaints.filter((c) => c.status !== 'Resolved').length;
  const activePolls = db.polls.filter((p) => new Date(p.ends) >= new Date(new Date().toDateString())).length;

  const qas = [
    { id: 'elections', label: 'Vote Now', icon: 'square-check', color: '#5b8def' },
    { id: 'blood', label: 'Donate Blood', icon: 'droplet', color: '#f87171' },
    { id: 'donations', label: 'Donate Funds', icon: 'hand-holding-heart', color: '#d4a843' },
    { id: 'emergency', label: 'SOS', icon: 'tower-broadcast', color: '#ef4444' }
  ];

  return (
    <div ref={ref}>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[1.4rem] mb-8 grain" style={{ border: '1px solid var(--line)', background: 'linear-gradient(160deg, rgba(26,42,74,.9), rgba(10,14,26,.94) 62%)' }}>
        <div className="absolute inset-0 opacity-[.18]" style={{ background: 'radial-gradient(700px 320px at 78% 8%, rgba(212,168,67,.55), transparent 62%)' }} />
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full spin-slow" style={{ border: '1px dashed rgba(212,168,67,.28)' }} />
        <div className="relative px-5 sm:px-10 py-10 sm:py-16">
          <div className="inline-flex items-center gap-2 chip chip-gold mb-5"><Icon n="circle" className="text-[.5rem]" /> COMMUNITY ALLIANCE &amp; OUTREACH</div>
          <h1 className="font-black tracking-tight leading-[.92] text-[13vw] sm:text-7xl md:text-8xl mb-2">
            <span className="shimmer block">ZWANAN</span>
            <span className="block" style={{ color: '#fff' }}>JAWKHELA</span>
          </h1>
          <p className="gold-text italic font-bold text-lg sm:text-2xl tracking-wide">“Together We Thrive”</p>
          <p className="muted text-sm mt-3 max-w-xl leading-relaxed">
            One platform for the whole village — announcements, elections, the blood bank, transparent funds,
            complaint tracking, polls, the community calendar and a 24/7 emergency chain.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {qas.map((q) => (
              <button key={q.id} onClick={() => go(q.id)}
                className="btn btn-ghost"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.color = q.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}>
                <Icon n={q.icon} /> {q.label}
              </button>
            ))}
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <button className="btn btn-gold" onClick={() => go('membership')}><Icon n="user-plus" /> New Member Registration</button>
            <div className="flex-1 min-w-[280px] max-w-sm flex items-center bg-[var(--input)] rounded-lg px-3 border border-[var(--line2)] focus-within:border-[rgba(212,168,67,.65)] focus-within:ring-2 focus-within:ring-[rgba(212,168,67,.16)] transition-all">
               <Icon n="search" className="muted mr-2" />
               <input type="text" placeholder="Search registered member CNIC/ID..." className="bg-transparent border-none w-full !outline-none !shadow-none !ring-0 focus:!ring-0 p-0 h-10" />
               <button className="icon-btn !h-7 !w-7 ml-2" onClick={() => go('membership')}><Icon n="arrow-right" /></button>
            </div>
          </div>

          {/* dedication */}
          <div className="mt-8 max-w-2xl rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: 'rgba(212,168,67,.07)', border: '1px solid rgba(212,168,67,.26)' }}>
            <Icon n="heart" className="text-[#f87171] mt-0.5" />
            <p className="text-[.78rem] leading-relaxed" style={{ color: 'var(--text)' }}>
              <span className="gold-text font-bold">Gifted with Love</span> from <b>Sheikh Hamdan Khan</b> &amp; <b>Sheikh Hashim Khan</b> to Our Beloved Village Family.
            </p>
          </div>
        </div>
      </section>

      {/* ANTI-NARCOTICS BANNER */}
      <section className="mb-10 reveal cursor-pointer" onClick={() => go('narcotics')}>
        <div className="card2 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 p-5 border-l-4 sm:border-l-0 sm:border-r-4 border-red-500 card-hover" style={{ background: 'linear-gradient(90deg, rgba(220,38,38,0.05), transparent)' }}>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Icon n="shield-halved" className="text-8xl text-red-500" />
          </div>
          <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-red-500/20 text-red-500 glow-gold" style={{ boxShadow: '0 0 0 1px rgba(220,38,38,.32), 0 0 26px rgba(220,38,38,.20)' }}>
            <Icon n="triangle-exclamation" className="text-2xl pulse-soft" />
          </div>
          <div className="flex-1 text-center sm:text-right z-10" dir="rtl" style={{ fontFamily: 'var(--font-urdu, "Noto Nastaliq Urdu", serif)' }}>
            <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 leading-relaxed drop-shadow-md">
              🚫 نوجوانو! منشیات سے بچو، اپنی اور اپنے گھر والوں کی زندگی سنوارو۔ یاد رکھو: صحت مند جسم، روشن مستقبل۔
            </p>
          </div>
          <button className="btn btn-red shrink-0 whitespace-nowrap mt-2 sm:mt-0 z-10" onClick={(e) => { e.stopPropagation(); go('narcotics'); }}>
            پیغام پڑھیں
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <Counter to={248} label="Members" icon="users" />
        <Counter to={12} label="Events" icon="calendar-check" />
        <Counter to={7} label="Projects" icon="diagram-project" />
        <Counter to={2019} label="Founded" icon="landmark" />
      </section>

      {/* CABINET SLIDER */}
      <section className="mb-10 reveal">
        <SectionHead eyebrow="Your Cabinet" title="Elected &amp; Serving"
          sub="Seven members serving the village — auto-rotating. Hover to pause."
          actions={<button className="btn btn-dark btn-sm" onClick={() => go('admin')}><Icon n="users-gear" /> Manage</button>} />
        <div className="relative card p-4 overflow-hidden marq-wrap">
          <div className="marq-track gap-4">
            {[0, 1].map((dup) => db.cabinet.map((m) => (
              <div key={dup + '-' + m.id} className="card2 card-hover p-5 w-[320px] shrink-0 flex flex-col items-center text-center">
                <Avatar name={m.name} photo={m.photo} size={120} className="mb-3 ring-2 ring-[var(--line)]" />
                <div className="min-w-0 w-full">
                  <p className="font-bold text-base truncate">{m.name}</p>
                  <p className="muted text-[.68rem] font-semibold uppercase tracking-wider truncate mb-2">{m.role}</p>
                </div>
                <p className="muted text-[.75rem] leading-relaxed line-clamp-3 mb-4 flex-1">{m.bio}</p>
                <div className="flex items-center justify-center gap-2 w-full pt-3" style={{ borderTop: '1px solid var(--line2)' }}>
                  <a className="icon-btn" href={'tel:' + m.phone.replace(/-/g, '')} aria-label={'Call ' + m.name}><Icon n="phone" /></a>
                  <a className="icon-btn" href={'mailto:' + m.email} aria-label={'Email ' + m.name}><Icon n="envelope" /></a>
                  <span className="muted text-[.65rem] ml-auto">Since {new Date(m.since).getFullYear()}</span>
                </div>
              </div>
            )))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10" style={{ background: 'linear-gradient(90deg, var(--card), transparent)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10" style={{ background: 'linear-gradient(270deg, var(--card), transparent)' }} />
        </div>
      </section>

      {/* DAILY TASKS */}
      <section className="mb-10 reveal">
        <SectionHead eyebrow="Today in the Village" title="Daily Tasks" sub="Three things the cabinet is working on right now." />
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 card overflow-hidden relative">
            <div className="relative h-48 sm:h-60 overflow-hidden">
              {DAILY_TASKS.map((t, i) => (
                <div key={t.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === task ? 1 : 0 }}>
                  <TaskArt kind={t.kind} />
                </div>
              ))}
              <div className="absolute bottom-0 inset-x-0 h-24" style={{ background: 'linear-gradient(180deg, transparent, var(--card))' }} />
            </div>
            <div className="p-5 -mt-8 relative">
              <p className="chip chip-gold mb-2"><Icon n="clock" /> {DAILY_TASKS[task].time}</p>
              <h3 className="text-xl font-extrabold">{DAILY_TASKS[task].title}</h3>
              <p className="muted text-sm mt-2 leading-relaxed">{DAILY_TASKS[task].body}</p>
              <p className="muted text-xs mt-3"><Icon n="location-dot" /> {DAILY_TASKS[task].place}</p>
              <div className="flex gap-2 mt-4">
                {DAILY_TASKS.map((t, i) => (
                  <button key={t.id} onClick={() => setTask(i)} aria-label={'Show task ' + (i + 1)}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === task ? 32 : 14, background: i === task ? GOLD : 'rgba(148,163,184,.35)' }} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            {[
              { icon: 'droplet', t: 'Blood Bank', d: activeDonors + ' active donors ready to give', to: 'blood', c: '#f87171' },
              { icon: 'square-poll-vertical', t: 'Live Polls', d: activePolls + ' polls awaiting your vote', to: 'polls', c: '#5b8def' },
              { icon: 'triangle-exclamation', t: 'Complaints', d: openComplaints + ' open cases being tracked', to: 'complaints', c: '#fbbf24' },
              { icon: 'vault', t: 'Community Fund', d: money(raised) + ' raised to date', to: 'funds', c: '#34d399' }
            ].map((x) => (
              <button key={x.t} onClick={() => go(x.to)} className="card card-hover p-4 flex items-center gap-4 text-left w-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: x.c + '1f', border: '1px solid ' + x.c + '55', color: x.c }}>
                  <Icon n={x.icon} className="text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">{x.t}</p>
                  <p className="muted text-[.75rem] truncate">{x.d}</p>
                </div>
                <Icon n="chevron-right" className="muted text-xs" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT UPDATES */}
      <section className="reveal">
        <SectionHead eyebrow="Stay Informed" title="Latest Announcements" actions={<button className="btn btn-dark btn-sm" onClick={() => go('updates')}>All updates <Icon n="arrow-right" /></button>} />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {db.updates.slice(0, 3).map((u) => (
            <article key={u.id} className="card card-hover p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="chip chip-gold">{u.category}</span>
                {u.pinned ? <span className="chip chip-red"><Icon n="thumbtack" /> Pinned</span> : null}
              </div>
              <h4 className="font-extrabold leading-snug">{u.title}</h4>
              <p className="muted text-[.78rem] mt-2 leading-relaxed line-clamp-3">{u.body}</p>
              <p className="muted text-[.68rem] mt-3">{fmtDate(u.date)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================================================
   UPDATES
   ========================================================================= */
function UpdatesPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Announcement', body: '', pinned: false });
  const cats = ['All', 'Announcement', 'Election', 'Health', 'Welfare', 'Development', 'Minutes'];
  const list = db.updates.filter((u) => filter === 'All' || u.category === filter)
    .slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date) - new Date(a.date));

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) { toast('Title and body are required', 'err'); return; }
    const item = Object.assign({ id: uid('u'), date: iso(new Date()) }, form);
    set((d) => Object.assign({}, d, { updates: [item].concat(d.updates) }));
    setForm({ title: '', category: 'Announcement', body: '', pinned: false });
    setOpen(false);
    toast('Announcement published');
  };

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Community Wire" title="Updates &amp; Announcements"
        sub="Everything the cabinet publishes, newest first."
        actions={isAdmin ? <button className="btn btn-gold" onClick={() => setOpen(true)}><Icon n="plus" /> New announcement</button> : <span className="chip chip-gray"><Icon n="lock" /> Cabinet only</span>} />

      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={'btn btn-sm ' + (filter === c ? 'btn-gold' : 'btn-ghost')}>{c}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {list.map((u) => (
          <article key={u.id} className="card card-hover p-5 reveal">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-gold">{u.category}</span>
                {u.pinned ? <span className="chip chip-red"><Icon n="thumbtack" /> Pinned</span> : null}
              </div>
              <span className="muted text-[.7rem] whitespace-nowrap">{fmtDate(u.date)}</span>
            </div>
            <h3 className="text-lg font-extrabold mt-3 leading-snug">{u.title}</h3>
            <p className="muted text-[.83rem] mt-2 leading-relaxed">{u.body}</p>
            {isAdmin ? (
              <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--line2)' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => set((d) => Object.assign({}, d, { updates: d.updates.map((x) => x.id === u.id ? Object.assign({}, x, { pinned: !x.pinned }) : x) }))}>
                  <Icon n="thumbtack" /> {u.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => { set((d) => Object.assign({}, d, { updates: d.updates.filter((x) => x.id !== u.id) })); toast('Announcement removed'); }}>
                  <Icon n="trash" /> Delete
                </button>
              </div>
            ) : null}
          </article>
        ))}
        {!list.length ? <div className="card lg:col-span-2"><Empty icon="bullhorn" title="Nothing here yet" text="No announcements in this category." /></div> : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Publish announcement"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-gold" onClick={submit}><Icon n="paper-plane" /> Publish</button></React.Fragment>}>
        <div className="space-y-4">
          <Field label="Title" required><input value={form.title} onChange={(e) => setForm(Object.assign({}, form, { title: e.target.value }))} placeholder="e.g. Water project phase 2 approved" /></Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm(Object.assign({}, form, { category: e.target.value }))}>
              {['Announcement', 'Election', 'Health', 'Welfare', 'Development', 'Minutes'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Body" required>
            <textarea rows="5" value={form.body} onChange={(e) => setForm(Object.assign({}, form, { body: e.target.value }))} placeholder="Write the full announcement…" />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm(Object.assign({}, form, { pinned: e.target.checked }))} /> Pin to the top</label>
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================================
   ELECTIONS
   ========================================================================= */
function ElectionsPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [tab, setTab] = useState('vote');
  const [confirm, setConfirm] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [cand, setCand] = useState({ name: '', position: '', manifesto: '' });
  const [nel, setNel] = useState({ title: '', starts: iso(new Date()), ends: iso(shiftDate(14)), positions: 'President, General Secretary, Treasurer' });

  const el = db.elections[0];
  const votes = db.votes || {};
  const closed = !el || el.status === 'Closed' || new Date(el.ends) < new Date(new Date().toDateString());

  const doVote = (candidate) => {
    const pos = candidate.position;
    if (votes[pos]) { toast('You already voted for ' + pos, 'err'); return; }
    set((d) => Object.assign({}, d, {
      elections: d.elections.map((e) => e.id !== el.id ? e : Object.assign({}, e, {
        candidates: e.candidates.map((c) => c.id === candidate.id ? Object.assign({}, c, { votes: Number(c.votes) + 1 }) : c)
      })),
      votes: Object.assign({}, d.votes, { [pos]: candidate.id }),
      activity: [{ id: uid('a'), text: 'A vote was cast for ' + pos + ' (' + candidate.name + ')', at: iso(new Date()) }].concat(d.activity).slice(0, 40)
    }));
    toast('Vote recorded for ' + candidate.name);
    setConfirm(null);
  };

  const byPosition = useMemo(() => {
    if (!el) return [];
    return el.positions.map((p) => {
      const cs = el.candidates.filter((c) => c.position === p);
      const total = cs.reduce((a, b) => a + Number(b.votes), 0);
      return { position: p, candidates: cs, total: total };
    });
  }, [el]);

  const topChart = useMemo(() => {
    if (!el) return null;
    return {
      labels: el.candidates.map((c) => c.name),
      datasets: [{ label: 'Votes', data: el.candidates.map((c) => c.votes), backgroundColor: el.candidates.map((c) => c.color || GOLD), borderRadius: 6, borderSkipped: false }]
    };
  }, [el]);

  if (!el) return <div className="card"><Empty icon="vote-yea" title="No election configured" text="Ask the cabinet to open one from the Admin panel." /></div>;

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Democracy" title="Elections &amp; Voting"
        sub={el.title}
        actions={
          <React.Fragment>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--line)' }}>
              {[['vote', 'Vote'], ['results', 'Results']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={'btn btn-sm rounded-none ' + (tab === k ? 'btn-gold' : 'btn-ghost')}>{l}</button>
              ))}
            </div>
            {isAdmin ? <button className="btn btn-dark btn-sm" onClick={() => setAddOpen(true)}><Icon n="user-plus" /> Add candidate</button> : null}
            {isAdmin ? <button className="btn btn-dark btn-sm" onClick={() => setNewOpen(true)}><Icon n="plus" /> New election</button> : null}
          </React.Fragment>
        } />

      <div className="card p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <span className={'chip ' + (closed ? 'chip-gray' : 'chip-green')}><Icon n={closed ? 'lock' : 'circle'} /> {el.status}</span>
            <span className="muted text-xs"><Icon n="calendar" /> {fmtDate(el.starts)} → {fmtDate(el.ends)}</span>
          </div>
          <div className="muted text-xs"><b className="gold-text text-base">{el.candidates.reduce((a, b) => a + Number(b.votes), 0)}</b> ballots cast</div>
        </div>
      </div>

      {tab === 'vote' ? (
        <div className="space-y-8">
          {byPosition.map((g) => {
            const voted = !!votes[g.position];
            return (
              <section key={g.position} className="reveal">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-extrabold">{g.position}</h3>
                  <span className={'chip ' + (voted ? 'chip-green' : 'chip-amber')}>{voted ? 'Vote recorded' : 'Awaiting your vote'}</span>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {g.candidates.map((c) => {
                    const pct = g.total ? Math.round((c.votes / g.total) * 100) : 0;
                    const mine = votes[g.position] === c.id;
                    return (
                      <div key={c.id} className="card card-hover p-5 flex flex-col">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} photo={c.photo} size={48} />
                          <div className="min-w-0">
                            <p className="font-bold truncate">{c.name}</p>
                            <p className="muted text-[.68rem] uppercase tracking-wider font-semibold truncate">{c.position}</p>
                          </div>
                          {mine ? <span className="chip chip-green ml-auto"><Icon n="check" /></span> : null}
                        </div>
                        <p className="muted text-[.78rem] mt-3 leading-relaxed flex-1">{c.manifesto}</p>
                        <div className="mt-4">
                          <div className="flex justify-between text-[.7rem] mb-1">
                            <span className="muted font-semibold">{c.votes} votes</span>
                            <span className="font-bold" style={{ color: c.color }}>{pct}%</span>
                          </div>
                          <Progress value={c.votes} max={Math.max(g.total, 1)} color={c.color} glow={mine} />
                        </div>
                        <button disabled={closed || voted} className={'btn mt-4 ' + (mine ? 'btn-gold' : 'btn-ghost')} onClick={() => setConfirm(c)}>
                          {mine ? <React.Fragment><Icon n="check" /> Your choice</React.Fragment> : closed ? <React.Fragment><Icon n="lock" /> Voting closed</React.Fragment> : <React.Fragment><Icon n="square-check" /> Vote for {c.name.split(' ').slice(-1)[0]}</React.Fragment>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-5 lg:col-span-2 reveal">
            <h3 className="font-extrabold mb-4">Overall standings</h3>
            <ChartCanvas type="bar" data={topChart} height={320} options={{
              indexAxis: 'y',
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: 'rgba(212,168,67,.08)' }, ticks: { color: '#93a1bd' } },
                y: { grid: { display: false }, ticks: { color: '#93a1bd' } }
              }
            }} />
          </div>
          <div className="space-y-3">
            {byPosition.map((g) => {
              const win = g.candidates.slice().sort((a, b) => b.votes - a.votes)[0];
              return (
                <div key={g.position} className="card p-4 reveal">
                  <p className="muted text-[.68rem] font-bold uppercase tracking-[.14em] mb-2">{g.position}</p>
                  <div className="flex items-center gap-3">
                    <Avatar name={win.name} photo={win.photo} size={40} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{win.name}</p>
                      <p className="muted text-[.7rem]">Leading with {win.votes} votes</p>
                    </div>
                    <Icon n="trophy" className="ml-auto text-[#fbbf24]" />
                  </div>
                </div>
              );
            })}
            <div className="card p-4">
              <p className="muted text-[.72rem] leading-relaxed">Results are indicative and refresh live as ballots are cast. Final tally is verified by the General Secretary on closing day.</p>
            </div>
          </div>
        </div>
      )}

      <Confirm open={!!confirm} title="Confirm your vote" yesLabel="Cast vote"
        text={confirm ? 'You are voting for ' + confirm.name + ' for ' + confirm.position + '. This cannot be changed afterwards.' : ''}
        onYes={() => { doVote(confirm); }} onNo={() => setConfirm(null)} />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add candidate"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={() => {
            if (!cand.name.trim() || !cand.position.trim()) { toast('Name and position required', 'err'); return; }
            const positions = el.positions.indexOf(cand.position) >= 0 ? el.positions : el.positions.concat([cand.position]);
            set((d) => Object.assign({}, d, {
              elections: d.elections.map((e) => e.id !== el.id ? e : Object.assign({}, e, {
                positions: positions,
                candidates: e.candidates.concat([{ id: uid('cd'), name: cand.name, position: cand.position, manifesto: cand.manifesto, votes: 0, color: PALETTE[e.candidates.length % PALETTE.length], photo: '' }])
              }))
            }));
            setCand({ name: '', position: '', manifesto: '' }); setAddOpen(false); toast('Candidate added');
          }}><Icon n="plus" /> Add</button></React.Fragment>}>
        <div className="space-y-4">
          <Field label="Candidate name" required><input value={cand.name} onChange={(e) => setCand(Object.assign({}, cand, { name: e.target.value }))} placeholder="Full name" /></Field>
          <Field label="Position" required>
            <input list="positions" value={cand.position} onChange={(e) => setCand(Object.assign({}, cand, { position: e.target.value }))} placeholder="e.g. President" />
            <datalist id="positions">{el.positions.map((p) => <option key={p} value={p} />)}</datalist>
          </Field>
          <Field label="Manifesto"><textarea rows="4" value={cand.manifesto} onChange={(e) => setCand(Object.assign({}, cand, { manifesto: e.target.value }))} placeholder="What will they do for the village?" /></Field>
        </div>
      </Modal>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Create election"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setNewOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={() => {
            if (!nel.title.trim()) { toast('Title required', 'err'); return; }
            const e = { id: uid('el'), title: nel.title, status: 'Active', starts: nel.starts, ends: nel.ends, positions: nel.positions.split(',').map((s) => s.trim()).filter(Boolean), candidates: [] };
            set((d) => Object.assign({}, d, { elections: [e].concat(d.elections) }));
            setNel({ title: '', starts: iso(new Date()), ends: iso(shiftDate(14)), positions: 'President, General Secretary, Treasurer' });
            setNewOpen(false); toast('Election created');
          }}><Icon n="plus" /> Create</button></React.Fragment>}>
        <div className="space-y-4">
          <Field label="Election title" required><input value={nel.title} onChange={(e) => setNel(Object.assign({}, nel, { title: e.target.value }))} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Starts"><input type="date" value={nel.starts} onChange={(e) => setNel(Object.assign({}, nel, { starts: e.target.value }))} /></Field>
            <Field label="Ends"><input type="date" value={nel.ends} onChange={(e) => setNel(Object.assign({}, nel, { ends: e.target.value }))} /></Field>
          </div>
          <Field label="Positions" hint="Comma separated"><input value={nel.positions} onChange={(e) => setNel(Object.assign({}, nel, { positions: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================================
   BLOOD BANK
   ========================================================================= */
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GROUP_COLORS = { 'A+': '#d4a843', 'A-': '#f5d77b', 'B+': '#5b8def', 'B-': '#93c5fd', 'AB+': '#a78bfa', 'AB-': '#c4b5fd', 'O+': '#34d399', 'O-': '#f87171' };

function BloodPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('All');
  const [open, setOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({ name: '', group: 'A+', contact: '', last: iso(new Date()), status: 'Available', city: '' });
  const [req, setReq] = useState({ name: '', contact: '', group: 'O+', units: 1, hospital: '', when: iso(new Date()), note: '' });

  const list = db.donors.filter((d) => {
    const okG = grp === 'All' || d.group === grp;
    const s = (d.name + ' ' + d.group + ' ' + d.contact + ' ' + (d.city || '')).toLowerCase();
    return okG && s.indexOf(q.toLowerCase()) >= 0;
  });
  const counts = GROUPS.map((g) => ({ g: g, n: db.donors.filter((d) => d.group === g).length }));

  const save = () => {
    if (!form.name.trim() || !form.contact.trim()) { toast('Name and contact are required', 'err'); return; }
    if (edit) {
      set((d) => Object.assign({}, d, { donors: d.donors.map((x) => x.id === edit.id ? Object.assign({}, x, form) : x) }));
      toast('Donor updated');
    } else {
      set((d) => Object.assign({}, d, { donors: d.donors.concat([Object.assign({ id: uid('d') }, form)]) }));
      toast('Donor added to the registry');
    }
    setOpen(false); setEdit(null);
    setForm({ name: '', group: 'A+', contact: '', last: iso(new Date()), status: 'Available', city: '' });
  };

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Lifesavers" title="Blood Bank Registry"
        sub="Every registered donor in the village, searchable by blood group."
        actions={<React.Fragment>
          {isAdmin ? <button className="btn btn-ghost" onClick={() => setReqOpen(true)}><Icon n="hand-holding-medical" /> Request blood</button> : null}
          {isAdmin ? <button className="btn btn-gold" onClick={() => { setEdit(null); setOpen(true); }}><Icon n="user-plus" /> Add donor</button> : null}
        </React.Fragment>} />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2 reveal">
          <h3 className="font-extrabold mb-4">Inventory by blood group</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {counts.map((c) => (
              <button key={c.g} onClick={() => setGrp(grp === c.g ? 'All' : c.g)}
                className={'rounded-lg p-2 text-center transition-all ' + (grp === c.g ? 'glow-gold' : '')}
                style={{ background: 'var(--card2)', border: '1px solid ' + (grp === c.g ? 'rgba(212,168,67,.55)' : 'var(--line2)') }}
                aria-pressed={grp === c.g}>
                <div className="font-black text-base" style={{ color: GROUP_COLORS[c.g] }}>{c.g}</div>
                <div className="muted text-[.65rem] font-bold">{c.n} donor{c.n === 1 ? '' : 's'}</div>
              </button>
            ))}
          </div>
          <div className="mt-5">
            <ChartCanvas type="doughnut" height={220} data={{
              labels: counts.map((c) => c.g),
              datasets: [{ data: counts.map((c) => c.n), backgroundColor: counts.map((c) => GROUP_COLORS[c.g]), borderColor: 'transparent', borderWidth: 0 }]
            }} options={{ cutout: '62%', plugins: { legend: { position: 'right' } } }} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="card p-5">
            <p className="muted text-[.68rem] font-bold uppercase tracking-[.14em]">Registered donors</p>
            <p className="text-4xl font-black gold-text mt-1">{db.donors.length}</p>
            <p className="muted text-xs mt-1">{db.donors.filter((d) => d.status === 'Available').length} available right now</p>
          </div>
          <div className="card p-5">
            <p className="muted text-[.68rem] font-bold uppercase tracking-[.14em] mb-3">Open requests</p>
            {db.bloodRequests.length ? db.bloodRequests.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--line2)' }}>
                <span className="chip" style={{ background: GROUP_COLORS[r.group] + '22', color: GROUP_COLORS[r.group], border: '1px solid ' + GROUP_COLORS[r.group] + '55' }}>{r.group}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{r.name}</p>
                  <p className="muted text-[.65rem] truncate">{r.hospital} • {r.units} unit(s)</p>
                </div>
                <a className="icon-btn" href={'tel:' + r.contact.replace(/-/g, '')} aria-label="Call requester"><Icon n="phone" /></a>
              </div>
            )) : <p className="muted text-sm">No open requests. Alhamdulillah.</p>}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden reveal">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Icon n="magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 muted text-xs" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, group, contact or area…" style={{ paddingLeft: '2.1rem' }} aria-label="Search donors" />
          </div>
          {grp !== 'All' ? <button className="btn btn-dark btn-sm" onClick={() => setGrp('All')}><Icon n="xmark" /> Clear {grp}</button> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Donor</th><th>Group</th><th>Contact</th><th>Area</th><th>Last donation</th><th>Status</th>{isAdmin ? <th></th> : null}</tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td><div className="flex items-center gap-2"><Avatar name={d.name} size={30} /><span className="font-semibold whitespace-nowrap">{d.name}</span></div></td>
                  <td><span className="chip" style={{ background: GROUP_COLORS[d.group] + '22', color: GROUP_COLORS[d.group], border: '1px solid ' + GROUP_COLORS[d.group] + '55' }}>{d.group}</span></td>
                  <td className="whitespace-nowrap"><a className="hover:text-[#f5d77b]" href={'tel:' + d.contact.replace(/-/g, '')}>{d.contact}</a></td>
                  <td className="muted whitespace-nowrap">{d.city || '—'}</td>
                  <td className="muted whitespace-nowrap">{fmtDate(d.last)}</td>
                  <td><span className={'chip ' + (d.status === 'Available' ? 'chip-green' : 'chip-amber')}>{d.status}</span></td>
                  {isAdmin ? (
                    <td className="whitespace-nowrap">
                      <button className="icon-btn mr-1" aria-label={'Edit ' + d.name} onClick={() => { setEdit(d); setForm({ name: d.name, group: d.group, contact: d.contact, last: d.last, status: d.status, city: d.city || '' }); setOpen(true); }}><Icon n="pen" /></button>
                      <button className="icon-btn" aria-label={'Delete ' + d.name} onClick={() => setDel(d)}><Icon n="trash" /></button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length ? <Empty icon="droplet" title="No donors match" text="Try a different blood group or search term." /> : null}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit donor' : 'Add blood donor'}
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-gold" onClick={save}><Icon n="check" /> Save</button></React.Fragment>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" required className="sm:col-span-2"><input value={form.name} onChange={(e) => setForm(Object.assign({}, form, { name: e.target.value }))} /></Field>
          <Field label="Blood group">
            <select value={form.group} onChange={(e) => setForm(Object.assign({}, form, { group: e.target.value }))}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
          </Field>
          <Field label="Contact" required><input value={form.contact} onChange={(e) => setForm(Object.assign({}, form, { contact: e.target.value }))} placeholder="03XX-XXXXXXX" /></Field>
          <Field label="Area"><input value={form.city} onChange={(e) => setForm(Object.assign({}, form, { city: e.target.value }))} placeholder="Neighbourhood" /></Field>
          <Field label="Last donation"><input type="date" value={form.last} onChange={(e) => setForm(Object.assign({}, form, { last: e.target.value }))} /></Field>
          <Field label="Status" className="sm:col-span-2">
            <select value={form.status} onChange={(e) => setForm(Object.assign({}, form, { status: e.target.value }))}>
              <option>Available</option><option>Recent donor</option><option>On hold</option>
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={reqOpen} onClose={() => setReqOpen(false)} title="Request blood"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setReqOpen(false)}>Cancel</button>
          <button className="btn btn-red" onClick={() => {
            if (!req.name.trim() || !req.contact.trim()) { toast('Name and contact required', 'err'); return; }
            set((d) => Object.assign({}, d, {
              bloodRequests: [{ id: uid('br'), created: iso(new Date()) }, req].concat(d.bloodRequests),
              activity: [{ id: uid('a'), text: 'Blood request posted for ' + req.group + ' (' + req.units + ' unit)', at: iso(new Date()) }].concat(d.activity).slice(0, 40)
            }));
            toast('Request broadcast to all matching donors');
            setReqOpen(false); setReq({ name: '', contact: '', group: 'O+', units: 1, hospital: '', when: iso(new Date()), note: '' });
          }}><Icon n="paper-plane" /> Broadcast request</button></React.Fragment>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Patient / requester" required><input value={req.name} onChange={(e) => setReq(Object.assign({}, req, { name: e.target.value }))} /></Field>
          <Field label="Contact" required><input value={req.contact} onChange={(e) => setReq(Object.assign({}, req, { contact: e.target.value }))} placeholder="03XX-XXXXXXX" /></Field>
          <Field label="Blood group">
            <select value={req.group} onChange={(e) => setReq(Object.assign({}, req, { group: e.target.value }))}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
          </Field>
          <Field label="Units"><input type="number" min="1" max="10" value={req.units} onChange={(e) => setReq(Object.assign({}, req, { units: e.target.value }))} /></Field>
          <Field label="Hospital"><input value={req.hospital} onChange={(e) => setReq(Object.assign({}, req, { hospital: e.target.value }))} placeholder="THQ Hospital" /></Field>
          <Field label="Needed by"><input type="date" value={req.when} onChange={(e) => setReq(Object.assign({}, req, { when: e.target.value }))} /></Field>
          <Field label="Notes" className="sm:col-span-2"><textarea rows="3" value={req.note} onChange={(e) => setReq(Object.assign({}, req, { note: e.target.value }))} /></Field>
        </div>
      </Modal>

      <Confirm open={!!del} title="Remove donor" yesLabel="Delete" text={del ? 'Remove ' + del.name + ' (' + del.group + ') from the registry?' : ''}
        onYes={() => { set((d) => Object.assign({}, d, { donors: d.donors.filter((x) => x.id !== del.id) })); setDel(null); toast('Donor removed'); }} onNo={() => setDel(null)} />
    </div>
  );
}

/* =========================================================================
   DONATIONS
   ========================================================================= */
function DonationsPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const s = db.settings;
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', amount: 1000, note: '' });
  const total = db.donations.reduce((a, b) => a + Number(b.amount || 0), 0)
    + db.transactions.filter((t) => t.type === 'Income').reduce((a, b) => a + Number(b.amount || 0), 0);
  const goal = Number(s.donationGoal) || 500000;
  const pct = clamp((total / goal) * 100, 0, 100);

  const doCopy = () => {
    copyText(s.accountNumber).then((ok) => {
      setCopied(true); setTimeout(() => setCopied(false), 2200);
      toast(ok ? 'EasyPaisa number copied' : 'Copy failed — number is ' + s.accountNumber, ok ? 'ok' : 'err');
    });
  };

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Give &amp; Support" title="Donations"
        sub="Every rupee is recorded in the community fund ledger and reported at the monthly majlis." />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* account card */}
        <div className="card p-6 lg:col-span-2 reveal relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(420px 200px at 90% 0%, rgba(212,168,67,.22), transparent 62%)' }} />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[.68rem] font-bold tracking-[.2em] uppercase muted">EasyPaisa Account</p>
                <p className="text-2xl sm:text-3xl font-black mt-1">{s.account}</p>
                <p className="text-xl font-extrabold gold-text tabular-nums tracking-widest mt-1" data-testid="acct">{s.accountNumber}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-xl" style={{ background: '#fff' }}><QRCode value={'easyPaisa:' + s.accountNumber} size={112} /></div>
                <span className="muted text-[.6rem] font-bold tracking-wider">SCAN TO PAY</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <button className={'btn ' + (copied ? 'btn-gold pulse-soft' : 'btn-gold')} onClick={doCopy}>
                <Icon n={copied ? 'check' : 'copy'} /> {copied ? 'Copied!' : 'Copy Number'}
              </button>
              <a className="btn btn-ghost" href={'tel:' + s.accountNumber.replace(/-/g, '')}><Icon n="phone" /> Call to donate</a>
              {isAdmin ? <button className="btn btn-ghost" onClick={() => setOpen(true)}><Icon n="plus" /> Record a donation</button> : null}
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="muted font-semibold">Goal {money(goal)}</span>
                <span className="font-bold gold-text">{pct.toFixed(1)}%</span>
              </div>
              <Progress value={total} max={goal} height={12} glow />
              <p className="muted text-xs mt-2"><b style={{ color: 'var(--text)' }}>{money(total)}</b> raised so far • {money(Math.max(goal - total, 0))} to go</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card p-5">
            <p className="muted text-[.68rem] font-bold uppercase tracking-[.14em]">Total raised</p>
            <p className="text-3xl font-black gold-text mt-1">{money(total)}</p>
            <p className="muted text-xs mt-1">{db.donations.length} direct contributions logged</p>
          </div>
          <div className="card p-5">
            <p className="muted text-[.68rem] font-bold uppercase tracking-[.14em] mb-3">Top contributors</p>
            {db.donations.slice().sort((a, b) => b.amount - a.amount).slice(0, 4).map((g) => (
              <div key={g.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--line2)' }}>
                <Avatar name={g.name} size={28} />
                <div className="min-w-0 flex-1"><p className="text-xs font-bold truncate">{g.name}</p><p className="muted text-[.65rem]">{fmtDate(g.date)}</p></div>
                <span className="text-xs font-bold gold-text whitespace-nowrap">{money(g.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden reveal">
        <div className="p-5 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-extrabold"><Icon n="receipt" className="muted mr-2" /> Recent donations</h3>
          <button className="btn btn-dark btn-sm" onClick={() => downloadCSV('zwanan-donations.csv', [['Donor', 'Amount (PKR)', 'Date', 'Method', 'Note']].concat(db.donations.map((g) => [g.name, g.amount, g.date, g.method, g.note])))}>
            <Icon n="file-csv" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Donor</th><th>Amount</th><th>Method</th><th>Note</th><th>Date</th></tr></thead>
            <tbody>
              {db.donations.map((g) => (
                <tr key={g.id}>
                  <td><div className="flex items-center gap-2"><Avatar name={g.name} size={28} /><span className="font-semibold whitespace-nowrap">{g.name}</span></div></td>
                  <td className="font-bold gold-text whitespace-nowrap">{money(g.amount)}</td>
                  <td><span className="chip chip-green">{g.method}</span></td>
                  <td className="muted">{g.note || '—'}</td>
                  <td className="muted whitespace-nowrap">{fmtDate(g.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 mt-4 reveal">
        <h3 className="font-extrabold mb-2">How to donate</h3>
        <ol className="muted text-sm space-y-2 list-decimal list-inside leading-relaxed">
          <li>Open your EasyPaisa app and choose <b style={{ color: 'var(--text)' }}>Send Money</b>.</li>
          <li>Enter the account number <b style={{ color: 'var(--text)' }}>{s.accountNumber}</b> ({s.account}).</li>
          <li>Enter the amount and use your name in the reference so the treasurer can log it.</li>
          <li>Screenshot the confirmation — the cabinet publishes receipts with the monthly statement.</li>
        </ol>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Record a donation"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-gold" onClick={() => {
            if (!form.name.trim() || Number(form.amount) <= 0) { toast('Enter a donor name and an amount', 'err'); return; }
            set((d) => Object.assign({}, d, {
              donations: [{ id: uid('g'), name: form.name, amount: Number(form.amount), note: form.note, date: iso(new Date()), method: 'EasyPaisa' }].concat(d.donations),
              transactions: [{ id: uid('t'), type: 'Income', category: 'Donations', amount: Number(form.amount), description: 'Direct donation — ' + form.name, date: iso(new Date()), by: form.name }].concat(d.transactions),
              activity: [{ id: uid('a'), text: form.name + ' donated ' + money(form.amount), at: iso(new Date()) }].concat(d.activity).slice(0, 40)
            }));
            toast('Donation recorded. JazakAllah!');
            setForm({ name: '', amount: 1000, note: '' }); setOpen(false);
          }}><Icon n="check" /> Record</button></React.Fragment>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Donor name" required className="sm:col-span-2"><input value={form.name} onChange={(e) => setForm(Object.assign({}, form, { name: e.target.value }))} placeholder="Your full name (or Anonymous)" /></Field>
          <Field label="Amount (PKR)" required><input type="number" min="1" value={form.amount} onChange={(e) => setForm(Object.assign({}, form, { amount: e.target.value }))} /></Field>
          <Field label="Note"><input value={form.note} onChange={(e) => setForm(Object.assign({}, form, { note: e.target.value }))} placeholder="e.g. Zakat, ration drive…" /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================================
   COMPLAINTS
   ========================================================================= */
const COMPLAINT_CATS = ['Incident', 'Lost & Found', 'Accident', 'General', 'Property'];
const CAT_ICON = { 'Incident': 'user-shield', 'Lost & Found': 'magnifying-glass', 'Accident': 'car-crash', 'General': 'circle-info', 'Property': 'house-lock' };
const STATUS_CHIP = { 'Open': 'chip-amber', 'In Progress': 'chip-blue', 'Resolved': 'chip-green' };
const PRIORITY_CHIP = { 'Low': 'chip-gray', 'Medium': 'chip-blue', 'High': 'chip-amber', 'Critical': 'chip-red' };

function ComplaintsPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const empty = { name: '', contact: '', category: 'General', subject: '', description: '', location: '', date: iso(new Date()), priority: 'Medium' };
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState([]);
  const [drag, setDrag] = useState(false);
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState(null);
  const [lastRef, setLastRef] = useState('');
  const fileRef = useRef(null);

  const addFiles = async (files) => {
    const arr = Array.from(files || []).filter((f) => /^image\//.test(f.type));
    if (!arr.length) return;
    if (images.length + arr.length > 5) { toast('Maximum 5 images per complaint', 'err'); return; }
    const urls = await Promise.all(arr.map((f) => fileToDataURL(f, 720)));
    setImages((prev) => prev.concat(urls.filter(Boolean)));
  };

  const submit = () => {
    if (!form.name.trim() || !form.contact.trim() || !form.subject.trim() || !form.description.trim()) {
      toast('Name, contact, subject and description are required', 'err'); return;
    }
    const ref = 'ZJ-CMP-' + Math.floor(1000 + Math.random() * 9000);
    const item = Object.assign({ id: uid('r'), ref: ref, status: 'Open', assigned: '', notes: '', images: images }, form);
    set((d) => Object.assign({}, d, {
      complaints: [item].concat(d.complaints),
      activity: [{ id: uid('a'), text: 'Complaint ' + ref + ' filed — ' + form.subject, at: iso(new Date()) }].concat(d.activity).slice(0, 40)
    }));
    setForm(empty); setImages([]); setLastRef(ref);
    toast('Complaint filed — reference ' + ref);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const list = db.complaints.filter((c) => filter === 'All' || c.status === filter);

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Voice of the Village" title="Complaint Portal"
        sub="Report incidents, accidents, lost items or property disputes. Every case gets a reference number and is tracked to resolution." />

      {lastRef ? (
        <div className="card p-4 mb-6 flex items-center gap-3" style={{ borderColor: 'rgba(52,211,153,.5)' }}>
          <Icon n="circle-check" className="text-[#34d399] text-xl" />
          <div><p className="font-bold text-sm">Complaint submitted successfully</p>
            <p className="muted text-xs">Your reference number is <b className="gold-text">{lastRef}</b> — keep it for follow-ups.</p></div>
          <button className="icon-btn ml-auto" onClick={() => setLastRef('')} aria-label="Dismiss"><Icon n="xmark" /></button>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-5 gap-4">
        {isAdmin ? (
          <div className="lg:col-span-3 card p-5 reveal">
            <h3 className="font-extrabold mb-4">File a complaint</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" required><input value={form.name} onChange={(e) => setForm(Object.assign({}, form, { name: e.target.value }))} /></Field>
              <Field label="Contact" required><input value={form.contact} onChange={(e) => setForm(Object.assign({}, form, { contact: e.target.value }))} placeholder="03XX-XXXXXXX" /></Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => setForm(Object.assign({}, form, { category: e.target.value }))}>{COMPLAINT_CATS.map((c) => <option key={c}>{c}</option>)}</select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={(e) => setForm(Object.assign({}, form, { priority: e.target.value }))}>{['Low', 'Medium', 'High', 'Critical'].map((c) => <option key={c}>{c}</option>)}</select>
              </Field>
              <Field label="Subject" required className="sm:col-span-2"><input value={form.subject} onChange={(e) => setForm(Object.assign({}, form, { subject: e.target.value }))} placeholder="Short summary" /></Field>
              <Field label="Description" required className="sm:col-span-2"><textarea rows="4" value={form.description} onChange={(e) => setForm(Object.assign({}, form, { description: e.target.value }))} placeholder="What happened? Include names, times and any witnesses." /></Field>
              <Field label="Location"><input value={form.location} onChange={(e) => setForm(Object.assign({}, form, { location: e.target.value }))} placeholder="Street, chowk, house no." /></Field>
              <Field label="Date of occurrence"><input type="date" value={form.date} onChange={(e) => setForm(Object.assign({}, form, { date: e.target.value }))} /></Field>
              <div className="sm:col-span-2">
                <span className="lbl">Evidence photos <span className="normal-case tracking-normal font-medium">(up to 5)</span></span>
                <div
                  className={'dropzone rounded-xl p-5 text-center cursor-pointer ' + (drag ? 'on' : '')}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current && fileRef.current.click()}
                  role="button" tabIndex="0"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current && fileRef.current.click(); } }}
                  aria-label="Upload evidence photos">
                  <Icon n="cloud-arrow-up" className="text-2xl mb-2" />
                  <p className="text-sm font-bold">Drag &amp; drop images here</p>
                  <p className="muted text-xs mt-1">or click to browse — JPG / PNG / WEBP</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                </div>
                {images.length ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {images.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group" style={{ border: '1px solid var(--line)' }}>
                        <img src={src} alt={'Evidence ' + (i + 1)} className="w-full h-full object-cover" />
                        <button className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[.6rem] opacity-0 group-hover:opacity-100 transition"
                          style={{ background: 'rgba(220,38,38,.9)', color: '#fff' }}
                          onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, k) => k !== i)); }}
                          aria-label={'Remove image ' + (i + 1)}><Icon n="xmark" /></button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <button className="btn btn-gold w-full mt-5" onClick={submit}><Icon n="paper-plane" /> Submit complaint</button>
          </div>
        ) : null}
        <div className={isAdmin ? "lg:col-span-2 space-y-3" : "lg:col-span-5 space-y-3 max-w-2xl"}>
          <div className="card p-5">
            <p className="muted text-[.68rem] font-bold uppercase tracking-[.14em] mb-3">Case overview</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['Open', db.complaints.filter((c) => c.status === 'Open').length, '#fbbf24'],
                ['In Progress', db.complaints.filter((c) => c.status === 'In Progress').length, '#5b8def'],
                ['Resolved', db.complaints.filter((c) => c.status === 'Resolved').length, '#34d399']].map(([l, n, c]) => (
                <div key={l} className="card2 p-3">
                  <div className="text-2xl font-black" style={{ color: c }}>{n}</div>
                  <div className="muted text-[.6rem] font-bold uppercase tracking-wider">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {['All', 'Open', 'In Progress', 'Resolved'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={'btn btn-sm ' + (filter === f ? 'btn-gold' : 'btn-ghost')}>{f}</button>
              ))}
            </div>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {list.map((c) => (
                <button key={c.id} onClick={() => setView(c)} className="card2 card-hover p-3 w-full text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon n={CAT_ICON[c.category] || 'circle-info'} className="muted text-xs" />
                    <span className="text-[.68rem] font-bold gold-text">{c.ref}</span>
                    <span className={'chip ml-auto ' + STATUS_CHIP[c.status]}>{c.status}</span>
                  </div>
                  <p className="font-bold text-[.82rem] leading-snug">{c.subject}</p>
                  <p className="muted text-[.68rem] mt-1">{c.category} • {fmtDate(c.date)} • <span className={'chip ' + PRIORITY_CHIP[c.priority] + ' py-0'}>{c.priority}</span></p>
                </button>
              ))}
              {!list.length ? <Empty icon="folder-open" title="No complaints" text="Nothing matches this filter." /> : null}
            </div>
          </div>
        </div>
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={view ? view.ref : ''} wide>
        {view ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-gold"><Icon n={CAT_ICON[view.category] || 'circle-info'} /> {view.category}</span>
              <span className={'chip ' + STATUS_CHIP[view.status]}>{view.status}</span>
              <span className={'chip ' + PRIORITY_CHIP[view.priority]}>{view.priority}</span>
            </div>
            <div>
              <h4 className="font-extrabold text-lg">{view.subject}</h4>
              <p className="muted text-sm mt-2 leading-relaxed whitespace-pre-wrap">{view.description}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="card2 p-3"><p className="lbl">Filed by</p><p className="text-sm font-semibold">{view.name}</p></div>
              <div className="card2 p-3"><p className="lbl">Contact</p><a className="text-sm font-semibold" href={'tel:' + String(view.contact).replace(/-/g, '')}>{view.contact}</a></div>
              <div className="card2 p-3"><p className="lbl">Location</p><p className="text-sm font-semibold">{view.location || '—'}</p></div>
              <div className="card2 p-3"><p className="lbl">Date</p><p className="text-sm font-semibold">{fmtDate(view.date)}</p></div>
            </div>
            {view.images && view.images.length ? (
              <div>
                <p className="lbl">Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {view.images.map((src, i) => <img key={i} src={src} alt={'Evidence ' + (i + 1)} className="w-24 h-24 object-cover rounded-lg" style={{ border: '1px solid var(--line)' }} />)}
                </div>
              </div>
            ) : null}
            {view.notes ? <div className="card2 p-3"><p className="lbl">Cabinet notes</p><p className="text-sm muted leading-relaxed">{view.notes}</p></div> : null}
            <div className="flex items-center gap-2 text-sm"><span className="lbl mb-0">Assigned to</span><span className="font-semibold">{view.assigned || 'Not assigned'}</span></div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

/* =========================================================================
   POLLS
   ========================================================================= */
function PollsPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', ends: iso(shiftDate(7)), options: ['', ''] });
  const myVotes = db.pollVotes || {};

  const active = db.polls.filter((p) => new Date(p.ends + 'T23:59') >= new Date());
  const closed = db.polls.filter((p) => new Date(p.ends + 'T23:59') < new Date());

  const vote = (poll, opt) => {
    if (myVotes[poll.id]) { toast('You already voted in this poll', 'err'); return; }
    set((d) => Object.assign({}, d, {
      polls: d.polls.map((p) => p.id !== poll.id ? p : Object.assign({}, p, { options: p.options.map((o) => o.id === opt.id ? Object.assign({}, o, { votes: Number(o.votes) + 1 }) : o) })),
      pollVotes: Object.assign({}, d.pollVotes, { [poll.id]: opt.id }),
      activity: [{ id: uid('a'), text: 'A vote was cast in “' + poll.title + '”', at: iso(new Date()) }].concat(d.activity).slice(0, 40)
    }));
    toast('Vote recorded — shukriya!');
  };

  const addOption = () => setForm(Object.assign({}, form, { options: form.options.concat(['']) }));
  const setOption = (i, v) => { const o = form.options.slice(); o[i] = v; setForm(Object.assign({}, form, { options: o })); };

  const createPoll = () => {
    const opts = form.options.map((t) => t.trim()).filter(Boolean);
    if (!form.title.trim()) { toast('Poll title is required', 'err'); return; }
    if (opts.length < 2) { toast('Add at least two options', 'err'); return; }
    const poll = { id: uid('p'), title: form.title, description: form.description, ends: form.ends, created: iso(new Date()), options: opts.map((t) => ({ id: uid('o'), text: t, votes: 0 })) };
    set((d) => Object.assign({}, d, { polls: [poll].concat(d.polls), activity: [{ id: uid('a'), text: 'Poll opened: ' + poll.title, at: iso(new Date()) }].concat(d.activity).slice(0, 40) }));
    setForm({ title: '', description: '', ends: iso(shiftDate(7)), options: ['', ''] });
    setOpen(false); toast('Poll is live');
  };

  const PollCard = ({ p }) => {
    const total = p.options.reduce((a, b) => a + Number(b.votes), 0);
    const voted = myVotes[p.id];
    const isClosed = new Date(p.ends + 'T23:59') < new Date();
    return (
      <div className="card p-5 reveal">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            <span className={'chip ' + (isClosed ? 'chip-gray' : 'chip-green')}><Icon n={isClosed ? 'lock' : 'circle'} /> {isClosed ? 'Closed' : 'Active'}</span>
            <span className="chip chip-gray">{total} votes</span>
          </div>
          <span className="muted text-[.68rem]"><Icon n="clock" /> Ends {fmtDate(p.ends)}</span>
        </div>
        <h3 className="text-lg font-extrabold mt-3 leading-snug">{p.title}</h3>
        {p.description ? <p className="muted text-sm mt-1">{p.description}</p> : null}
        <div className="space-y-2 mt-4">
          {p.options.map((o) => {
            const pct = total ? Math.round((o.votes / total) * 100) : 0;
            const mine = voted === o.id;
            return (
              <button key={o.id} disabled={isClosed || !!voted} onClick={() => vote(p, o)}
                className="w-full text-left rounded-lg p-3 transition-all relative overflow-hidden group"
                style={{ border: '1px solid ' + (mine ? 'rgba(212,168,67,.6)' : 'var(--line2)'), background: 'var(--card2)' }}
                aria-label={'Vote for ' + o.text}>
                <div className="absolute inset-y-0 left-0 transition-all bar-fill" style={{ width: (voted ? pct : 0) + '%', background: 'linear-gradient(90deg, rgba(212,168,67,.32), rgba(245,215,123,.16))' }} />
                <div className="relative flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ border: '2px solid ' + (mine ? GOLD : 'var(--muted)'), background: mine ? GOLD : 'transparent' }} />
                  <span className="text-sm font-semibold flex-1">{o.text}</span>
                  {voted ? <span className="text-sm font-black gold-text tabular-nums">{pct}%</span> : <span className="muted text-xs group-hover:text-[#f5d77b]">{isClosed ? o.votes : 'Vote'}</span>}
                </div>
              </button>
            );
          })}
        </div>
        {voted ? <p className="muted text-[.7rem] mt-3"><Icon n="circle-check" className="text-[#34d399] mr-1" /> Your vote has been recorded.</p> : null}
      </div>
    );
  };

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Community Voice" title="Polls &amp; Surveys"
        sub="One vote per member, per poll. Results update the moment you vote."
        actions={isAdmin ? <button className="btn btn-gold" onClick={() => setOpen(true)}><Icon n="plus" /> Create poll</button> : null} />

      <h3 className="text-sm font-bold uppercase tracking-[.16em] muted mb-3">Open now ({active.length})</h3>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {active.map((p) => <PollCard key={p.id} p={p} />)}
        {!active.length ? <div className="card md:col-span-2"><Empty icon="square-poll-vertical" title="No active polls" text="The cabinet opens a new survey every few weeks." /></div> : null}
      </div>

      {closed.length ? (
        <React.Fragment>
          <h3 className="text-sm font-bold uppercase tracking-[.16em] muted mb-3">Closed ({closed.length})</h3>
          <div className="grid md:grid-cols-2 gap-4">{closed.map((p) => <PollCard key={p.id} p={p} />)}</div>
        </React.Fragment>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a poll"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-gold" onClick={createPoll}><Icon n="plus" /> Publish poll</button></React.Fragment>}>
        <div className="space-y-4">
          <Field label="Poll title" required><input value={form.title} onChange={(e) => setForm(Object.assign({}, form, { title: e.target.value }))} placeholder="e.g. Which road should we repair first?" /></Field>
          <Field label="Description"><textarea rows="2" value={form.description} onChange={(e) => setForm(Object.assign({}, form, { description: e.target.value }))} /></Field>
          <Field label="End date"><input type="date" value={form.ends} onChange={(e) => setForm(Object.assign({}, form, { ends: e.target.value }))} /></Field>
          <div>
            <span className="lbl">Options</span>
            <div className="space-y-2">
              {form.options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input value={o} onChange={(e) => setOption(i, e.target.value)} placeholder={'Option ' + (i + 1)} />
                  {form.options.length > 2 ? <button className="icon-btn" onClick={() => setForm(Object.assign({}, form, { options: form.options.filter((_, k) => k !== i) }))} aria-label="Remove option"><Icon n="trash" /></button> : null}
                </div>
              ))}
            </div>
            <button className="btn btn-dark btn-sm mt-2" onClick={addOption}><Icon n="plus" /> Add option</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================================
   FUNDS
   ========================================================================= */
function FundsPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ type: 'Income', category: 'Donations', amount: '', description: '', date: iso(new Date()) });

  const income = db.transactions.filter((t) => t.type === 'Income').reduce((a, b) => a + Number(b.amount), 0);
  const expense = db.transactions.filter((t) => t.type === 'Expense').reduce((a, b) => a + Number(b.amount), 0);
  const balance = income - expense;
  const list = db.transactions.filter((t) => filter === 'All' || t.type === filter).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const cats = useMemo(() => {
    const m = {};
    db.transactions.forEach((t) => { m[t.category] = (m[t.category] || 0) + Number(t.amount); });
    return Object.keys(m).map((k) => ({ name: k, value: m[k] }));
  }, [db.transactions]);

  const addTx = () => {
    if (!form.amount || Number(form.amount) <= 0 || !form.description.trim()) { toast('Amount and description are required', 'err'); return; }
    const tx = { id: uid('t'), type: form.type, category: form.category, amount: Number(form.amount), description: form.description, date: form.date, by: 'Cabinet' };
    set((d) => Object.assign({}, d, {
      transactions: [tx].concat(d.transactions),
      activity: [{ id: uid('a'), text: form.type + ' recorded — ' + money(form.amount) + ' (' + form.category + ')', at: iso(new Date()) }].concat(d.activity).slice(0, 40)
    }));
    setForm({ type: 'Income', category: 'Donations', amount: '', description: '', date: iso(new Date()) });
    setOpen(false); toast('Transaction recorded');
  };

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Transparent Accounts" title="Fund Management"
        sub="Income and expenditure of the community fund, open for every member to inspect."
        actions={<React.Fragment>
          <button className="btn btn-dark btn-sm" onClick={() => downloadCSV('zwanan-fund-ledger.csv', [['Date', 'Type', 'Category', 'Amount (PKR)', 'Description', 'Recorded by']].concat(db.transactions.map((t) => [t.date, t.type, t.category, t.amount, t.description, t.by])))}><Icon n="file-csv" /> Export ledger</button>
          {isAdmin ? <button className="btn btn-gold" onClick={() => setOpen(true)}><Icon n="plus" /> Add transaction</button> : null}
        </React.Fragment>} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 reveal">
          <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#34d399' }} /><p className="muted text-[.68rem] font-bold uppercase tracking-[.14em]">Total income</p></div>
          <p className="text-2xl sm:text-3xl font-black" style={{ color: '#34d399' }}>{money(income)}</p>
        </div>
        <div className="card p-5 reveal">
          <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f87171' }} /><p className="muted text-[.68rem] font-bold uppercase tracking-[.14em]">Total expenses</p></div>
          <p className="text-2xl sm:text-3xl font-black" style={{ color: '#f87171' }}>{money(expense)}</p>
        </div>
        <div className="card p-5 reveal glow-gold">
          <div className="flex items-center gap-2 mb-2"><Icon n="vault" className="gold-text" /><p className="muted text-[.68rem] font-bold uppercase tracking-[.14em]">Current balance</p></div>
          <p className="text-2xl sm:text-3xl font-black gold-text">{money(balance)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-2 reveal">
          <h3 className="font-extrabold mb-4">Cash flow</h3>
          <ChartCanvas type="bar" height={280} data={{
            labels: db.transactions.slice().reverse().map((t) => fmtDate(t.date)),
            datasets: [
              { label: 'Income', data: db.transactions.slice().reverse().map((t) => t.type === 'Income' ? Number(t.amount) : 0), backgroundColor: 'rgba(52,211,153,.75)', borderRadius: 5 },
              { label: 'Expense', data: db.transactions.slice().reverse().map((t) => t.type === 'Expense' ? Number(t.amount) : 0), backgroundColor: 'rgba(248,113,113,.75)', borderRadius: 5 }
            ]
          }} options={{ scales: { x: { stacked: false, grid: { display: false }, ticks: { color: '#93a1bd', maxRotation: 45 } }, y: { grid: { color: 'rgba(212,168,67,.08)' }, ticks: { color: '#93a1bd' } } } }} />
        </div>
        <div className="card p-5 reveal">
          <h3 className="font-extrabold mb-4">By category</h3>
          <ChartCanvas type="pie" height={260} data={{
            labels: cats.map((c) => c.name),
            datasets: [{ data: cats.map((c) => c.value), backgroundColor: cats.map((_, i) => PALETTE[i % PALETTE.length]), borderColor: 'transparent' }]
          }} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>

      <div className="card overflow-hidden reveal">
        <div className="p-5 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-extrabold">Transaction history</h3>
          <div className="flex gap-2">
            {['All', 'Income', 'Expense'].map((f) => <button key={f} onClick={() => setFilter(f)} className={'btn btn-sm ' + (filter === f ? 'btn-gold' : 'btn-ghost')}>{f}</button>)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Recorded by</th><th className="text-right">Amount</th>{isAdmin ? <th></th> : null}</tr></thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="muted whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td><span className={'chip ' + (t.type === 'Income' ? 'chip-green' : 'chip-red')}>{t.type}</span></td>
                  <td className="whitespace-nowrap">{t.category}</td>
                  <td className="muted">{t.description}</td>
                  <td className="muted whitespace-nowrap">{t.by}</td>
                  <td className="text-right font-bold whitespace-nowrap" style={{ color: t.type === 'Income' ? '#34d399' : '#f87171' }}>
                    {t.type === 'Income' ? '+' : '−'}{money(t.amount)}
                  </td>
                  {isAdmin ? <td><button className="icon-btn" aria-label="Delete transaction" onClick={() => { set((d) => Object.assign({}, d, { transactions: d.transactions.filter((x) => x.id !== t.id) })); toast('Transaction deleted'); }}><Icon n="trash" /></button></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length ? <Empty icon="receipt" title="No transactions" text="Add the first entry to start the ledger." /> : null}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add transaction"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-gold" onClick={addTx}><Icon n="check" /> Save</button></React.Fragment>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Type">
            <select value={form.type} onChange={(e) => setForm(Object.assign({}, form, { type: e.target.value }))}><option>Income</option><option>Expense</option></select>
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm(Object.assign({}, form, { category: e.target.value }))}>
              {(form.type === 'Income' ? ['Donations', 'Membership', 'Zakat', 'Events', 'Other'] : ['Charity', 'Events', 'Maintenance', 'Administration', 'Other']).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount (PKR)" required><input type="number" min="1" value={form.amount} onChange={(e) => setForm(Object.assign({}, form, { amount: e.target.value }))} /></Field>
          <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm(Object.assign({}, form, { date: e.target.value }))} /></Field>
          <Field label="Description" required className="sm:col-span-2"><textarea rows="3" value={form.description} onChange={(e) => setForm(Object.assign({}, form, { description: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* =========================================================================
   CALENDAR
   ========================================================================= */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function CalendarPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [open, setOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'Community', description: '', location: '', start: isoT(new Date()), end: isoT(new Date(Date.now() + 3600000)) });

  const key = (d) => iso(d);
  const startOfWeek = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return x; };

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
  }, [cursor]);

  const weekCells = useMemo(() => {
    const s = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [cursor]);

  const forDay = (d) => db.events.filter((e) => key(new Date(e.start)) === key(d));

  const addEvent = () => {
    if (!form.title.trim()) { toast('Event title is required', 'err'); return; }
    set((d) => Object.assign({}, d, {
      events: d.events.concat([Object.assign({ id: uid('e') }, form)]).sort((a, b) => new Date(a.start) - new Date(b.start)),
      activity: [{ id: uid('a'), text: 'Event added to calendar — ' + form.title, at: iso(new Date()) }].concat(d.activity).slice(0, 40)
    }));
    setForm({ title: '', type: 'Community', description: '', location: '', start: isoT(new Date()), end: isoT(new Date(Date.now() + 3600000)) });
    setOpen(false); toast('Event added to the community calendar');
  };

  const AgendaRow = ({ e }) => (
    <div className="card2 card-hover p-4 flex gap-4">
      <div className="text-center shrink-0 w-14">
        <div className="text-2xl font-black gold-text">{new Date(e.start).getDate()}</div>
        <div className="muted text-[.62rem] font-bold uppercase tracking-wider">{MN[new Date(e.start).getMonth()].slice(0, 3)}</div>
      </div>
      <div className="w-1 rounded-full shrink-0" style={{ background: EVENT_TYPES[e.type] || GOLD }} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-sm">{e.title}</p>
          <span className="chip" style={{ background: (EVENT_TYPES[e.type] || GOLD) + '22', color: EVENT_TYPES[e.type] || GOLD, border: '1px solid ' + (EVENT_TYPES[e.type] || GOLD) + '55' }}>{e.type}</span>
        </div>
        {e.description ? <p className="muted text-[.76rem] mt-1 leading-relaxed">{e.description}</p> : null}
        <p className="muted text-[.68rem] mt-1"><Icon n="clock" /> {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{e.location ? ' • ' + e.location : ''}</p>
      </div>
      {isAdmin ? <button className="icon-btn ml-auto self-start" aria-label="Delete event" onClick={() => { set((d) => Object.assign({}, d, { events: d.events.filter((x) => x.id !== e.id) })); toast('Event removed'); }}><Icon n="trash" /></button> : null}
    </div>
  );

  const upcoming = db.events.slice().sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Plan Together" title="Community Calendar"
        sub="Majlis evenings, welfare drives, weddings and sports days — everything in one place."
        actions={isAdmin ? <button className="btn btn-gold" onClick={() => setOpen(true)}><Icon n="plus" /> Add event</button> : null} />

      <div className="card p-4 sm:p-5 reveal">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
          <div className="flex items-center gap-2">
            <button className="icon-btn" aria-label="Previous" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><Icon n="chevron-left" /></button>
            <button className="icon-btn" aria-label="Next" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><Icon n="chevron-right" /></button>
            <button className="btn btn-dark btn-sm" onClick={() => setCursor(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))}>Today</button>
            <h3 className="text-lg font-extrabold ml-1">{MN[cursor.getMonth()]} {cursor.getFullYear()}</h3>
          </div>
          <div className="flex rounded-lg overflow-hidden flex-wrap" style={{ border: '1px solid var(--line)' }}>
            {['month', 'week', 'day', 'agenda'].map((v) => (
              <button key={v} onClick={() => setView(v)} className={'btn btn-sm rounded-none capitalize ' + (view === v ? 'btn-gold' : 'btn-ghost')}>{v}</button>
            ))}
          </div>
        </div>

        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WD.map((d) => <div key={d} className="muted text-[.62rem] font-bold uppercase tracking-wider text-center py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((d, i) => {
                const evs = forDay(d);
                const isToday = key(d) === key(TODAY);
                const out = d.getMonth() !== cursor.getMonth();
                return (
                  <button key={i} onClick={() => { setDayOpen(d); }}
                    className="rounded-lg p-1 sm:p-2 min-h-[68px] sm:min-h-[86px] text-left transition-all hover:border-[#d4a843]"
                    style={{ background: out ? 'transparent' : 'var(--card2)', border: '1px solid ' + (isToday ? 'rgba(212,168,67,.7)' : 'var(--line2)'), opacity: out ? .4 : 1, boxShadow: isToday ? '0 0 18px rgba(212,168,67,.28)' : 'none' }}
                    aria-label={fmtDate(d) + ', ' + evs.length + ' events'}>
                    <div className={'text-[.7rem] font-bold ' + (isToday ? 'gold-text' : 'muted')}>{d.getDate()}</div>
                    <div className="space-y-0.5 mt-1 hidden sm:block">
                      {evs.slice(0, 2).map((e) => (
                        <div key={e.id} className="text-[.58rem] leading-tight px-1 py-0.5 rounded truncate" style={{ background: (EVENT_TYPES[e.type] || GOLD) + '26', color: EVENT_TYPES[e.type] || GOLD, fontWeight: 700 }}>{e.title}</div>
                      ))}
                      {evs.length > 2 ? <div className="muted text-[.55rem] font-bold">+{evs.length - 2} more</div> : null}
                    </div>
                    {evs.length ? <div className="flex gap-0.5 mt-1 sm:hidden">{evs.slice(0, 3).map((e, k) => <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: EVENT_TYPES[e.type] || GOLD }} />)}</div> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {weekCells.map((d) => {
              const evs = forDay(d);
              const isToday = key(d) === key(TODAY);
              return (
                <div key={key(d)} className="rounded-lg p-2 min-h-[120px]" style={{ background: 'var(--card2)', border: '1px solid ' + (isToday ? 'rgba(212,168,67,.7)' : 'var(--line2)') }}>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="muted text-[.62rem] font-bold uppercase">{WD[d.getDay()]}</span>
                    <span className={'font-black ' + (isToday ? 'gold-text' : '')}>{d.getDate()}</span>
                  </div>
                  {evs.length ? evs.map((e) => (
                    <div key={e.id} className="rounded p-1.5 mb-1.5" style={{ background: (EVENT_TYPES[e.type] || GOLD) + '1f', borderLeft: '3px solid ' + (EVENT_TYPES[e.type] || GOLD) }}>
                      <p className="text-[.66rem] font-bold leading-tight">{e.title}</p>
                      <p className="muted text-[.58rem]">{new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  )) : <p className="muted text-[.6rem] text-center mt-6">—</p>}
                </div>
              );
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-2">
            <p className="muted text-sm mb-2">{cursor.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {forDay(cursor).length ? forDay(cursor).map((e) => <AgendaRow key={e.id} e={e} />) : <Empty icon="calendar-day" title="Nothing scheduled" text="Use “Add event” to put something on this day." />}
          </div>
        )}

        {view === 'agenda' && (
          <div className="space-y-2">
            {upcoming.map((e) => <AgendaRow key={e.id} e={e} />)}
            {!upcoming.length ? <Empty icon="calendar" title="No events yet" /> : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 card p-4">
        <span className="lbl mb-0 mr-1 self-center">Legend</span>
        {Object.keys(EVENT_TYPES).map((t) => (
          <span key={t} className="flex items-center gap-2 text-xs font-semibold muted"><span className="w-3 h-3 rounded" style={{ background: EVENT_TYPES[t] }} /> {t}</span>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add community event"
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-gold" onClick={addEvent}><Icon n="check" /> Add event</button></React.Fragment>}>
        <div className="space-y-4">
          <Field label="Title" required><input value={form.title} onChange={(e) => setForm(Object.assign({}, form, { title: e.target.value }))} placeholder="e.g. Majlis after Isha" /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm(Object.assign({}, form, { type: e.target.value }))}>{Object.keys(EVENT_TYPES).map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="Location"><input value={form.location} onChange={(e) => setForm(Object.assign({}, form, { location: e.target.value }))} placeholder="Community Hall" /></Field>
            <Field label="Starts"><input type="datetime-local" value={form.start} onChange={(e) => setForm(Object.assign({}, form, { start: e.target.value }))} /></Field>
            <Field label="Ends"><input type="datetime-local" value={form.end} onChange={(e) => setForm(Object.assign({}, form, { end: e.target.value }))} /></Field>
          </div>
          <Field label="Description"><textarea rows="3" value={form.description} onChange={(e) => setForm(Object.assign({}, form, { description: e.target.value }))} /></Field>
        </div>
      </Modal>

      <Modal open={!!dayOpen} onClose={() => setDayOpen(null)} title={dayOpen ? dayOpen.toDateString() : ''}
        footer={isAdmin ? <button className="btn btn-gold" onClick={() => { const d = dayOpen; setOpen(true); setDayOpen(null); setForm(Object.assign({}, form, { start: isoT(d) + 'T09:00', end: isoT(d) + 'T11:00' })); }}><Icon n="plus" /> Add event here</button> : null}>
        {dayOpen ? (forDay(dayOpen).length ? forDay(dayOpen).map((e) => <AgendaRow key={e.id} e={e} />) : <Empty icon="calendar-day" title="Nothing scheduled" />) : null}
      </Modal>
    </div>
  );
}

/* =========================================================================
   EMERGENCY
   ========================================================================= */
const EMERGENCY_KINDS = ['Medical', 'Fire', 'Accident', 'Security', 'Natural Disaster', 'Other'];

function EmergencyPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [armed, setArmed] = useState(false);
  const [form, setForm] = useState({ kind: 'Medical', location: '', details: '', contact: '' });
  const [press, setPress] = useState(0);

  const contacts = [
    { name: 'Police', num: '15', icon: 'shield-halved', color: '#5b8def' },
    { name: 'Rescue 1122', num: '1122', icon: 'truck-medical', color: '#f87171' },
    { name: 'Fire Brigade', num: '16', icon: 'fire-extinguisher', color: '#fbbf24' },
    { name: 'Cabinet', num: '03429395868', icon: 'users', color: '#d4a843' }
  ];

  const trigger = () => {
    const id = uid('em');
    set((d) => Object.assign({}, d, {
      emergencies: [{ id: id, kind: 'SOS Alert', location: 'Member-triggered SOS', details: 'Emergency SOS triggered from the community app. Immediate callback required.', contact: db.settings.accountNumber, created: isoT(new Date()), status: 'Active' }].concat(d.emergencies),
      activity: [{ id: uid('a'), text: 'SOS ALARM raised — all cabinet members alerted', at: iso(new Date()) }].concat(d.activity).slice(0, 40)
    }));
    toast('SOS SENT — all 7 cabinet members alerted by SMS & call tree', 'err');
    setArmed(false); setPress(0);
  };

  const onSOS = () => {
    if (!armed) {
      setArmed(true); setPress(0);
      toast('SOS armed — press again within 4 seconds to confirm', 'err');
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    trigger();
  };

  const active = db.emergencies.filter((e) => e.status === 'Active');
  const closedList = db.emergencies.filter((e) => e.status !== 'Active');

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Aman Committee" title="Emergency Response"
        sub="One tap alerts the cabinet call tree and logs a case for the aman committee." />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 card p-6 sm:p-10 flex flex-col items-center justify-center text-center reveal relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: 'radial-gradient(320px 200px at 50% 40%, rgba(220,38,38,.7), transparent 65%)' }} />
          <p className="muted text-[.68rem] font-bold uppercase tracking-[.24em] relative mb-6">Emergency broadcast</p>
          <button onClick={onSOS}
            className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center text-white font-black sos-pulse"
            style={{ background: 'radial-gradient(circle at 35% 30%, #ff6b6b, #dc2626 55%, #7f1d1d)', border: '3px solid rgba(255,255,255,.28)' }}
            aria-label="Activate SOS emergency alert">
            <span className="text-4xl sm:text-5xl tracking-widest">SOS</span>
            <span className="text-[.6rem] font-bold tracking-[.2em] opacity-90 mt-1">{armed ? 'TAP TO CONFIRM' : 'TAP TO ARM'}</span>
          </button>
          <p className="muted text-xs mt-6 max-w-md relative">
            Pressing SOS sends your name, number and location to every cabinet member and publishes an active emergency
            on this page. Only use it for a genuine emergency.
          </p>
          {armed ? <div className="chip chip-red mt-4 relative pulse-soft"><Icon n="triangle-exclamation" /> Armed — confirm now</div> : null}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          {contacts.map((c) => (
            <a key={c.name} href={'tel:' + c.num} className="card card-hover p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.color + '1f', border: '1px solid ' + c.color + '55', color: c.color }}>
                <Icon n={c.icon} className="text-lg" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="font-black text-lg tabular-nums" style={{ color: c.color }}>{c.num}</p>
              </div>
              <Icon n="phone" className="ml-auto muted text-xs" />
            </a>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {isAdmin ? (
          <div className="card p-5 reveal">
            <h3 className="font-extrabold mb-4">Report an emergency</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.kind} onChange={(e) => setForm(Object.assign({}, form, { kind: e.target.value }))}>{EMERGENCY_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
                </Field>
                <Field label="Your contact"><input value={form.contact} onChange={(e) => setForm(Object.assign({}, form, { contact: e.target.value }))} placeholder="03XX-XXXXXXX" /></Field>
              </div>
              <Field label="Location" required><input value={form.location} onChange={(e) => setForm(Object.assign({}, form, { location: e.target.value }))} placeholder="Landmark / street / house no." /></Field>
              <Field label="What happened?" required><textarea rows="3" value={form.details} onChange={(e) => setForm(Object.assign({}, form, { details: e.target.value }))} /></Field>
              <button className="btn btn-red w-full" onClick={() => {
                if (!form.location.trim() || !form.details.trim()) { toast('Location and description are required', 'err'); return; }
                const report = { id: uid('em'), kind: form.kind, location: form.location, details: form.details, contact: form.contact || '—', created: isoT(new Date()), status: 'Active' };
                set((d) => Object.assign({}, d, {
                  emergencies: [report].concat(d.emergencies),
                  activity: [{ id: uid('a'), text: 'Emergency reported — ' + form.kind + ' at ' + form.location, at: iso(new Date()) }].concat(d.activity).slice(0, 40)
                }));
                toast('Emergency logged — cabinet notified', 'err');
                setForm({ kind: 'Medical', location: '', details: '', contact: '' });
              }}><Icon n="tower-broadcast" /> Send emergency alert</button>
            </div>
          </div>
        ) : null}
        <div className={isAdmin ? "space-y-3" : "lg:col-span-2 space-y-3 max-w-2xl"}>
          <div className="card p-5 reveal">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-soft" />
              <h3 className="font-extrabold">Active emergencies ({active.length})</h3>
            </div>
            {active.length ? active.map((e) => (
              <div key={e.id} className="card2 p-4 mb-2" style={{ borderColor: 'rgba(239,68,68,.4)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="chip chip-red">{e.kind}</span>
                  <span className="muted text-[.68rem]">{e.created}</span>
                  {isAdmin ? <button className="btn btn-sm btn-ghost ml-auto" onClick={() => { set((d) => Object.assign({}, d, { emergencies: d.emergencies.map((x) => x.id === e.id ? Object.assign({}, x, { status: 'Resolved' }) : x) })); toast('Emergency marked resolved'); }}><Icon n="check" /> Resolve</button> : null}
                </div>
                <p className="text-sm font-bold mt-2">{e.location}</p>
                <p className="muted text-[.76rem] mt-1">{e.details}</p>
                <a className="muted text-[.72rem] inline-block mt-2" href={'tel:' + String(e.contact).replace(/-/g, '')}><Icon n="phone" /> {e.contact}</a>
              </div>
            )) : <p className="muted text-sm py-4 text-center"><Icon n="circle-check" className="text-[#34d399] mr-2" />All clear. No active emergencies.</p>}
          </div>
          {closedList.length ? (
            <div className="card p-5">
              <h3 className="font-extrabold mb-3">Resolved ({closedList.length})</h3>
              {closedList.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--line2)' }}>
                  <Icon n="circle-check" className="text-[#34d399] text-xs" />
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold truncate">{e.kind} — {e.location}</p><p className="muted text-[.65rem]">{e.created}</p></div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MEMBERSHIP
   ========================================================================= */

function DigitalMemberCard({ m, flipped, setFlipped }) {
  const isInternalFlip = setFlipped === undefined;
  const [internalFlipped, setInternalFlipped] = useState(false);
  const _flipped = isInternalFlip ? internalFlipped : flipped;
  const _setFlipped = isInternalFlip ? setInternalFlipped : setFlipped;
  const frontRef = useRef(null);

  const exportCard = async (format, share = false, e) => {
    e.stopPropagation();
    if (!m.approved) return toast('Card pending approval', 'err');
    
    if (share === 'whatsapp-link') {
      const text = `*Zwanan Jawkhela Membership*\nName: ${m.name}\nMember ID: ${m.id}\nBlood Group: ${m.blood}\nContact: ${m.phone}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }

    toast(share ? 'Preparing card...' : 'Generating ' + format.toUpperCase() + '...');
    try {
      const el = frontRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#0a0e1a' });
      const filename = (m.id || 'ZJ-Card') + '.' + format;
      
      let fileData;
      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        if (!share) pdf.save(filename);
        else fileData = pdf.output('blob');
      } else {
        const type = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const imgData = canvas.toDataURL(type, 1.0);
        if (!share) {
          const link = document.createElement('a');
          link.download = filename; link.href = imgData; link.click();
        } else {
          fileData = await (await fetch(imgData)).blob();
        }
      }

      if (share && fileData) {
        const file = new File([fileData], filename, { type: fileData.type });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Zwanan Jawkhela Membership', text: 'Here is my Zwanan Jawkhela Membership Card.' });
          toast('Shared successfully', 'ok');
        } else {
          toast('Sharing not supported on this device. Downloading instead...', 'err');
          if (format === 'pdf') {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(filename);
          } else {
            const link = document.createElement('a');
            link.download = filename; link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 1.0); link.click();
          }
        }
      } else if (!share) {
        toast('Card downloaded');
      }
    } catch (e) {
      toast('Error generating card', 'err');
    }
  };

  return (
    <div className={'flip w-full ' + (_flipped ? 'on' : '')} onMouseEnter={() => _setFlipped(true)} onMouseLeave={() => _setFlipped(false)}
      onClick={() => _setFlipped((v) => !v)}>
      <div className="flip-in" style={{ aspectRatio: '1.6 / 1' }}>
        {/* FRONT */}
        <div ref={frontRef} id="membership-card-front" className="flip-face card overflow-hidden relative h-full w-full p-5 sm:p-7 flex flex-col justify-between grain"
          style={{ background: 'linear-gradient(135deg,#0a0e1a,#1a2a4a 55%,#0a0e1a)' }}>
          <div className="absolute inset-0 opacity-[.07] pointer-events-none flex items-center justify-center">
            <span className="text-[13rem] font-black">ZJ</span>
          </div>
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/zwanan-jawkhela-3d-logo.png" alt="Zwanan Jawkhela — Together We Thrive" crossOrigin="anonymous" className="h-14 w-auto max-w-[220px] object-contain" />
              <div>
                <div className="text-2xl sm:text-3xl font-black leading-none"><span className="shimmer">ZWANAN</span></div>
                <div className="text-sm sm:text-base font-extrabold tracking-[.28em]" style={{ color: '#fff' }}>JAWKHELA</div>
                <div className="muted text-[.5rem] tracking-[.14em] font-semibold mt-1">COMMUNITY ALLIANCE &amp; OUTREACH • EST. 2019</div>
              </div>
            </div>
            <span className="chip chip-gold"><Icon n="crown" /> {m.tier || 'Standard'}</span>
          </div>
          <div className="relative flex items-end gap-4 sm:gap-6">
            <Avatar name={m.name} photo={m.photo} size={90} className="shadow-lg" />
            <div className="min-w-0">
              <p className="text-white font-extrabold text-lg sm:text-2xl leading-tight truncate">{m.name || 'Member Name'}</p>
              <p className="gold-text font-bold text-xs sm:text-sm tracking-widest mt-1">{m.id || 'ZJ-XXXX'}</p>
              <p className="muted text-[.68rem] mt-1">Joined {fmtDate(m.joined || m.appliedAt || iso(new Date()))}</p>
            </div>
            <div className="ml-auto text-right hidden sm:block">
              <p className="muted text-[.58rem] font-bold uppercase tracking-[.16em]">Blood</p>
              <p className="font-black text-xl" style={{ color: GROUP_COLORS[m.blood] || GOLD }}>{m.blood || 'O+'}</p>
            </div>
          </div>
          <div className="relative pt-3" style={{ borderTop: '1px solid rgba(212,168,67,.28)' }}>
            <p className="gold-text italic text-[.7rem] font-bold">“Together We Thrive”</p>
          </div>
        </div>
        {/* BACK */}
        <div className="flip-back flip-face card overflow-hidden h-full w-full p-5 sm:p-7 flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg,#1a2a4a,#0a0e1a 60%)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="h-8 rounded mb-4" style={{ background: 'linear-gradient(90deg,#d4a843,#24365e)' }} />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="muted text-[.55rem] font-bold uppercase tracking-[.16em]">Member</p>
                  <p className="text-white font-bold text-sm truncate">{m.name || 'Member Name'}</p>
                </div>
                <div>
                  <p className="muted text-[.55rem] font-bold uppercase tracking-[.16em]">Member ID</p>
                  <p className="gold-text font-black text-sm truncate">{m.id || 'ZJ-XXXX'}</p>
                </div>
                <div>
                  <p className="muted text-[.55rem] font-bold uppercase tracking-[.16em]">Contact</p>
                  <p className="text-white text-xs font-semibold truncate">{m.phone || 'Phone Number'}</p>
                </div>
                {m.cnic && (
                <div>
                  <p className="muted text-[.55rem] font-bold uppercase tracking-[.16em]">CNIC</p>
                  <p className="text-white text-xs font-semibold truncate">{m.cnic}</p>
                </div>
                )}
                {m.address && (
                <div className="col-span-2">
                  <p className="muted text-[.55rem] font-bold uppercase tracking-[.16em]">Address</p>
                  <p className="text-white text-xs font-semibold truncate">{m.address}</p>
                </div>
                )}
              </div>
            </div>
            <div className="p-2 rounded-lg shrink-0" style={{ background: '#fff' }}>
              <QRCode value={(m.id || 'ZJ-XXXX') + '|' + (m.name || '')} size={104} />
            </div>
          </div>
          <div>
            <div className="h-9 rounded mb-3" style={{ background: 'repeating-linear-gradient(90deg,#e9eefb 0 3px,transparent 3px 6px)' }} />
            {m.approved ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn bg-green-600 text-white hover:bg-green-700 btn-sm w-full col-span-2" onClick={(e) => exportCard('jpg', true, e)}>
                <Icon n="share-nodes" /> Share Card (Image)
              </button>
              <button className="btn bg-[#25D366] text-white hover:bg-[#1DA851] btn-sm w-full col-span-2" onClick={(e) => exportCard('text', 'whatsapp-link', e)}>
                <i className="fa-brands fa-whatsapp mr-1 text-base"></i> Send WhatsApp Message
              </button>
              <button className="btn btn-gold btn-sm w-full" onClick={(e) => exportCard('png', false, e)}>
                <Icon n="download" /> PNG
              </button>
              <button className="btn btn-gold btn-sm w-full" onClick={(e) => exportCard('pdf', false, e)}>
                <Icon n="file-pdf" /> PDF
              </button>
            </div>
            ) : (
            <button className="btn btn-gray w-full opacity-50 cursor-not-allowed" onClick={(e) => { e.stopPropagation(); toast("Pending Admin Approval", "err"); }}>
              <Icon n="lock" /> Pending Approval
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MembershipPage({ db, set, isAdmin }) {
  const ref = useReveal();
  const [flipped, setFlipped] = useState(false);
  const [application, setApplication] = useState({ name: '', fatherName: '', cnic: '', phone: '', address: '', blood: 'A+', email: '', photo: '' });
  const m = db.member;
  const applications = Array.isArray(db.memberApplications) ? db.memberApplications : [];
  const update = (patch) => set((d) => Object.assign({}, d, { member: Object.assign({}, d.member, patch) }));
  const submitApplication = (event) => {
    event.preventDefault();
    if (!application.name.trim() || !application.cnic.trim() || !application.phone.trim() || !application.address.trim()) {
      toast('Name, CNIC, phone and address are required', 'err');
      return;
    }
    if (applications.some((item) => item.cnic === application.cnic.trim() && item.status === 'pending')) {
      toast('A pending application already exists for this CNIC', 'err');
      return;
    }
    const record = Object.assign({}, application, { id: uid('app'), appliedAt: iso(new Date()), status: 'pending', approved: false });
    set((d) => Object.assign({}, d, { memberApplications: [record].concat(Array.isArray(d.memberApplications) ? d.memberApplications : []) }));
    setApplication({ name: '', fatherName: '', cnic: '', phone: '', address: '', blood: 'A+', email: '', photo: '' });
    toast('Membership application saved — waiting for admin approval');
  };

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Join the alliance" title="Membership registration"
        sub="Submit your details once. Your application is saved securely and appears in the admin approval queue." />
      <form onSubmit={submitApplication} className="card p-5 sm:p-6 mb-6 reveal">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" required><input required value={application.name} onChange={(e) => setApplication(Object.assign({}, application, { name: e.target.value }))} placeholder="Your full name" /></Field>
          <Field label="Father's name"><input value={application.fatherName} onChange={(e) => setApplication(Object.assign({}, application, { fatherName: e.target.value }))} placeholder="Father's name" /></Field>
          <Field label="CNIC / ID number" required><input required value={application.cnic} onChange={(e) => setApplication(Object.assign({}, application, { cnic: e.target.value }))} placeholder="XXXXX-XXXXXXX-X" /></Field>
          <Field label="Phone / WhatsApp" required><input required value={application.phone} onChange={(e) => setApplication(Object.assign({}, application, { phone: e.target.value }))} placeholder="03XX-XXXXXXX" /></Field>
          <Field label="Email"><input type="email" value={application.email} onChange={(e) => setApplication(Object.assign({}, application, { email: e.target.value }))} placeholder="Optional email" /></Field>
          <Field label="Blood group"><select value={application.blood} onChange={(e) => setApplication(Object.assign({}, application, { blood: e.target.value }))}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Address in Jawkhela" required className="sm:col-span-2"><input required value={application.address} onChange={(e) => setApplication(Object.assign({}, application, { address: e.target.value }))} placeholder="Village, street or neighbourhood" /></Field>
          <Field label="Photo (Upload Image)" className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <Avatar name={application.name} photo={application.photo} size={54} />
              <div className="flex gap-2 flex-1">
                <label className="btn btn-ghost btn-sm flex-1 cursor-pointer">
                  <Icon n="upload" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    const url = await fileToDataURL(f, 420);
                    if (url) { setApplication(Object.assign({}, application, { photo: url })); toast('Photo updated'); }
                    e.target.value = '';
                  }} />
                </label>
                {application.photo ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setApplication(Object.assign({}, application, { photo: '' }))} aria-label="Remove photo"><Icon n="trash" /></button> : null}
              </div>
            </div>
          </Field>
        </div>
        <button type="submit" className="btn btn-gold mt-5"><Icon n="paper-plane" /> Save application for approval</button>
        {applications.filter((item) => item.cnic === application.cnic && item.status === 'pending').length > 0 ? <p className="muted text-xs mt-3">A pending application already exists for this CNIC.</p> : null}
      </form>
      <SectionHead eyebrow="Your Identity" title="Membership Card"
        sub="Hover or tap the card to flip it and access download options."
        actions={
          <button className="btn btn-ghost" onClick={() => setFlipped((v) => !v)}>
            <Icon n="rotate" /> Flip card
          </button>
        } />
      <div className="flex justify-center mb-10">
        <div className="w-full max-w-2xl reveal">
          <DigitalMemberCard m={m} flipped={flipped} setFlipped={setFlipped} />
          
          <div className="card p-5 mt-5">
             <p className="muted text-[.85rem] text-center leading-relaxed">
               Your card is the official identity of the Zwanan Jawkhela alliance. Present it at community events,
               welfare distribution points and during elections.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ADMIN
   ========================================================================= */
const ADMIN_TABS = [
  { id: 'dash', label: 'Dashboard', icon: 'gauge-high' },
  { id: 'members', label: 'Members', icon: 'users' },
  { id: 'cabinet', label: 'Cabinet', icon: 'users-gear' },
  { id: 'complaints', label: 'Complaints', icon: 'inbox' },
  { id: 'meetings', label: 'Meeting Summaries', icon: 'clipboard-list' },
  { id: 'reports', label: 'Reports', icon: 'file-export' },
  { id: 'settings', label: 'Settings', icon: 'gear' }
];

function AdminPage({ db, set, isAdmin, setAdmin, applyTheme, resetAll }) {
  const ref = useReveal();
  const [tab, setTab] = useState('dash');
  const [adminUser, setAdminUser] = useState('');
  const [adminPwd, setAdminPwd] = useState('');
  const [cm, setCm] = useState(null);
  const [cabOpen, setCabOpen] = useState(false);
  const [mForm, setMForm] = useState({ name: '', role: '', phone: '', email: '', bio: '', since: iso(new Date()), photo: '' });
  const [del, setDel] = useState(null);
  const [mt, setMt] = useState({ title: '', date: iso(new Date()), agenda: '', attendees: '', decisions: '' });
  const [confirmReset, setConfirmReset] = useState(false);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');

  const income = db.transactions.filter((t) => t.type === 'Income').reduce((a, b) => a + Number(b.amount), 0);
  const expense = db.transactions.filter((t) => t.type === 'Expense').reduce((a, b) => a + Number(b.amount), 0);
  const openComplaints = db.complaints.filter((c) => c.status !== 'Resolved').length;
  const [editApp, setEditApp] = useState(null);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [appForm, setAppForm] = useState({ name: '', fatherName: '', cnic: '', phone: '', email: '', blood: 'A+', address: '', photo: '', status: 'pending', approved: false });

  const allApplications = Array.isArray(db.memberApplications) ? db.memberApplications : [];
  const pendingApplications = allApplications.filter((item) => item.status === 'pending');

  const saveAppForm = () => {
    if (!appForm.name.trim() || !appForm.cnic.trim()) { toast('Name and CNIC are required', 'err'); return; }
    if (editApp) {
      set((d) => Object.assign({}, d, { memberApplications: (d.memberApplications || []).map((x) => x.id === editApp.id ? Object.assign({}, x, appForm) : x) }));
      toast('Member details updated');
    } else {
      const record = Object.assign({}, appForm, { id: uid('app'), appliedAt: iso(new Date()), approved: appForm.status === 'approved' });
      set((d) => Object.assign({}, d, { memberApplications: [record].concat(d.memberApplications || []) }));
      toast('Member added');
    }
    setEditApp(null); setAppModalOpen(false); setAppForm({ name: '', fatherName: '', cnic: '', phone: '', email: '', blood: 'A+', address: '', photo: '', status: 'pending', approved: false });
  };

  const saveMember = () => {
    if (!mForm.name.trim() || !mForm.role.trim()) { toast('Name and role are required', 'err'); return; }
    if (cm) {
      set((d) => Object.assign({}, d, { cabinet: d.cabinet.map((x) => x.id === cm.id ? Object.assign({}, x, mForm) : x) }));
      toast('Cabinet member updated');
    } else {
      set((d) => Object.assign({}, d, { cabinet: d.cabinet.concat([Object.assign({ id: uid('c') }, mForm)]) }));
      toast('Cabinet member added');
    }
    setCm(null); setCabOpen(false); setMForm({ name: '', role: '', phone: '', email: '', bio: '', since: iso(new Date()), photo: '' });
  };

  const exportRows = {
    members: () => [['Name', 'Role', 'Phone', 'Email', 'Since']].concat(db.cabinet.map((c) => [c.name, c.role, c.phone, c.email, c.since])),
    donors: () => [['Name', 'Blood Group', 'Contact', 'Area', 'Last Donation', 'Status']].concat(db.donors.map((d) => [d.name, d.group, d.contact, d.city, d.last, d.status])),
    complaints: () => [['Reference', 'Name', 'Contact', 'Category', 'Subject', 'Location', 'Date', 'Priority', 'Status', 'Assigned']].concat(db.complaints.map((c) => [c.ref, c.name, c.contact, c.category, c.subject, c.location, c.date, c.priority, c.status, c.assigned])),
    ledger: () => [['Date', 'Type', 'Category', 'Amount', 'Description', 'By']].concat(db.transactions.map((t) => [t.date, t.type, t.category, t.amount, t.description, t.by]))
  };

  const printReport = () => {
    setTimeout(() => window.print(), 120);
  };

  if (!isAdmin) {
    return (
      <div className="card p-10 text-center max-w-sm mx-auto mt-12">
        <Icon n="lock" className="text-4xl gold-text mb-4" />
        <h2 className="text-xl font-extrabold mb-4">Admin Login</h2>
        <div className="space-y-4 text-left">
           <Field label="Username"><input placeholder="Admin@zj.com" value={adminUser} onChange={e=>setAdminUser(e.target.value)} /></Field>
           <Field label="Password"><input type="password" placeholder="••••" value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} /></Field>
           <button className="btn btn-gold w-full" onClick={() => {
              if (adminUser.trim().toLowerCase() === 'admin@zj.com' && adminPwd.trim() === '123456') { setAdmin(true); } else { toast('Invalid credentials', 'err'); }
           }}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <SectionHead eyebrow="Control Room" title="Admin Panel"
        sub="Manage the cabinet, cases, minutes, reports and site settings."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <span className="chip chip-green"><Icon n="shield-halved" /> Admin mode active</span>
            <button className="btn btn-sm btn-ghost" onClick={() => {
              const data = Object.keys(exportRows).map(k => `${k.toUpperCase()}\n${exportRows[k]().map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')}`).join('\n\n');
              downloadBlob('\ufeff' + data, 'ZJ-All-Data-Export.csv', 'text/csv;charset=utf-8');
              toast('CSV exported successfully');
            }}><Icon n="file-csv" /> Export CSV</button>
            <button className="btn btn-sm btn-ghost" onClick={printReport}><Icon n="print" /> Print report</button>
          </div>
        } />

      <div className="flex gap-2 overflow-x-auto no-sb pb-2 mb-5">
        {ADMIN_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={'btn btn-sm ' + (tab === t.id ? 'btn-gold' : 'btn-ghost')}>
            <Icon n={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dash' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: 'Members', v: 248, i: 'users', c: '#d4a843' },
              { l: 'Fund balance', v: money(income - expense), i: 'vault', c: '#34d399', small: true },
              { l: 'Open complaints', v: openComplaints, i: 'inbox', c: '#fbbf24' },
              { l: 'Active emergencies', v: db.emergencies.filter((e) => e.status === 'Active').length, i: 'tower-broadcast', c: '#f87171' }
            ].map((s) => (
              <div key={s.l} className="card card-hover p-4 reveal">
                <Icon n={s.i} className="mb-2" />
                <div className={'font-black ' + (s.small ? 'text-xl sm:text-2xl' : 'text-3xl')} style={{ color: s.c }}>{s.v}</div>
                <div className="muted text-[.65rem] font-bold uppercase tracking-[.14em] mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="card p-5 reveal">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h3 className="font-extrabold">Membership approvals</h3><p className="muted text-xs mt-1">{pendingApplications.length} application{pendingApplications.length === 1 ? '' : 's'} waiting for review</p></div>
              <span className="chip chip-gold"><Icon n="id-card" /> Pending queue</span>
            </div>
            {pendingApplications.length ? <div className="space-y-3">{pendingApplications.map((item) => <div key={item.id} className="card2 p-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="min-w-0 flex-1"><p className="font-bold">{item.name}</p><p className="muted text-xs mt-1">CNIC: {item.cnic} • Phone: {item.phone} • Blood: {item.blood}</p><p className="muted text-xs mt-1">{item.address}</p></div>
              <div className="flex gap-2 shrink-0"><button className="btn btn-sm btn-gold" onClick={() => { set((d) => Object.assign({}, d, { memberApplications: (d.memberApplications || []).map((x) => x.id === item.id ? Object.assign({}, x, { status: 'approved', approved: true, reviewedAt: iso(new Date()) }) : x), activity: [{ id: uid('a'), text: 'Membership approved — ' + item.name, at: iso(new Date()) }].concat(d.activity || []).slice(0, 40) })); toast('Membership approved'); }}><Icon n="check" /> Approve</button><button className="btn btn-sm btn-ghost" onClick={() => { set((d) => Object.assign({}, d, { memberApplications: (d.memberApplications || []).map((x) => x.id === item.id ? Object.assign({}, x, { status: 'rejected', approved: false, reviewedAt: iso(new Date()) }) : x) })); toast('Membership application rejected'); }}><Icon n="xmark" /> Reject</button></div>
            </div>)}</div> : <div className="card2 p-5 text-center muted text-sm">No pending applications. New registrations will appear here automatically.</div>}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card p-5 reveal">
              <h3 className="font-extrabold mb-4">Recent activity</h3>
              <div className="space-y-3">
                {db.activity.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex gap-3 items-start">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: GOLD }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{a.text}</p>
                      <p className="muted text-[.68rem]">{fmtDate(a.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5 reveal">
              <h3 className="font-extrabold mb-4">Quick actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_TABS.slice(1, 6).map((t) => (
                  <button key={t.id} className="btn btn-ghost btn-sm" onClick={() => setTab(t.id)}><Icon n={t.icon} /> {t.label}</button>
                ))}
              </div>
              <div className="divider my-4" />
              <p className="muted text-[.72rem] leading-relaxed mb-3">Income {money(income)} • Expenses {money(expense)} across {db.transactions.length} ledger entries.</p>
              <ChartCanvas type="doughnut" height={150} data={{
                labels: ['Income', 'Expense'],
                datasets: [{ data: [income, expense], backgroundColor: ['rgba(52,211,153,.85)', 'rgba(248,113,113,.85)'], borderColor: 'transparent' }]
              }} options={{ cutout: '68%', plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          <SectionHead eyebrow="Community" title="All Members" sub="Manage registered members and applications." 
            actions={<button className="btn btn-gold btn-sm" onClick={() => { setEditApp(null); setAppForm({ name: '', fatherName: '', cnic: '', phone: '', email: '', blood: 'A+', address: '', photo: '', status: 'approved', approved: true }); setAppModalOpen(true); }}><Icon n="plus" /> Add Member</button>} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allApplications.map((item) => (
              <div key={item.id} className="card p-4 flex gap-3 items-center reveal relative">
                <Avatar name={item.name} photo={item.photo} size={54} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{item.name}</p>
                  <p className="muted text-[.68rem] truncate">CNIC: {item.cnic}</p>
                  <p className="muted text-[.68rem] truncate">Phone: {item.phone}</p>
                  <div className="mt-2 flex gap-2 items-center flex-wrap">
                    {item.status === 'pending' ? <span className="chip chip-gold inline-flex"><Icon n="clock" /> Pending</span> :
                     item.status === 'rejected' ? <span className="chip bg-red-500/10 text-red-500 inline-flex"><Icon n="xmark" /> Rejected</span> :
                     <span className="chip chip-gold inline-flex"><Icon n="id-badge" /> ID: {item.id.split('-')[1] || item.id}</span>}
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {item.approved && (
                    <button className="btn btn-ghost btn-sm px-2 py-1 text-yellow-500 hover:bg-yellow-500/10" aria-label="Digital Card" title="Preview Digital Card" onClick={() => { setEditApp(item); setAppForm(item); setShowCardPreview(true); setAppModalOpen(true); }}><Icon n="id-card" /></button>
                  )}
                  <button className="btn btn-ghost btn-sm px-2 py-1" aria-label="Edit" onClick={() => { setEditApp(item); setAppForm(item); setShowCardPreview(false); setAppModalOpen(true); }}><Icon n="pen" /></button>
                  <button className="btn btn-ghost btn-sm px-2 py-1 text-red-500 hover:text-red-600 hover:bg-red-500/10" aria-label="Delete" onClick={() => setDel({ type: 'application', item })}><Icon n="trash" /></button>
                </div>
              </div>
            ))}
            {allApplications.length === 0 && <div className="card p-10 col-span-full text-center muted text-sm">No members yet.</div>}
          </div>
        </div>
      )}

      {tab === 'cabinet' && (
        <div>
          <div className="flex justify-end mb-3">
            <button className="btn btn-gold" onClick={() => { setCm(null); setCabOpen(true); setMForm({ name: '', role: '', phone: '', email: '', bio: '', since: iso(new Date()), photo: '' }); }}><Icon n="plus" /> New member</button>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {db.cabinet.map((m) => (
              <div key={m.id} className="card card-hover p-5 reveal">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={m.name} photo={m.photo} size={48} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{m.name}</p>
                    <p className="muted text-[.66rem] uppercase tracking-wider font-semibold truncate">{m.role}</p>
                  </div>
                </div>
                <p className="muted text-[.74rem] line-clamp-2">{m.bio}</p>
                <p className="muted text-[.68rem] mt-2"><Icon n="phone" /> {m.phone}</p>
                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--line2)' }}>
                  <button className="btn btn-sm btn-ghost flex-1" onClick={() => { setCm(m); setCabOpen(true); setMForm({ name: m.name, role: m.role, phone: m.phone, email: m.email, bio: m.bio, since: m.since, photo: m.photo || '' }); }}><Icon n="pen" /> Edit</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setDel(m)} aria-label={'Delete ' + m.name}><Icon n="trash" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'complaints' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Ref</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned</th><th></th></tr></thead>
              <tbody>
                {db.complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="gold-text font-bold whitespace-nowrap">{c.ref}</td>
                    <td className="font-semibold max-w-[220px] truncate">{c.subject}</td>
                    <td className="muted whitespace-nowrap">{c.category}</td>
                    <td><span className={'chip ' + PRIORITY_CHIP[c.priority]}>{c.priority}</span></td>
                    <td>
                      <select value={c.status} aria-label={'Status for ' + c.ref} style={{ padding: '.3rem .5rem', fontSize: '.75rem', width: 'auto' }}
                        onChange={(e) => set((d) => Object.assign({}, d, { complaints: d.complaints.map((x) => x.id === c.id ? Object.assign({}, x, { status: e.target.value }) : x) }))}>
                        <option>Open</option><option>In Progress</option><option>Resolved</option>
                      </select>
                    </td>
                    <td>
                      <select value={c.assigned} aria-label={'Assignee for ' + c.ref} style={{ padding: '.3rem .5rem', fontSize: '.75rem', width: 'auto', maxWidth: 170 }}
                        onChange={(e) => set((d) => Object.assign({}, d, { complaints: d.complaints.map((x) => x.id === c.id ? Object.assign({}, x, { assigned: e.target.value }) : x) }))}>
                        <option value="">Not assigned</option>
                        {db.cabinet.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </td>
                    <td><button className="icon-btn" aria-label={'Notes for ' + c.ref} onClick={() => { setNoteFor(c); setNote(c.notes || ''); }}><Icon n="note-sticky" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'meetings' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-5 reveal">
            <h3 className="font-extrabold mb-4">Add meeting summary</h3>
            <div className="space-y-4">
              <Field label="Meeting title" required><input value={mt.title} onChange={(e) => setMt(Object.assign({}, mt, { title: e.target.value }))} placeholder="Monthly Community Majlis" /></Field>
              <Field label="Date"><input type="date" value={mt.date} onChange={(e) => setMt(Object.assign({}, mt, { date: e.target.value }))} /></Field>
              <Field label="Agenda"><textarea rows="3" value={mt.agenda} onChange={(e) => setMt(Object.assign({}, mt, { agenda: e.target.value }))} /></Field>
              <Field label="Attendees"><textarea rows="2" value={mt.attendees} onChange={(e) => setMt(Object.assign({}, mt, { attendees: e.target.value }))} /></Field>
              <Field label="Decisions"><textarea rows="3" value={mt.decisions} onChange={(e) => setMt(Object.assign({}, mt, { decisions: e.target.value }))} /></Field>
              <button className="btn btn-gold w-full" onClick={() => {
                if (!mt.title.trim()) { toast('Title is required', 'err'); return; }
                const summary = { id: uid('m'), title: mt.title, date: mt.date, agenda: mt.agenda, attendees: mt.attendees, decisions: mt.decisions };
                set((d) => Object.assign({}, d, {
                  meetings: [summary].concat(d.meetings),
                  activity: [{ id: uid('a'), text: 'Meeting summary added — ' + summary.title, at: iso(new Date()) }].concat(d.activity).slice(0, 40)
                }));
                setMt({ title: '', date: iso(new Date()), agenda: '', attendees: '', decisions: '' });
                toast('Meeting summary saved');
              }}><Icon n="plus" /> Save summary</button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {db.meetings.map((m) => (
              <div key={m.id} className="card p-5 reveal">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h4 className="font-extrabold">{m.title}</h4>
                  <span className="chip chip-gold">{fmtDate(m.date)}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                  <div><p className="lbl">Agenda</p><p className="text-sm muted leading-relaxed">{m.agenda}</p></div>
                  <div><p className="lbl">Attendees</p><p className="text-sm muted leading-relaxed">{m.attendees}</p></div>
                </div>
                <div className="mt-3"><p className="lbl">Decisions</p><p className="text-sm leading-relaxed">{m.decisions}</p></div>
                <button className="btn btn-sm btn-ghost mt-3" onClick={() => { set((d) => Object.assign({}, d, { meetings: d.meetings.filter((x) => x.id !== m.id) })); toast('Summary deleted'); }}><Icon n="trash" /> Delete</button>
              </div>
            ))}
            {!db.meetings.length ? <div className="card"><Empty icon="clipboard-list" title="No summaries yet" /></div> : null}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { k: 'members', l: 'Cabinet Members', d: db.cabinet.length + ' records', i: 'users' },
            { k: 'donors', l: 'Blood Donors', d: db.donors.length + ' records', i: 'droplet' },
            { k: 'complaints', l: 'Complaints', d: db.complaints.length + ' records', i: 'inbox' },
            { k: 'ledger', l: 'Fund Ledger', d: db.transactions.length + ' records', i: 'vault' }
          ].map((r) => (
            <div key={r.k} className="card card-hover p-5 reveal text-center">
              <Icon n={r.i} className="text-xl mb-2" />
              <p className="font-bold text-sm">{r.l}</p>
              <p className="muted text-[.7rem] mb-4">{r.d}</p>
              <button className="btn btn-gold btn-sm w-full" onClick={() => { downloadCSV('zwanan-' + r.k + '.csv', exportRows[r.k]()); toast('CSV downloaded'); }}>
                <Icon n="file-csv" /> Export CSV
              </button>
            </div>
          ))}
          <div className="card p-5 sm:col-span-2 lg:col-span-4 reveal">
            <h3 className="font-extrabold mb-2">Full community report</h3>
            <p className="muted text-sm mb-4">Generates a print-ready summary of the whole platform — use “Save as PDF” in the print dialog.</p>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-gold" onClick={printReport}><Icon n="print" /> Print / Save as PDF</button>
              <button className="btn btn-ghost" onClick={() => { downloadCSV('zwanan-full-export.csv', [].concat(exportRows.members(), [[''], ['Donors']], exportRows.donors(), [[''], ['Complaints']], exportRows.complaints(), [[''], ['Ledger']], exportRows.ledger())); toast('Full export downloaded'); }}>
                <Icon n="file-arrow-down" /> Export everything (CSV)
              </button>
            </div>
            <div className="hidden print:block mt-6">
              <h2 className="text-2xl font-black mb-2">Zwanan Jawkhela — Community Report</h2>
              <p className="text-sm">Generated {fmtDate(iso(new Date()))} • Members 248 • Balance {money(income - expense)}</p>
              <h3 className="font-bold mt-4 mb-1">Cabinet</h3>
              <ul className="text-sm">{db.cabinet.map((c) => <li key={c.id}>{c.name} — {c.role}</li>)}</ul>
              <h3 className="font-bold mt-4 mb-1">Complaints</h3>
              <ul className="text-sm">{db.complaints.map((c) => <li key={c.id}>{c.ref} — {c.subject} ({c.status})</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5 reveal">
            <h3 className="font-extrabold mb-4">General</h3>
            <div className="space-y-4">
              <Field label="Site name"><input value={db.settings.siteName} onChange={(e) => set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { siteName: e.target.value }) }))} /></Field>
              <Field label="Tagline"><input value={db.settings.tagline} onChange={(e) => set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { tagline: e.target.value }) }))} /></Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Donation account name"><input value={db.settings.account} onChange={(e) => set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { account: e.target.value }) }))} /></Field>
                <Field label="EasyPaisa number"><input value={db.settings.accountNumber} onChange={(e) => set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { accountNumber: e.target.value }) }))} /></Field>
              </div>
              <Field label="Donation goal (PKR)"><input type="number" value={db.settings.donationGoal} onChange={(e) => set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { donationGoal: Number(e.target.value) }) }))} /></Field>
            </div>
          </div>
          
          <div className="card p-5 reveal">
            <h3 className="font-extrabold mb-4">Anti-Narcotics Message (Urdu)</h3>
            <div className="space-y-4" dir="rtl">
              <Field label="پیغام (Message)">
                <textarea rows="8" style={{ fontFamily: 'var(--font-urdu, "Noto Nastaliq Urdu", serif)' }} className="text-right text-lg p-3" value={db.settings.narcoticsMessage || `پیارے بھائیوں اور بہنو!\n\nآج کا نوجوان کل کا مستقبل ہے۔ منشیات کا استعمال نہ صرف آپ کی صحت کو تباہ کرتا ہے بلکہ آپ کے خاندان، دوستوں اور پوری کمیونٹی کو نقصان پہنچاتا ہے۔\n\nہم سب کا فرض ہے کہ ایک دوسرے کو اس برائی سے روکیں۔\n\nاگر آپ یا آپ کا کوئی عزیز منشیات کا شکار ہے تو بلا جھجک کابینہ کے کسی رکن سے رابطہ کریں – ہم آپ کی مدد کے لیے حاضر ہیں۔\n\nیاد رکھیں: ایک صحت مند معاشرہ ہی ترقی کی ضمانت ہے۔`} onChange={(e) => set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { narcoticsMessage: e.target.value }) }))} />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5 reveal">
              <h3 className="font-extrabold mb-4">Appearance</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">Colour mode</p>
                  <p className="muted text-xs mt-0.5">Dark is the default Zwanan look.</p>
                </div>
                <button className={'btn ' + (db.settings.dark ? 'btn-gold' : 'btn-ghost')} onClick={() => {
                  const dark = !db.settings.dark;
                  set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { dark: dark }) }));
                  applyTheme(dark);
                  toast(dark ? 'Dark mode on' : 'Light mode on');
                }}>
                  <Icon n={db.settings.dark ? 'moon' : 'sun'} /> {db.settings.dark ? 'Dark' : 'Light'}
                </button>
              </div>
            </div>
            <div className="card p-5 reveal">
              <h3 className="font-extrabold mb-2">Data</h3>
              <p className="muted text-sm mb-4">Everything lives in this browser's localStorage and syncs between open tabs.</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  downloadBlob(JSON.stringify(db, null, 2), 'zwanan-jawkhela-backup.json', 'application/json');
                  toast('Backup downloaded');
                }}><Icon n="download" /> Download backup</button>
                <button className="btn btn-red btn-sm" onClick={() => setConfirmReset(true)}><Icon n="rotate-left" /> Reset to demo data</button>
              </div>
            </div>
            <div className="card p-5 reveal">
              <h3 className="font-extrabold mb-2">Dedication</h3>
              <p className="muted text-sm leading-relaxed">
                <span className="gold-text font-bold">Gifted with Love</span> from <b>Sheikh Hamdan Khan</b> &amp; <b>Sheikh Hashim Khan</b> to Our Beloved Village Family.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* cabinet modal */}
      <Modal open={cabOpen} onClose={() => { setCabOpen(false); setCm(null); }} title={cm ? 'Edit cabinet member' : 'New cabinet member'}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" required className="sm:col-span-2"><input value={mForm.name} onChange={(e) => setMForm(Object.assign({}, mForm, { name: e.target.value }))} /></Field>
          <Field label="Role" required><input value={mForm.role} onChange={(e) => setMForm(Object.assign({}, mForm, { role: e.target.value }))} placeholder="President" /></Field>
          <Field label="Since"><input type="date" value={mForm.since} onChange={(e) => setMForm(Object.assign({}, mForm, { since: e.target.value }))} /></Field>
          <Field label="Phone"><input value={mForm.phone} onChange={(e) => setMForm(Object.assign({}, mForm, { phone: e.target.value }))} /></Field>
          <Field label="Email"><input type="email" value={mForm.email} onChange={(e) => setMForm(Object.assign({}, mForm, { email: e.target.value }))} /></Field>
          <Field label="Bio" className="sm:col-span-2"><textarea rows="3" value={mForm.bio} onChange={(e) => setMForm(Object.assign({}, mForm, { bio: e.target.value }))} /></Field>
          <div className="sm:col-span-2 flex items-center gap-3">
            <Avatar name={mForm.name || 'New'} photo={mForm.photo} size={54} />
            <label className="btn btn-ghost btn-sm cursor-pointer">
              <Icon n="upload" /> {mForm.photo ? 'Change photo' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const url = await fileToDataURL(f, 420);
                if (url) setMForm(Object.assign({}, mForm, { photo: url }));
                e.target.value = '';
              }} />
            </label>
            {mForm.photo ? <button className="icon-btn" onClick={() => setMForm(Object.assign({}, mForm, { photo: '' }))} aria-label="Remove photo"><Icon n="trash" /></button> : null}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button className="btn btn-ghost" onClick={() => { setCabOpen(false); setCm(null); }}>Cancel</button>
          <button className="btn btn-gold" onClick={saveMember}><Icon n="check" /> Save member</button>
        </div>
      </Modal>

      {/* notes modal */}
      <Modal open={!!noteFor} onClose={() => setNoteFor(null)} title={noteFor ? 'Notes — ' + noteFor.ref : ''}
        footer={<React.Fragment><button className="btn btn-ghost" onClick={() => setNoteFor(null)}>Cancel</button>
          <button className="btn btn-gold" onClick={() => {
            set((d) => Object.assign({}, d, { complaints: d.complaints.map((x) => x.id === noteFor.id ? Object.assign({}, x, { notes: note }) : x) }));
            toast('Notes saved'); setNoteFor(null);
          }}><Icon n="check" /> Save note</button></React.Fragment>}>
        <Field label="Cabinet notes"><textarea rows="5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Actions taken, next steps, follow-up dates…" /></Field>
      </Modal>

      <Modal open={appModalOpen} onClose={() => { setAppModalOpen(false); setShowCardPreview(false); }} title={editApp ? 'Edit Member Details' : 'Add New Member'} footer={<React.Fragment><button className="btn btn-ghost" onClick={() => { setAppModalOpen(false); setShowCardPreview(false); }}>Cancel</button><button className="btn btn-gold" onClick={saveAppForm}><Icon n="check" /> Save Member</button></React.Fragment>}>
        <div className="flex justify-end mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCardPreview(v => !v)}>
            <Icon n={showCardPreview ? "eye-slash" : "eye"} /> {showCardPreview ? 'Hide Card Preview' : 'Preview Digital Card'}
          </button>
        </div>
        
        {showCardPreview ? (
          <div className="mb-6">
            <DigitalMemberCard m={Object.assign({}, appForm, { id: appForm.id || 'ZJ-XXXX-YYY', joined: appForm.appliedAt || iso(new Date()), tier: 'Standard' })} />
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" className="col-span-2"><input value={appForm.name} onChange={(e) => setAppForm(Object.assign({}, appForm, { name: e.target.value }))} placeholder="Full Name" /></Field>
          <Field label="Father's name"><input value={appForm.fatherName || ''} onChange={(e) => setAppForm(Object.assign({}, appForm, { fatherName: e.target.value }))} placeholder="Father's Name" /></Field>
          <Field label="CNIC"><input value={appForm.cnic} onChange={(e) => setAppForm(Object.assign({}, appForm, { cnic: e.target.value }))} placeholder="CNIC" /></Field>
          <Field label="Phone"><input value={appForm.phone} onChange={(e) => setAppForm(Object.assign({}, appForm, { phone: e.target.value }))} placeholder="Phone" /></Field>
          <Field label="Blood Group"><select value={appForm.blood} onChange={(e) => setAppForm(Object.assign({}, appForm, { blood: e.target.value }))}>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((g) => <option key={g}>{g}</option>)}</select></Field>
          <Field label="Status"><select value={appForm.status} onChange={(e) => setAppForm(Object.assign({}, appForm, { status: e.target.value, approved: e.target.value === 'approved' }))}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></Field>
          <Field label="Address" className="col-span-2"><input value={appForm.address} onChange={(e) => setAppForm(Object.assign({}, appForm, { address: e.target.value }))} placeholder="Address" /></Field>
        </div>
      </Modal>

      <Confirm open={confirmReset} title="Reset all data?" yesLabel="Reset everything"
        text="This wipes every entry you have added and restores the original demo data. It cannot be undone."
        onYes={() => { resetAll(); setConfirmReset(false); }} onNo={() => setConfirmReset(false)} />
      
      <Confirm open={!!del} title={del?.type === 'application' ? "Delete member" : "Remove cabinet member"} yesLabel="Delete"
        text={del ? (del.type === 'application' ? 'Permanently delete ' + del.item.name + ' from the community?' : 'Remove ' + del.name + ' from the cabinet?') : ''}
        onYes={() => {
          if (del?.type === 'application') {
            set((d) => Object.assign({}, d, { memberApplications: (d.memberApplications || []).filter((x) => x.id !== del.item.id) }));
            toast('Member deleted');
          } else {
            set((d) => Object.assign({}, d, { cabinet: d.cabinet.filter((x) => x.id !== del.id) }));
            toast('Member removed');
          }
          setDel(null);
        }} onNo={() => setDel(null)} />
    </div>
  );
}

/* =========================================================================
   APP SHELL
   ========================================================================= */
function NarcoticsPage({ db, go }) {
  const ref = useReveal();
  const msg = db.settings?.narcoticsMessage || `پیارے بھائیوں اور بہنو!\n\nآج کا نوجوان کل کا مستقبل ہے۔ منشیات کا استعمال نہ صرف آپ کی صحت کو تباہ کرتا ہے بلکہ آپ کے خاندان، دوستوں اور پوری کمیونٹی کو نقصان پہنچاتا ہے۔\n\nہم سب کا فرض ہے کہ ایک دوسرے کو اس برائی سے روکیں۔\n\nاگر آپ یا آپ کا کوئی عزیز منشیات کا شکار ہے تو بلا جھجک کابینہ کے کسی رکن سے رابطہ کریں – ہم آپ کی مدد کے لیے حاضر ہیں۔\n\nیاد رکھیں: ایک صحت مند معاشرہ ہی ترقی کی ضمانت ہے۔`;

  return (
    <div ref={ref} className="max-w-3xl mx-auto reveal">
      <SectionHead eyebrow="Awareness" title="نوجوانوں کے لیے پیغام" sub="منشیات کی لعنت سے بچیں" />
      <div className="card p-6 sm:p-10 relative overflow-hidden text-center sm:text-right" dir="rtl" style={{ fontFamily: 'var(--font-urdu, "Noto Nastaliq Urdu", serif)' }}>
        <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none">
          <Icon n="shield-heart" className="text-9xl text-red-500" />
        </div>
        <div className="flex justify-center sm:justify-start mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 glow-gold" style={{ boxShadow: '0 0 0 1px rgba(220,38,38,.32), 0 0 26px rgba(220,38,38,.20)' }}>
            <Icon n="shield-heart" className="text-4xl" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-red-600 dark:text-red-400 leading-normal">
          نوجوانوں کے لیے پیغام – منشیات کی لعنت سے بچیں
        </h2>
        
        <div className="p-4 sm:p-6 rounded-xl bg-[var(--card2)] border border-[var(--line2)] text-center mb-6 shadow-inner relative z-10">
          <p className="font-bold text-xl text-gold drop-shadow-md mb-2">
            "وَلا تُلْقُوا بِأَيْدِيكُمْ إِلَى التَّهْلُكَةِ"
          </p>
          <p className="text-sm font-normal muted">
            (اور اپنے آپ کو ہلاکت میں نہ ڈالیں) - القرآن
          </p>
        </div>

        <div className="space-y-4 text-base sm:text-lg leading-loose text-gray-800 dark:text-gray-200 relative z-10 whitespace-pre-wrap font-medium">
          {msg}
        </div>

        <div className="mt-10 flex justify-center sm:justify-start relative z-10">
          <button className="btn btn-red text-lg px-8 py-3 shadow-lg hover:shadow-red-500/50" onClick={() => go('admin')}>
            <Icon n="phone" /> Cabinet سے رابطہ کریں
          </button>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'updates', label: 'Updates', icon: 'bullhorn' },
  { id: 'elections', label: 'Elections', icon: 'square-check' },
  { id: 'blood', label: 'Blood Bank', icon: 'droplet' },
  { id: 'donations', label: 'Donations', icon: 'hand-holding-heart' },
  { id: 'funds', label: 'Funds', icon: 'vault' },
  { id: 'complaints', label: 'Complaints', icon: 'inbox' },
  { id: 'polls', label: 'Polls', icon: 'square-poll-vertical' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-days' },
  { id: 'emergency', label: 'Emergency', icon: 'tower-broadcast' },
  { id: 'narcotics', label: 'پیغام', icon: 'shield-heart' },
  { id: 'membership', label: 'Membership', icon: 'id-card' },
  { id: 'admin', label: 'Admin', icon: 'gear' }
];

function App() {
  const [db, set] = useStore('db', seedData());
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => readStore('isAdmin', false) === true);
  const [toasts, setToasts] = useState([]);
  const mainRef = useRef(null);
  const headRef = useRef(null);

  const applyTheme = useCallback((dark) => {
    document.documentElement.classList.toggle('light', !dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, []);

  useEffect(() => { applyTheme(db.settings.dark !== false); }, []);
  useEffect(() => { writeStore('isAdmin', isAdmin); }, [isAdmin]);
  useEffect(() => { document.title = db.settings.siteName + ' — ' + db.settings.tagline; }, [db.settings.siteName, db.settings.tagline]);

  useEffect(() => {
    toastHandler = (msg, kind) => {
      const id = uid('t');
      setToasts((t) => t.concat([{ id: id, msg: msg, kind: kind }]));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
    };
    return () => { toastHandler = null; };
  }, []);

  useEffect(() => {
    if (page === 'emergency' && isAdmin) {
      const active = db.emergencies.filter((e) => e.status === 'Active').length;
      if (active) toast(active + ' active emergency alert(s)', 'err');
    }
  }, [page]);

  const go = useCallback((id) => {
    setPage(id); setMenu(false);
    if (headRef.current) headRef.current.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetAll = () => {
    try { Object.keys(localStorage).filter((k) => k.indexOf(NS) === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    const fresh = seedData();
    Object.keys(fresh).forEach((k) => writeStore(k, fresh[k]));
    set(fresh);
    toast('Demo data restored');
    go('home');
  };

  const pageProps = { db: db, set: set, isAdmin: isAdmin };
  const counts = {
    complaints: db.complaints.filter((c) => c.status !== 'Resolved').length,
    emergency: db.emergencies.filter((e) => e.status === 'Active').length,
    polls: db.polls.filter((p) => new Date(p.ends + 'T23:59') >= new Date()).length
  };

  const body = (() => {
    switch (page) {
      case 'updates': return <UpdatesPage {...pageProps} />;
      case 'elections': return <ElectionsPage {...pageProps} />;
      case 'blood': return <BloodPage {...pageProps} />;
      case 'donations': return <DonationsPage {...pageProps} />;
      case 'funds': return <FundsPage {...pageProps} />;
      case 'complaints': return <ComplaintsPage {...pageProps} />;
      case 'polls': return <PollsPage {...pageProps} />;
      case 'calendar': return <CalendarPage {...pageProps} />;
      case 'emergency': return <EmergencyPage {...pageProps} />;
      case 'narcotics': return <NarcoticsPage {...pageProps} />;
      case 'membership': return <MembershipPage {...pageProps} />;
      case 'admin': return <AdminPage {...pageProps} setAdmin={(val) => { setIsAdmin(val); writeStore('isAdmin', val); }} applyTheme={applyTheme} resetAll={resetAll} />;
      default: return <Home db={db} set={set} go={go} />;
    }
  })();

  const badge = (id) => (id === 'complaints' && counts.complaints) || (id === 'emergency' && counts.emergency) || (id === 'polls' && counts.polls) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="site-head sticky top-0 z-50 no-print" style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-3">
            <button onClick={() => go('home')} aria-label="Go to home" className="shrink-0"><Logo size={22} sub={false} /></button>
            <div className="hidden md:flex flex-col ml-1">
              <span className="gold-text italic font-bold text-sm">“{db.settings.tagline}”</span>
              <span className="muted text-[.6rem] tracking-[.14em] font-semibold">COMMUNITY ALLIANCE &amp; OUTREACH • EST. 2019</span>
            </div>
            <nav aria-label="Main" className="hidden xl:flex items-center gap-1 ml-auto overflow-x-auto no-sb">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => go(t.id)} className={'nav-tab ' + (page === t.id ? 'active' : '')} aria-current={page === t.id ? 'page' : undefined}>
                  <Icon n={t.icon} /> {t.label}
                  {badge(t.id) ? <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-red-500" aria-label={badge(t.id) + ' alerts'} /> : null}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 ml-auto xl:ml-0">
              <button className="icon-btn" aria-label={db.settings.dark ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={() => { const dark = !db.settings.dark; set((d) => Object.assign({}, d, { settings: Object.assign({}, d.settings, { dark: dark }) })); applyTheme(dark); }}>
                <Icon n={db.settings.dark ? 'sun' : 'moon'} />
              </button>
              <button className="icon-btn xl:hidden" aria-label="Toggle navigation menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                <Icon n={menu ? 'xmark' : 'bars'} />
              </button>
            </div>
          </div>

          {/* tablet nav */}
          <nav aria-label="Sections" className="xl:hidden flex items-center gap-1 pb-2 -mt-1 overflow-x-auto no-sb">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => go(t.id)} className={'nav-tab ' + (page === t.id ? 'active' : '')}>
                <Icon n={t.icon} /> {t.label}
                {badge(t.id) ? <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> : null}
              </button>
            ))}
          </nav>
        </div>

        {menu ? (
          <div className="xl:hidden px-4 pb-4">
            <div className="card p-2 grid grid-cols-2 gap-1">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => go(t.id)} className={'nav-tab justify-start ' + (page === t.id ? 'active' : '')}>
                  <Icon n={t.icon} /> {t.label}
                  {badge(t.id) ? <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {/* ===== MAIN ===== */}
      <main ref={mainRef} className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 ref={headRef} tabIndex="-1" className="sr-only focus:not-sr-only">{db.settings.siteName} — {TABS.filter((t) => t.id === page).map((t) => t.label)[0] || 'Home'}</h1>
        {body}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="no-print mt-10" style={{ borderTop: '1px solid var(--line)', background: 'var(--bg2)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Logo size={24} sub={false} />
              <p className="gold-text italic font-bold text-sm mt-3">“Together We Thrive”</p>
              <p className="muted text-[.72rem] mt-2 leading-relaxed">COMMUNITY ALLIANCE &amp; OUTREACH • EST. 2019</p>
            </div>
            <div>
              <p className="lbl">Quick links</p>
              <div className="flex flex-col gap-1.5">
                {TABS.slice(0, 6).map((t) => <button key={t.id} onClick={() => go(t.id)} className="text-left muted text-[.78rem] hover:text-[#f5d77b] transition-colors">{t.label}</button>)}
              </div>
            </div>
            <div>
              <p className="lbl">More</p>
              <div className="flex flex-col gap-1.5">
                {TABS.slice(6).map((t) => <button key={t.id} onClick={() => go(t.id)} className="text-left muted text-[.78rem] hover:text-[#f5d77b] transition-colors">{t.label}</button>)}
              </div>
            </div>
            <div>
              <p className="lbl">Donation account</p>
              <p className="font-bold text-sm">{db.settings.account}</p>
              <p className="gold-text font-black text-lg tracking-widest">{db.settings.accountNumber}</p>
              <p className="muted text-[.7rem] mt-1">EasyPaisa</p>
              <button className="btn btn-ghost btn-sm mt-3" onClick={() => copyText(db.settings.accountNumber).then(() => toast('Number copied'))}><Icon n="copy" /> Copy</button>
            </div>
          </div>
          <div className="divider my-6" />
          <p className="muted text-[.72rem] leading-relaxed text-center max-w-2xl mx-auto">
            <span className="gold-text font-bold">Gifted with Love</span> from <b style={{ color: 'var(--text)' }}>Sheikh Hamdan Khan</b> &amp; <b style={{ color: 'var(--text)' }}>Sheikh Hashim Khan</b> to Our Beloved Village Family.
          </p>
          <p className="muted text-[.66rem] text-center mt-3">© {new Date().getFullYear()} {db.settings.siteName}. Built for the village, by the village.</p>
        </div>
      </footer>

      {/* ===== TOASTS ===== */}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 no-print" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className="card px-4 py-3 flex items-center gap-3 max-w-xs sm:max-w-sm modal-body"
            style={{ borderColor: t.kind === 'err' ? 'rgba(239,68,68,.55)' : 'rgba(52,211,153,.5)' }}>
            <Icon n={t.kind === 'err' ? 'triangle-exclamation' : 'circle-check'} className={t.kind === 'err' ? 'text-[#f87171]' : 'text-[#34d399]'} />
            <p className="text-sm font-semibold leading-snug">{t.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
