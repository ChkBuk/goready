'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hotel } from 'lucide-react';

export default function SearchHotelsPage() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Hotels</h1>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Hotel className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <CardHeader className="p-0">
            <CardTitle className="text-lg">Coming Soon</CardTitle>
          </CardHeader>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Hotel search around your destination is planned for Phase 2.
            You can manually add hotel bookings to your trips in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
