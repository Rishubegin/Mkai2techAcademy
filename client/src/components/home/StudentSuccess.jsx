import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/utils";

const fallbackTestimonials = [
  {
    name: "Rajesh Kumar",
    role: "Class 12 student",
    image: "./avatar/avatar_image_1.png",
    text: "I went from struggling in math to scoring 95 percent. The teachers here actually care about your progress.",
  },
  {
    name: "Priya Singh",
    role: "NEET aspirant",
    image: "./avatar/avatar_image_2.png",
    text: "The NEET coaching was intense but worth it. I got into my dream medical college because of this academy.",
  },
  {
    name: "Saurabh Chaudhary",
    role: "Programming student",
    image: "./avatar/avatar_image_3.png",
    text: "Programming felt impossible until I joined. Now I build real projects and understand the logic behind code.",
  },
  {
    name: "Babita Srivastava",
    role: "Class 12 student",
    image: "./avatar/avatar_image_4.png",
    text: "My concepts became very clear after joining. I improved a lot in science and now I feel confident in exams.",
  },
  {
    name: "Aman Gupta",
    role: "JEE aspirant",
    image: "./avatar/avatar_image_5.png",
    text: "The problem-solving approach taught here is amazing. It helped me improve my rank and understanding.",
  },
  {
    name: "Neha Sharma",
    role: "Commerce student",
    image: "./avatar/avatar_image_6.png",
    text: "The teachers explain everything in a very simple way. I scored much better marks in accounts and economics.",
  },
];

const StudentSuccess = () => {
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    api
      .get("/testimonials", { params: { limit: 6 } })
      .then((res) => {
        if (res.data.testimonials?.length > 0) {
          setTestimonials(
            res.data.testimonials.map((t) => ({
              name: t.name,
              role: t.position || t.result || "Student",
              image: resolveMediaUrl(t.photo),
              text: t.shortQuote || t.testimonial,
            })),
          );
        }
      })
      .catch(() => {
        // keep fallback testimonials if the API isn't reachable
      });
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">Student success</h2>
        <p className="text-sm text-muted-foreground">
          Hear from those who made it
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3 max-w-6xl mx-auto">
        {testimonials.map((item, index) => (
          <Card
            key={index}
            className="rounded-2xl border-light-gold transition-transform duration-300 hover:scale-105 hover:cursor-pointer"
          >
            <CardContent className="p-6 space-y-4">
              {/* Stars */}
              <div className="flex gap-1 text-sm text-gold">
                <Star className="fill-gold" size={16} />
                <Star className="fill-gold" size={16} />
                <Star className="fill-gold" size={16} />
                <Star className="fill-gold" size={16} />
                <Star className="fill-gold" size={16} />
              </div>

              {/* Text */}
              <p className="text-sm leading-relaxed text-navy dark:text-foreground">
                {item.text}
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-12 w-12">
                  {item.image && <AvatarImage src={item.image} />}
                  <AvatarFallback>{item.name[0]}</AvatarFallback>
                </Avatar>

                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StudentSuccess;
