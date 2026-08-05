const TermsPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: August 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Enrollment</h2>
        <p className="text-muted-foreground">
          Enrolling in a batch reserves a seat subject to availability. Batches
          have a fixed capacity, and enrollment closes once a batch is full.
          Coaching sessions are conducted offline at our Lucknow center unless
          otherwise stated.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Account responsibilities</h2>
        <p className="text-muted-foreground">
          You are responsible for keeping your account credentials confidential
          and for the accuracy of the information you provide during
          registration.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Fees</h2>
        <p className="text-muted-foreground">
          Course fees are currently collected offline at our center. Fee
          amounts shown on the site are indicative and may be confirmed at the
          time of enrollment.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Changes to these terms</h2>
        <p className="text-muted-foreground">
          We may update these terms from time to time. Continued use of the
          platform after changes constitutes acceptance of the updated terms.
        </p>
      </section>
    </div>
  );
};

export default TermsPage;
