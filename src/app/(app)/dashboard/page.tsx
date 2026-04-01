'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TripCard } from '@/components/trips/trip-card';
import { Plus, Plane } from 'lucide-react';
import Link from 'next/link';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  coverImage: string | null;
  myRole: string;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get<Trip[]>('/api/trips');
      return res.data || [];
    },
  });

  const trips = data || [];
  const upcomingTrips = trips.filter(
    (t) => new Date(t.startDate) >= new Date() || t.status === 'planning'
  );
  const pastTrips = trips.filter(
    (t) => new Date(t.endDate) < new Date() && t.status === 'completed'
  );

  return (
    <div className="px-5 py-8 md:px-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Trips</h1>
        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Trip
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
            <Plane className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
            Start planning your next adventure! Create a trip and add activities,
            bookings, and expenses.
          </p>
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create your first trip
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {upcomingTrips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {pastTrips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Past Trips</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
