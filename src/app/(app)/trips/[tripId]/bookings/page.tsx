'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Plane, Hotel, Bus, Train, Ship, Car, Ticket, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
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
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
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

  const saveBooking = useMutation({
    mutationFn: async () => {
      const payload = {
        type,
        provider: provider || null,
        confirmationNo: confirmationNo || null,
        origin: origin || null,
        destination: destination || null,
        departureAt: departureAt ? new Date(departureAt).toISOString() : null,
        cost: cost ? parseFloat(cost) : null,
      };
      if (editingBooking) {
        const res = await api.put(`/api/trips/${tripId}/bookings/${editingBooking.id}`, payload);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await api.post(`/api/trips/${tripId}/bookings`, payload);
        if (!res.success) throw new Error(res.error);
      }
    },
    onSuccess: () => {
      toast.success(editingBooking ? 'Booking updated!' : 'Booking added!');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['bookings', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await api.delete(`/api/trips/${tripId}/bookings/${bookingId}`);
      if (!res.success) throw new Error(res.error as string);
    },
    onSuccess: () => {
      toast.success('Booking deleted');
      queryClient.invalidateQueries({ queryKey: ['bookings', tripId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setShowForm(false);
    setEditingBooking(null);
    setType('flight');
    setProvider('');
    setConfirmationNo('');
    setOrigin('');
    setDestination('');
    setDepartureAt('');
    setCost('');
  }

  function startEdit(booking: Booking) {
    setEditingBooking(booking);
    setType(booking.type);
    setProvider(booking.provider || '');
    setConfirmationNo(booking.confirmationNo || '');
    setOrigin(booking.origin || '');
    setDestination(booking.destination || '');
    setDepartureAt(booking.departureAt ? booking.departureAt.slice(0, 16) : '');
    setCost(booking.cost || '');
    setShowForm(true);
  }

  return (
    <div className="px-6 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
      <Link href={`/trips/${tripId}`} className="inline-flex items-center text-base font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Trip
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Bookings</h1>
      </div>

      {showForm ? (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium">{editingBooking ? 'Edit Booking' : 'Add Booking'}</h3>
              <button onClick={resetForm} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveBooking.mutate();
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
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
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saveBooking.isPending}>
                  {saveBooking.isPending ? 'Saving...' : (editingBooking ? 'Save Changes' : 'Add Booking')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => { setEditingBooking(null); setShowForm(true); }}
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
              <Card key={booking.id} className="group">
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-base">
                        {booking.origin && booking.destination
                          ? `${booking.origin} → ${booking.destination}`
                          : booking.provider || booking.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {booking.provider && <span>{booking.provider}</span>}
                      {booking.confirmationNo && <span>#{booking.confirmationNo}</span>}
                      {booking.departureAt && (
                        <span>
                          {format(new Date(booking.departureAt), 'MMM d, HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      {booking.cost && (
                        <p className="font-semibold text-base">
                          ${parseFloat(booking.cost).toFixed(2)}
                        </p>
                      )}
                      <Badge variant="secondary">
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted"
                        onClick={() => startEdit(booking)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-destructive/10"
                        onClick={() => deleteBooking.mutate(booking.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
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
