'use client';

import { Hotel } from 'lucide-react';

export default function SearchHotelsPage() {
  return (
    <div className="px-6 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-8">Search Hotels</h1>

      <div className="rounded-3xl bg-white p-12 shadow-md border-0">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-24 w-24 rounded-full bg-green-50 mb-6">
            <Hotel className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-medium mb-2">Coming Soon</h2>
          <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
            Hotel search around your destination is planned for Phase 2.
            You can manually add hotel bookings to your trips in the meantime.
          </p>
        </div>
      </div>
    </div>
  );
}
