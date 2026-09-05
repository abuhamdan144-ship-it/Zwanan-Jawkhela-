import React from 'react';
import { mockEvents } from '../data/mockData';
import { format, isPast } from 'date-fns';
import { Calendar as CalendarIcon, MapPin } from 'lucide-react';

export default function Events() {
  const upcomingEvents = mockEvents.filter(e => !isPast(new Date(e.date)));
  const pastEvents = mockEvents.filter(e => isPast(new Date(e.date)));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-gray-900 font-serif mb-8">Community Events</h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 italic">No upcoming events scheduled at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary-50 rounded-xl p-3 text-center min-w-[75px] shadow-sm">
                    <p className="text-primary-600 font-bold text-sm uppercase">{format(new Date(event.date), 'MMM')}</p>
                    <p className="text-primary-900 font-bold text-2xl">{format(new Date(event.date), 'dd')}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    <p className="text-gray-500 mt-2 text-sm">{event.description}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-600 mt-4 font-medium">
                      <MapPin className="w-4 h-4" /> {event.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Past Events Archive</h2>
        <div className="space-y-4">
          {pastEvents.map(event => (
            <div key={event.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between opacity-80 hover:opacity-100 transition-opacity">
              <div>
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-500">{event.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
                <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {format(new Date(event.date), 'PP')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
