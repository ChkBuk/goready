'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Plus,
  Clock,
  MapPin,
  Utensils,
  Camera,
  Bus,
  Hotel,
  ShoppingBag,
  Star,
  Trash2,
  GripVertical,
  Navigation,
} from 'lucide-react';
import { format } from 'date-fns';
import { ActivityForm } from './activity-form';
import { toast } from 'sonner';

interface TripDay {
  id: string;
  date: string;
  dayNumber: number;
  notes: string | null;
}

interface Activity {
  id: string;
  tripDayId: string;
  title: string;
  description: string | null;
  category: string;
  startTime: string | null;
  endTime: string | null;
  placeName: string | null;
  address: string | null;
  sortOrder: number;
  googleMapsUrl: string | null;
  notes: string | null;
}

interface DayWithActivities extends TripDay {
  activities: Activity[];
}

const categoryIcons: Record<string, typeof Camera> = {
  sightseeing: Camera,
  meal: Utensils,
  transport: Bus,
  accommodation: Hotel,
  shopping: ShoppingBag,
  entertainment: Star,
  other: MapPin,
};

const categoryColors: Record<string, string> = {
  sightseeing: 'bg-blue-100 text-blue-700',
  meal: 'bg-orange-100 text-orange-700',
  transport: 'bg-purple-100 text-purple-700',
  accommodation: 'bg-green-100 text-green-700',
  shopping: 'bg-pink-100 text-pink-700',
  entertainment: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-700',
};

export function DayPlanner({ tripId, days }: { tripId: string; days: TripDay[] }) {
  const [selectedDay, setSelectedDay] = useState(days[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: daysWithActivities, isLoading } = useQuery({
    queryKey: ['itinerary', tripId],
    queryFn: async () => {
      const res = await api.get<DayWithActivities[]>(`/api/trips/${tripId}/days`);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await api.delete(`/api/trips/${tripId}/activities/${activityId}`);
      if (!res.success) throw new Error(res.error as string);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
      toast.success('Activity removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const currentDay = daysWithActivities?.find((d) => d.id === selectedDay) ||
    daysWithActivities?.[0];

  return (
    <div>
      {/* Day selector — horizontal scroll on mobile */}
      <ScrollArea className="w-full whitespace-nowrap mb-4">
        <div className="flex gap-2 pb-2">
          {(daysWithActivities || days).map((day) => (
            <Button
              key={day.id}
              variant={selectedDay === day.id || (!selectedDay && day.dayNumber === 1) ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setSelectedDay(day.id)}
            >
              <span className="font-medium">Day {day.dayNumber}</span>
              <span className="ml-1.5 text-xs opacity-70">
                {format(new Date(day.date), 'MMM d')}
              </span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Activities list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : currentDay && currentDay.activities.length > 0 ? (
        <div className="space-y-3">
          {currentDay.activities
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((activity) => {
              const Icon = categoryIcons[activity.category] || MapPin;
              return (
                <Card key={activity.id} className="group">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex items-center gap-2 pt-0.5">
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-full ${
                          categoryColors[activity.category] || 'bg-gray-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.placeName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{activity.placeName}</span>
                              {activity.googleMapsUrl && (
                                <a
                                  href={activity.googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-primary hover:underline flex-shrink-0 ml-1"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Open in Google Maps"
                                >
                                  <Navigation className="h-3 w-3" />
                                  <span className="text-xs">Map</span>
                                </a>
                              )}
                            </p>
                          )}
                          {!activity.placeName && activity.googleMapsUrl && (
                            <a
                              href={activity.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Navigation className="h-3 w-3" />
                              Open in Google Maps
                            </a>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteActivity.mutate(activity.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {activity.startTime && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.startTime}
                            {activity.endTime && ` - ${activity.endTime}`}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {activity.category}
                        </Badge>
                      </div>
                      {activity.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No activities planned for this day yet.</p>
        </div>
      )}

      {/* Add activity */}
      {showAddForm && currentDay ? (
        <div className="mt-4">
          <ActivityForm
            tripId={tripId}
            dayId={currentDay.id}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
            }}
          />
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      )}
    </div>
  );
}
