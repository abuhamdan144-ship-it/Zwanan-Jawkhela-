import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { Users, Heart, Droplets, ArrowRight, Clock, Contact, Phone, AlertCircle, BellRing } from 'lucide-react';
import { mockActivityFeed, mockNews, mockEvents, emergencyContacts } from '../data/mockData';
import { format } from 'date-fns';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  const latestNews = mockNews.slice(0, 3);
  const nextEvent = mockEvents[0];
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="flex flex-col gap-12 pb-12 bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[76vh] min-h-[560px] flex items-center justify-center overflow-hidden bg-primary-950">
        <motion.div style={{ y: y1 }} className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80" 
            alt="Jawkhela Landscape" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
        </motion.div>
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/80 via-primary-900/45 to-gray-50 z-10" />
        
        {/* Noise Texture Layer */}
        <div className="absolute inset-0 bg-noise z-10" />
        
        <motion.div 
          style={{ opacity }}
          className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-12"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Community Welfare Organization
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 text-white tracking-tight drop-shadow-lg font-urdu"
          >
            Zwanan Jawkhela
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl max-w-2xl text-primary-50 mb-10 leading-relaxed font-light drop-shadow-md"
          >
            Dedicated to community welfare, mutual support, and local governance exclusively for the residents and families of Jawkhela (Buner, KPK).
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/membership">
              <motion.button whileTap={{ scale: 0.97 }} className="bg-white text-primary-950 px-8 py-3.5 rounded-xl font-bold shadow-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
                Join the Community
              </motion.button>
            </Link>
            <Link to="/donations">
              <motion.button whileTap={{ scale: 0.97 }} className="bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors border border-amber-400">
                Make a Donation
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-24 z-20 relative">
        
        {/* Quick Links / Stats */}
        <motion.section 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 -mt-20"
        >
          {[
            { title: 'Membership', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/membership', desc: 'Join the community database.' },
            { title: 'Donations', icon: Heart, color: 'text-amber-600', bg: 'bg-amber-50', link: '/donations', desc: 'Support our local initiatives.' },
            { title: 'Blood Bank', icon: Droplets, color: 'text-red-600', bg: 'bg-red-50', link: '/blood-bank', desc: 'Emergency blood donors.' }
          ].map((item, i) => (
            <motion.div variants={fadeUp} key={i}>
              <Link to={item.link} className="block group h-full">
                <div className="bg-white/95 backdrop-blur rounded-2xl shadow-[0_18px_45px_-18px_rgba(5,46,22,0.22)] p-6 border border-gray-100 hover:border-primary-200 hover:shadow-[0_22px_50px_-18px_rgba(5,46,22,0.28)] hover:-translate-y-1 transition-all duration-300 h-full flex items-start gap-4">
                  <div className={`p-3.5 ${item.bg} ${item.color} rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg font-serif">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-3">{item.desc}</p>
                    <span className={`text-sm ${item.color} font-semibold flex items-center gap-1 group-hover:gap-2 transition-all`}>
                      Access <ArrowRight className="w-4 h-4"/>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Live Activity Feed */}
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <motion.div variants={fadeUp} className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-serif">Community Activity</h2>
                  <p className="text-gray-500 mt-1">Recent efforts and fieldwork</p>
                </div>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mockActivityFeed.map((activity) => (
                  <motion.div variants={fadeUp} key={activity.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="aspect-[4/3] w-full relative overflow-hidden">
                      <ImageWithFallback src={activity.imageUrl} alt="Activity" className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="p-5">
                      <p className="text-gray-900 font-medium leading-relaxed">{activity.description}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-3 uppercase tracking-wider">{format(new Date(activity.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Latest News */}
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <motion.div variants={fadeUp} className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-serif">Latest News</h2>
                  <p className="text-gray-500 mt-1">Announcements from Jawkhela</p>
                </div>
                <Link to="/news" className="text-sm text-primary-600 font-bold hover:text-primary-700 transition-colors flex items-center gap-1 group bg-primary-50 px-3 py-1.5 rounded-lg">
                  View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                </Link>
              </motion.div>
              <div className="space-y-4">
                {latestNews.map((news) => (
                  <motion.div variants={fadeUp} key={news.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5 items-start hover:shadow-md hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg shrink-0 border border-gray-100 shadow-sm">
                      {news.category}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 font-urdu group-hover:text-primary-700 transition-colors">{news.titleUrdu || news.title}</h3>
                      <p className="text-sm text-gray-600 mt-2 font-urdu leading-relaxed" dir="auto">{news.descriptionUrdu || news.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-400">
                        <span>{format(new Date(news.date), 'MMMM dd, yyyy')}</span>
                        {news.comments.length > 0 && <span className="flex items-center gap-1"><BellRing className="w-3 h-3"/> {news.comments.length} responses</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Right Column: Sidebar */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-8"
          >
            
            {/* Upcoming Event Widget */}
            {nextEvent && (
              <motion.div variants={fadeUp} className="relative bg-primary-950 text-white rounded-3xl p-8 shadow-xl overflow-hidden border border-primary-800">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Clock className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <h3 className="font-bold text-amber-400 text-sm tracking-wider uppercase">Upcoming Event</h3>
                  </div>
                  <h4 className="text-2xl font-serif font-bold mb-4 leading-tight">{nextEvent.title}</h4>
                  <div className="space-y-3 text-sm text-primary-100 mb-8 font-medium">
                    <p className="flex items-center gap-3"><Clock className="w-5 h-5 text-primary-300" /> {format(new Date(nextEvent.date), 'PPP')}</p>
                    <p className="flex items-center gap-3"><Users className="w-5 h-5 text-primary-300" /> {nextEvent.location}</p>
                  </div>
                  <Link to="/events" className="block text-center w-full bg-white text-primary-950 hover:bg-gray-100 py-3 rounded-xl font-bold transition-colors shadow-lg">
                    View Details
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Prayer Timings Widget */}
            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 text-center text-lg font-serif">Prayer Timings</h3>
              <div className="space-y-2 text-sm font-medium">
                <div className="flex justify-between p-3 rounded-xl text-gray-600"><span className="text-gray-500">Fajr</span><span>04:15 AM</span></div>
                <div className="flex justify-between p-3 rounded-xl text-gray-600"><span className="text-gray-500">Dhuhr</span><span>12:15 PM</span></div>
                <div className="flex justify-between p-3 rounded-xl text-gray-600"><span className="text-gray-500">Asr</span><span>05:00 PM</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Maghrib (Current)
                  </span>
                  <span className="font-bold text-amber-700">07:10 PM</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl text-gray-600"><span className="text-gray-500">Isha</span><span>08:45 PM</span></div>
              </div>
            </motion.div>

            {/* Emergency Contacts */}
            <motion.div variants={fadeUp} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg font-serif">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Emergency Contacts
              </h3>
              <div className="space-y-3">
                {emergencyContacts.map((contact, idx) => (
                  <a key={idx} href={`tel:${contact.phone}`} className="group flex justify-between items-center p-3 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        {contact.type === 'Police' ? <AlertCircle className="w-5 h-5"/> : contact.type === 'Ambulance' ? <Phone className="w-5 h-5"/> : <Contact className="w-5 h-5"/>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">{contact.name}</p>
                        <p className="text-xs font-medium text-gray-500">{contact.type}</p>
                      </div>
                    </div>
                    <Phone className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                  </a>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
