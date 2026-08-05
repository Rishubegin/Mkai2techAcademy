import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const chooseData = [
  {
    id: 1,
    tagline: "Guidance",
    heading: "Career guidance for your future",
    subHeading: "We help you pick the right path after learning",
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&h=600&fit=crop",
  },
  {
    id: 2,
    tagline: "Batches",
    heading: "Small batch sizes",
    subHeading: "Fewer students mean more attention for you",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop",
  },
  {
    id: 3,
    tagline: "Support",
    heading: "Doubt support always",
    subHeading: "Ask questions anytime, get answers quickly",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=600&fit=crop",
  },
];
const WhyChooseUs = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl">Why we stand Out</h2>
      <h1 className="text-4xl text-center">Three reasons to choose us</h1>
      <ReasonsCard />
    </div>
  );
};

const ReasonsCard = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-6 md:gap-4 md:flex-wrap xl:flex-nowrap justify-center">
      {chooseData.map((data) => (
        <div key={data.id} className="px-3 h-full">
          <Card className="h-full flex flex-col justify-between py-0 rounded-2xl overflow-hidden ">
            <div className="w-full h-48 overflow-hidden rounded-t-2xl">
              <img
                src={data.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6 flex flex-col gap-4">
              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{data.heading}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.subHeading}
                </p>
              </div>

              {/* Button */}
              <Button variant="outline" className="mt-6 w-fit cursor-pointer">
                Explore
              </Button>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default WhyChooseUs;
