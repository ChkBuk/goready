'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';

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

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
};

export function TripCard({ trip }: { trip: Trip }) {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
          {trip.coverImage ? (
            <img src={trip.coverImage} alt={trip.title} className="h-full w-full object-cover" />
          ) : (
            <MapPin className="h-10 w-10 text-primary/40" />
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold truncate">{trip.title}</h3>
            <Badge variant="secondary" className={statusColors[trip.status] || ''}>
              {trip.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{trip.destination}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')} ({days} days)
            </span>
          </div>
          {trip.myRole !== 'owner' && (
            <Badge variant="outline" className="mt-2 text-xs">
              {trip.myRole}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
