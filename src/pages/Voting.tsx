import React, { useState } from 'react';
import { mockPolls } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, BarChart3, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function Voting() {
  const { user } = useAuth();
  const [votedPolls, setVotedPolls] = useState<string[]>([]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-500">Only approved members of Zwanan Jawkhela can access the voting portal. Please log in.</p>
      </div>
    );
  }

  const handleVote = (pollId: string, optionId: string) => {
    // In a real app, send to backend
    setVotedPolls([...votedPolls, pollId]);
    alert('Your vote has been securely recorded.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Community Polls & Elections</h1>
        <p className="text-gray-500 mt-2">Participate in decision-making for Jawkhela.</p>
      </div>

      <div className="space-y-8">
        {mockPolls.map((poll) => {
          const isClosed = isPast(new Date(poll.endDate));
          const hasVoted = votedPolls.includes(poll.id) || poll.voterIds.includes(user.id);
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

          return (
            <motion.div 
              key={poll.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{poll.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    {isClosed ? 'Closed on' : 'Closes on'} {format(new Date(poll.endDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isClosed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {isClosed ? 'CLOSED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                {isClosed || hasVoted ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700">
                      <BarChart3 className="w-5 h-5 text-primary-600" />
                      Results {hasVoted && !isClosed ? '(Live)' : ''}
                    </div>
                    {poll.options.map(opt => {
                      const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                      return (
                        <div key={opt.id} className="relative">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-900">{opt.text}</span>
                            <span className="text-gray-600">{percentage}% ({opt.votes})</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {hasVoted && !isClosed && (
                      <p className="text-sm text-green-600 mt-4 flex items-center gap-1 font-medium">
                        <CheckCircle className="w-4 h-4" /> You have already voted on this poll.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 font-medium mb-4">Cast your vote (One member, one vote):</p>
                    {poll.options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(poll.id, opt.id)}
                        className="w-full text-left p-4 rounded-xl border border-gray-300 bg-white hover:border-primary-500 hover:bg-primary-50 transition-colors flex justify-between items-center group"
                      >
                        <span className="font-medium text-gray-900">{opt.text}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-primary-500 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
