import Link from 'next/link';
import { MapPin, Calendar, Receipt, Users, Plane, Map } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GoReady</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Plan Your Perfect Trip,{' '}
              <span className="text-primary">All in One Place</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Plan day-by-day itineraries, search flights and hotels, track expenses,
              split costs with friends, and manage all your bookings — from start to
              finish.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Start Planning Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-input px-8 py-3 text-sm font-medium shadow-sm hover:bg-accent"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-12">
              Everything You Need for Your Trip
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Calendar,
                  title: 'Day-by-Day Planner',
                  description:
                    'Organize activities by day with time slots, categories, and notes. Drag to reorder.',
                },
                {
                  icon: Plane,
                  title: 'Search & Book Travel',
                  description:
                    'Search flights, hotels, buses, trains, and ferries. Compare prices and book with providers.',
                },
                {
                  icon: Map,
                  title: 'Maps & Navigation',
                  description:
                    'See all your activities on Google Maps. Get transport suggestions between stops.',
                },
                {
                  icon: Receipt,
                  title: 'Expense Tracking',
                  description:
                    'Record every expense, split costs with friends, and see who owes whom.',
                },
                {
                  icon: Users,
                  title: 'Travel Together',
                  description:
                    'Invite travel partners, collaborate on itineraries, and share expenses.',
                },
                {
                  icon: MapPin,
                  title: 'Smart Suggestions',
                  description:
                    'Get restaurant suggestions near activities, with optimal meal-time scheduling.',
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center p-6">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GoReady. Plan your trip with confidence.</p>
      </footer>
    </div>
  );
}
