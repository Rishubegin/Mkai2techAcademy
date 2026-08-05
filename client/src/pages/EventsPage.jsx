import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/utils";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [showPast, setShowPast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/events", { params: showPast ? { past: true } : { upcoming: true } })
      .then((res) => setEvents(res.data.events))
      .finally(() => setLoading(false));
  }, [showPast]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Events & Workshops</h1>
        <p className="text-muted-foreground">Join our upcoming workshops and academy events.</p>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant={!showPast ? "default" : "outline"}
          onClick={() => setShowPast(false)}
        >
          Upcoming
        </Button>
        <Button
          size="sm"
          variant={showPast ? "default" : "outline"}
          onClick={() => setShowPast(true)}
        >
          Past Events
        </Button>
      </div>

      {loading && <p className="text-center text-muted-foreground">Loading...</p>}
      {!loading && events.length === 0 && (
        <p className="text-center text-muted-foreground">
          No {showPast ? "past" : "upcoming"} events right now.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => {
          const filled = event.attendees?.length || 0;
          return (
            <Link key={event._id} to={`/events/${event._id}`}>
              <Card className="h-full hover:border-gold transition-colors">
                {event.image && (
                  <div className="aspect-video overflow-hidden rounded-t-xl">
                    <img
                      src={resolveMediaUrl(event.image)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-medium text-navy dark:text-white">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()} {event.time && `· ${event.time}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>{event.fee > 0 ? `₹${event.fee}` : "Free"}</span>
                    <span>
                      {filled}/{event.maxAttendees} registered
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default EventsPage;
