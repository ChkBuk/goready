'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Plane, Hotel, Bus, Train, Ship, Car, Ticket } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Booking {
  id: string;
  type: string;
  provider: string | null;
  confirmationNo: string | null;
  status: string;
  departureAt: string | null;
  arrivalAt: string | null;
  origin: string | null;
  destination: string | null;
  cost: string | null;
  currency: string;
  bookingUrl: string | null;
}

const typeIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  bus: Bus,
  train: Train,
  ferry: Ship,
  car_rental: Car,
  other: Ticket,
};

export default function TripBookingsPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('flight');
  const [provider, setProvider] = useState('');
  const [confirmationNo, setConfirmationNo] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [cost, setCost] = useState('');

  const { data: bookings } = useQuery({
    queryKey: ['bookings', tripId],
    queryFn: async () => {
      const res = await api.get<Booking[]>(`/api/trips/${tripId}/bookings`);
      return res.data || [];
    },
  });

  const addBooking = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/trips/${tripId}/bookings`, {
        type,
        provider: provider || null,
        confirmationNo: confirmationNo || null,
        origin: origin || null,
        destination: destination || null,
        departureAt: departureAt ? new Date(departureAt).toISOString() : null,
        cost: cost ? parseFloat(cost) : null,
      });
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success('Booking added!');
      setShowAddForm(false);
      setProvider('');
      setConfirmationNo('');
      setOrigin('');
      setDestination('');
      setDepartureAt('');
      setCost('');
      queryClient.invalidateQueries({ queryKey: ['bookings', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto">
      <Link href={`/trips/${tripId}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "mb-4")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Trip
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Bookings</h1>
      </div>

      {showAddForm ? (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addBooking.mutate();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                  <option value="ferry">Ferry</option>
                  <option value="car_rental">Car Rental</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Provider</Label>
                  <Input
                    placeholder="e.g., Emirates"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmation #</Label>
                  <Input
                    placeholder="e.g., ABC123"
                    value={confirmationNo}
                    onChange={(e) => setConfirmationNo(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input
                    placeholder="Origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input
                    placeholder="Destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Departure</Label>
                  <Input
                    type="datetime-local"
                    value={departureAt}
                    onChange={(e) => setDepartureAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={addBooking.isPending}>
                  {addBooking.isPending ? 'Adding...' : 'Add Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Booking
        </Button>
      )}

      {bookings && bookings.length > 0 ? (
        <div className="space-y-2">
          {bookings.map((booking) => {
            const Icon = typeIcons[booking.type] || Ticket;
            return (
              <Card key={booking.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {booking.origin && booking.destination
                          ? `${booking.origin} → ${booking.destination}`
                          : booking.provider || booking.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {booking.provider && <span>{booking.provider}</span>}
                      {booking.confirmationNo && <span>#{booking.confirmationNo}</span>}
                      {booking.departureAt && (
                        <span>
                          {format(new Date(booking.departureAt), 'MMM d, HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {booking.cost && (
                      <p className="font-semibold text-sm">
                        ${parseFloat(booking.cost).toFixed(2)}
                      </p>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No bookings added yet.</p>
        </div>
      )}
    </div>
  );
}
