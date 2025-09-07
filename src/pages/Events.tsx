import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

const EventsPage = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/admin/content/events');
        if (!res.ok) throw new Error('Failed to load events');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error('Error loading events', err);
        setEvents([]);
      }
    };
    fetchEvents();
  }, []);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Workshop': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-green-100 text-green-800';
      case 'Seminar': return 'bg-purple-100 text-purple-800';
      case 'Bootcamp': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Events & Activities</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our educational events, workshops, and activities designed to enhance your learning experience
            </p>
          </div>

          {/* Event Filters */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline">All Events</Button>
              <Button variant="outline">Upcoming</Button>
              <Button variant="outline">Workshops</Button>
              <Button variant="outline">Seminars</Button>
              <Button variant="outline">Fairs</Button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                      <CardDescription className="mb-3">{event.description}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{event.attendees}/{event.maxAttendees} attendees</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {event.maxAttendees - event.attendees} spots left
                      </span>
                      <Button 
                        size="sm" 
                        disabled={event.status === 'completed' || event.attendees >= event.maxAttendees}
                        className="ml-2"
                      >
                        {event.status === 'completed' ? 'Completed' : 
                         event.attendees >= event.maxAttendees ? 'Full' : 'Register'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Upcoming Events Highlight */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Mathematics Workshop
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Join our expert tutors for an intensive mathematics workshop covering advanced topics
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Feb 15, 2024</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>10:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>Main Campus</span>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="ml-6">
                  Register Now
                </Button>
              </div>
            </div>
          </div>

          {/* Event Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Workshops</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Hands-on learning sessions with expert instructors
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Seminars</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Expert talks and panel discussions on various topics
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Fairs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Showcase events and exhibitions of student work
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Bootcamps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Intensive training programs for specific skills
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;