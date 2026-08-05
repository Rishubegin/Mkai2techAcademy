import { Mail, Phone, MapPin, ChevronRight, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const contactInfo = [
  {
    name: "Email",
    logo: <Mail />,
    tagline: "Send us your inquiry",
    Email: "mkai2techacademy@gmail.com",
  },
  {
    name: "Phone",
    logo: <Phone />,
    tagline: "Call us during office hours",
    Phone: ["+91 8881439401", "+91 9608439401"],
  },
  {
    name: "Office",
    logo: <MapPin />,
    tagline: "Visit our office",
    Office:
      "M kai² Tech Academy, Shop No-24, Bhola Market Sugamau Road, Near CIS, Indira Nagar, Lucknow-226016",
  },
];

const handleCopy = (text) => {
  navigator.clipboard.writeText(text);
};

const GetInTouch = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        {/* Heading — order-1 on mobile, top-left cell on desktop */}
        <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1 max-w-xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Get in touch</h1>
          <p className="text-sm md:text-base leading-relaxed">
            Have questions about courses or admissions? We are here to help you
            find the right path.
          </p>
        </div>

        {/* RIGHT SIDE IMAGE — order-2 on mobile (right after the heading),
            right column on desktop, spanning both rows so its top lines up
            with the heading and it fills the same height as the heading +
            contact cards combined. */}
        <div className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 w-full h-64 lg:h-full">
          <div className="w-full h-full overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=800&fit=crop"
              alt="Our team ready to help with your questions"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* LEFT SIDE — contact cards — order-3 on mobile (after the image) */}
        <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2 flex flex-col gap-6 w-full">
          {contactInfo.map((info, index) => (
            <Card key={index} className="border-none shadow-none px-6">
              <CardContent className="p-0 flex gap-4 items-start">
                {/* Icon */}
                <div>
                  <div className="text-lg pt-1">{info.logo}</div>
                  <div className="pt-1">{info.name}</div>
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-semibold text-lg">{info.tagline}</h3>

                  <div className="text-sm mt-1 space-y-1">
                    {info.Email && (
                      <div className="flex items-center gap-2">
                        <p>{info.Email}</p>
                        <Copy
                          size={14}
                          className="cursor-pointer hover:opacity-70"
                          onClick={() => handleCopy(info.Email)}
                        />
                      </div>
                    )}

                    {info.Phone &&
                      info.Phone.map((phone, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <p>{phone}</p>
                          <Copy
                            size={14}
                            className="cursor-pointer hover:opacity-70"
                            onClick={() => handleCopy(phone)}
                          />
                        </div>
                      ))}

                    {info.Office && (
                      <div className="flex items-start gap-2">
                        <p>{info.Office}</p>
                        <Copy
                          size={20}
                          className="cursor-pointer hover:opacity-70 mt-1"
                          onClick={() => handleCopy(info.Office)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Button */}
          <div>
            <button className="text-sm cursor-pointer hover:underline">
              Get directions <ChevronRight size={16} className="inline" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetInTouch;
