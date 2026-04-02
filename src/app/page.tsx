import Link from 'next/link';
import { MapPin, Calendar, Receipt, Users, Plane, Map, ChevronRight } from 'lucide-react';
import { GoReadyLogo } from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <GoReadyLogo size={36} />
            <span className="text-xl font-semibold tracking-tight">GoReady</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-base font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="py-24 px-6 md:py-32 lg:py-40">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-5 py-2 text-base font-medium text-primary mb-8">
              <Plane className="h-4 w-4" />
              Your all-in-one trip planner
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1]">
              Plan your perfect trip,{' '}
              <span className="text-primary">all in one place</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create day-by-day itineraries, search flights and hotels, track expenses,
              split costs with friends, and manage all your bookings.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
              >
                Start planning free
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-base font-medium hover:bg-muted transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Stats section */}
        <section className="py-24 px-6 md:py-32 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: 'Free', label: 'To get started' },
                { value: '100+', label: 'Countries supported' },
                { value: '24/7', label: 'Access your plans' },
                { value: 'Unlimited', label: 'Trip members' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl md:text-5xl font-medium text-primary">{stat.value}</p>
                  <p className="text-base text-muted-foreground mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 md:py-32">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-medium tracking-tight">
                Everything you need for your trip
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                From planning to budgeting, GoReady helps you organize every detail of your journey.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Calendar,
                  title: 'Day-by-day planner',
                  description:
                    'Organize activities by day with time slots, categories, and notes. Drag to reorder your schedule.',
                  color: 'bg-blue-50 text-blue-600',
                },
                {
                  icon: Plane,
                  title: 'Search & book travel',
                  description:
                    'Search flights, hotels, buses, trains, and ferries. Compare prices and book with providers.',
                  color: 'bg-red-50 text-red-600',
                },
                {
                  icon: Map,
                  title: 'Maps & navigation',
                  description:
                    'See all your activities on Google Maps. Get transport suggestions between stops.',
                  color: 'bg-green-50 text-green-600',
                },
                {
                  icon: Receipt,
                  title: 'Expense tracking',
                  description:
                    'Record every expense, split costs with friends by any ratio, and see who owes whom.',
                  color: 'bg-amber-50 text-amber-600',
                },
                {
                  icon: Users,
                  title: 'Travel together',
                  description:
                    'Invite travel partners, collaborate on itineraries in real-time, and share expenses.',
                  color: 'bg-purple-50 text-purple-600',
                },
                {
                  icon: MapPin,
                  title: 'Smart suggestions',
                  description:
                    'Get restaurant suggestions near activities, with optimal meal-time scheduling.',
                  color: 'bg-teal-50 text-teal-600',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl bg-white p-10 shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-100/60">
                      <feature.icon className="h-7 w-7 text-foreground" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-24 px-6 md:py-32 bg-primary rounded-none">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white">
              Ready to plan your next adventure?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
              Join GoReady and start organizing your perfect trip today. It&apos;s free to get started.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-medium text-primary shadow-md hover:bg-white/90 transition-colors"
              >
                Get started on GoReady
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 px-6 text-center text-base text-muted-foreground">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <GoReadyLogo size={28} />
            <span className="font-semibold text-foreground">GoReady</span>
          </div>
          <p>&copy; {new Date().getFullYear()} GoReady. Plan your trip with confidence.</p>
        </div>
      </footer>
    </div>
  );
}
