const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: August 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Information we collect</h2>
        <p className="text-muted-foreground">
          When you register, enroll in a course, or contact us, we collect your
          name, email address, phone number, and any message you send us. We do
          not collect payment information as course enrollment is currently
          managed offline.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How we use your information</h2>
        <p className="text-muted-foreground">
          We use your information to manage your enrollment, communicate about
          batch schedules, and respond to inquiries submitted through our
          contact form. We do not sell your information to third parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Data retention</h2>
        <p className="text-muted-foreground">
          We retain account and enrollment records for as long as your account
          is active. You can request deletion of your account by contacting us
          directly.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="text-muted-foreground">
          Questions about this policy can be sent to mkai2techacademy@gmail.com.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
