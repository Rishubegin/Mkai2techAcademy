import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { resolveMediaUrl, COURSE_PLACEHOLDER_IMAGE } from "@/lib/utils";

const fallbackCourses = [
  {
    _id: "school-academics",
    title: "School Academics for all classes",
    description:
      "Classes 1st–10th all subjects. Classes 11th and 12th focus on PCMB streams with depth.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop",
  },
  {
    _id: "competitive-exams",
    title: "Competitive Exams preparation",
    description: "NEET & IIT-JEE coaching with foundation courses for 11th and 12th.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
  },
  {
    _id: "computer-courses",
    title: "Computer Courses for everyone",
    description: "ADCA, DCA, Tally, CCC, O Level programs available.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
  },
  {
    _id: "skill-development",
    title: "Professional and skill development",
    description: "Digital marketing, video editing, and ethical hacking courses.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
  },
  {
    _id: "programming",
    title: "Programming from basics to advanced",
    description: "C, C++, Java, Python, MERN stack and DSA.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
  },
];

// A continuously-scrolling marquee (same technique as GalleryCarousel) instead
// of a slidesToShow-based slider: react-slick's autoplay has no slide to
// advance to once the live course count matches slidesToShow, which made the
// old carousel here look completely frozen once real courses replaced the
// fallback data. Duplicating the track and translating by exactly -50% loops
// smoothly no matter how many courses exist, so this always moves.
const CoursesCarousel = () => {
  const [courses, setCourses] = useState(fallbackCourses);
  const [isFallback, setIsFallback] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/courses/featured")
      .then((res) => {
        if (res.data.courses?.length > 0) {
          setCourses(res.data.courses);
          setIsFallback(false);
        }
      })
      .catch(() => {
        // keep fallback marketing copy if the API isn't reachable
      });
  }, []);

  // Need at least a few cards for the loop to feel continuous rather than
  // obviously repeating every couple seconds.
  const track = courses.length < 4 ? [...courses, ...courses, ...courses] : [...courses, ...courses];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl">Explore Our best Courses</h2>
      <h1 className="text-4xl text-center">Choose Your Path to Success</h1>

      <div className="w-full max-w-6xl mx-auto mt-10 overflow-hidden group">
        <div className="flex w-max animate-marquee-courses group-hover:[animation-play-state:paused]">
          {track.map((data, i) => (
            <div key={`${data._id}-${i}`} className="w-72 sm:w-80 mx-3 shrink-0">
              <Card className="group h-96 gap-0 overflow-hidden rounded-2xl border-gold/30 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl">
                <div className="h-40 w-full shrink-0 overflow-hidden">
                  <img
                    src={resolveMediaUrl(data.image) || COURSE_PLACEHOLDER_IMAGE}
                    alt={data.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                <CardContent className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-navy dark:text-white">
                      {data.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {data.description}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-4 w-fit border-gold text-navy transition-transform duration-300 hover:scale-105 hover:cursor-pointer hover:bg-gold hover:text-navy dark:text-gold"
                    onClick={() => navigate(isFallback ? "/courses" : `/courses/${data._id}`)}
                  >
                    Explore
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <Button asChild variant="outline">
          <Link to="/courses">View All Courses</Link>
        </Button>
      </div>
    </div>
  );
};

export default CoursesCarousel;
