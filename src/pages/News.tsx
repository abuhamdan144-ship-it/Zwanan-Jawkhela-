import React, { useState } from 'react';
import { mockNews, NewsCategory } from '../data/mockData';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { MessageSquare, Heart, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export default function News() {
  const [filter, setFilter] = useState<NewsCategory | 'All'>('All');
  const { user } = useAuth();
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

  const filteredNews = filter === 'All' ? mockNews : mockNews.filter(n => n.category === filter);

  const categories: (NewsCategory | 'All')[] = ['All', 'Death', 'Marriage', 'Nikah', 'Engagement', 'Announcement'];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Death': return 'bg-gray-800 text-white';
      case 'Marriage': return 'bg-pink-100 text-pink-800';
      case 'Nikah': return 'bg-purple-100 text-purple-800';
      case 'Engagement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const handleComment = (newsId: string) => {
    if (!commentText[newsId]) return;
    alert(`Comment submitted: ${commentText[newsId]}`);
    setCommentText({ ...commentText, [newsId]: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community News</h1>
          <p className="text-gray-500 mt-1">Updates and announcements from Jawkhela</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === cat 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {filteredNews.map((news, idx) => (
          <motion.article 
            key={news.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {news.photoUrl && (
              <ImageWithFallback src={news.photoUrl} alt={news.title} className="w-full h-64 object-cover" />
            )}
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getCategoryColor(news.category)}`}>
                  {news.category}
                </span>
                <span className="text-sm text-gray-500">{format(new Date(news.date), 'MMMM dd, yyyy')}</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-urdu">{news.titleUrdu || news.title}</h2>
              {news.namesInvolved && (
                <p className="text-sm font-medium text-primary-600 mb-4">
                  Involving: {news.namesInvolved.join(', ')}
                </p>
              )}
              
              <p className="text-gray-700 leading-relaxed font-urdu" dir="auto">
                {news.descriptionUrdu || news.description}
              </p>

              {/* Interaction Bar */}
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
                <button className="flex items-center gap-2 hover:text-primary-600 transition-colors">
                  <Heart className="w-4 h-4" /> Respect/Like
                </button>
                <button className="flex items-center gap-2 hover:text-primary-600 transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <span className="flex items-center gap-2 ml-auto">
                  <MessageSquare className="w-4 h-4" /> {news.comments.length}
                </span>
              </div>

              {/* Comments / Condolence Book */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-4">
                  {news.category === 'Death' ? 'Condolence Book' : news.category === 'Marriage' || news.category === 'Nikah' ? 'Congratulations' : 'Comments'}
                </h4>
                
                <div className="space-y-4 mb-4">
                  {news.comments.map(comment => (
                    <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-100 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">{format(new Date(comment.date), 'MMM dd, HH:mm')}</span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                  {news.comments.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No messages yet. Be the first to leave one.</p>
                  )}
                </div>

                {user ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Leave a respectful message..." 
                      className="flex-grow bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                      value={commentText[news.id] || ''}
                      onChange={e => setCommentText({ ...commentText, [news.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => handleComment(news.id)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                    >
                      Post
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Please <span className="text-primary-600 cursor-pointer">login</span> to leave a message.</p>
                )}
              </div>
            </div>
          </motion.article>
        ))}
        {filteredNews.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No news found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
