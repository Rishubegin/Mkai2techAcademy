import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/lib/utils";

const EventDetailPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data.event);
    } catch (err) {
      setError(err.response?.data?.message || "Event not found");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading) {
    return <p className="text-center py-20 text-muted-foreground">Loading...</p>;
  }

  if (error || !event) {
    return <p className="text-center py-20 text-destructive">{error}</p>;
  }

  const filled = event.attendees?.length || 0;
  const isFull = filled >= event.maxAttendees;
  const isPast = new Date(event.date) < new Date();
  const alreadyRegistered =
    user && event.attendees?.some((a) => (a.student?._id || a.student) === user._id);

  const handleRegister = async () => {
    setSubmitting(true);
    setActionMessage("");
    try {
      await api.post(`/events/${eventId}/register`);
      setActionMessage("Registered successfully!");
      loadEvent();
    } catch (err) {
      setActionMessage(err.response?.data?.Error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    setSubmitting(true);
    setActionMessage("");
    try {
      await api.delete(`/events/${eventId}/register`);
      setActionMessage("Registration cancelled");
      loadEvent();
    } catch (err) {
      setActionMessage(err.response?.data?.Error || "Failed to cancel registration");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {event.image && (
        <div className="aspect-video overflow-hidden rounded-xl">
          <img
            src={resolveMediaUrl(event.image)}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-navy dark:text-white">{event.title}</h1>
        <p className="text-muted-foreground mt-3">{event.description}</p>
      </div>

      <Card>
        <CardContent className="p-6 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
          </div>
          {event.time && (
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-medium">{event.time}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{event.location}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fee</p>
            <p className="font-medium">{event.fee > 0 ? `₹${event.fee}` : "Free"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Seats</p>
            <p className="font-medium">
              {filled}/{event.maxAttendees}
            </p>
          </div>
        </CardContent>
      </Card>

      {actionMessage && <p className="text-sm">{actionMessage}</p>}

      {!user ? (
        <Button asChild className="w-full sm:w-auto">
          <Link to="/loginSignUp">Login to Register</Link>
        </Button>
      ) : user.role !== "student" ? null : isPast ? (
        <Button disabled className="w-full sm:w-auto">
          Event has ended
        </Button>
      ) : alreadyRegistered ? (
        <Button
          variant="destructive"
          disabled={submitting}
          onClick={handleUnregister}
          className="w-full sm:w-auto"
        >
          {submitting ? "Cancelling..." : "Cancel Registration"}
        </Button>
      ) : (
        <Button
          disabled={isFull || submitting}
          onClick={handleRegister}
          className="w-full sm:w-auto"
        >
          {isFull ? "Event Full" : submitting ? "Registering..." : "Register"}
        </Button>
      )}
    </div>
  );
};

export default EventDetailPage;
