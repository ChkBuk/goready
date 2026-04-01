'use client';

import { Plane } from 'lucide-react';

export default function SearchFlightsPage() {
  return (
    <div className="px-5 py-8 md:px-10 max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Search Flights</h1>

      <div className="rounded-2xl bg-card p-8 md:p-12 shadow-sm border border-border/50">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-6">
            <Plane className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Flight search with Amadeus API integration is planned for Phase 2.
            You can manually add flight bookings to your trips in the meantime.
          </p>
        </div>
      </div>
    </div>
  );
}
