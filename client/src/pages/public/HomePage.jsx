import { Button } from "@/components/ui/button";
import CoursesCarousel from "@/components/home/CoursesCarousel";
import StudentSuccess from "@/components/home/StudentSuccess";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import OurFaculty from "@/components/home/OurFaculty";
import GetInTouch from "@/components/home/GetInTouch";
import InquirySection from "@/components/home/InquirySection";
import GalleryCarousel from "@/components/home/GalleryCarousel";
import SliderImport from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Slider = SliderImport.default || SliderImport;

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <CoursesCarousel />
      <WhyChooseUs />
      <OurFaculty />
      <StudentSuccess />
      <GalleryCarousel />
      <GetInTouch />
      <InquirySection />
    </div>
  );
};

const images = [
  "/hero_section_1.png",
  "/hero_section_2.png",
  "/hero_section_3.png",
];

const HeroSection = () => {
  const settings = {
    dots: false,
    infinite: true,
    autoplay: true,
    speed: 800,
    autoplaySpeed: 3000,
    arrows: false,
    fade: true,
    pauseOnHover: false,
  };

  return (
    <div className="w-full">
      {/* Banner Slider */}
      <Slider {...settings} className="w-full">
        {images.map((img, index) => (
          <div key={index}>
            <img
              src={img}
              alt={`Hero banner ${index + 1}`}
              className="block w-full h-auto"
            />
          </div>
        ))}
      </Slider>

      {/* Text content, stacked below the banner */}
      <div className="bg-background flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-navy dark:text-white">
            All courses, all
          </h1>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-navy dark:text-white">
            skills, one place
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-lg md:text-xl text-dark-gray dark:text-white/90">
            Master school academics, competitive exams, computer skills, and
            programming in Lucknow.
          </p>
          <p className="text-sm sm:text-lg md:text-xl text-dark-gray dark:text-white/90">
            Learn from experienced instructors with practical training designed
            for real success.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="cursor-pointer bg-gold text-navy hover:bg-gold/90"
            >
              Join now
            </Button>
            <Button size="lg" className="cursor-pointer" variant="outline">
              Contact us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
