const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">About M Kai² Tech Academy</h1>
        <p className="text-muted-foreground">
          Lucknow-based offline coaching for school academics, competitive exams,
          computer courses, and professional skill development.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">Our mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          We help students at every stage — from school academics to competitive
          exam preparation to career-ready technical skills — with small batch
          sizes, personal attention, and instructors who track individual progress
          rather than teaching to the average.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">What we offer</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>School academics for classes 1st–12th, with PCMB focus in senior classes</li>
          <li>NEET and IIT-JEE competitive exam coaching</li>
          <li>Computer courses: ADCA, DCA, Tally, CCC, O Level</li>
          <li>Professional and skill development: digital marketing, video editing, ethical hacking</li>
          <li>Programming from basics to advanced: C, C++, Java, Python, MERN stack, DSA</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Why choose us</h2>
        <p className="text-muted-foreground leading-relaxed">
          Small batch sizes mean more attention per student, career guidance
          beyond the classroom, and doubt support whenever you need it.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;
