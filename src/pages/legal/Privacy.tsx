import LegalPage, { Clause } from "./LegalPage";

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    description="How Blue Top Villa collects, uses and protects the personal information you provide when making a reservation."
  >
    <p>
      This Privacy Policy explains how Blue Top Villa (Hotel &amp; Events), Kasoa, Ghana handles the personal
      information you share with us when you book a room, reserve our venue, reserve a spot at an event or contact us.
    </p>

    <Clause heading="Information We Collect">
      <p>We collect only what we need to manage your reservation: your name, phone number, email address, optional
        nationality, stay or event dates, guest numbers, service preferences and any special requests you send us.</p>
    </Clause>
    <Clause heading="How We Use Your Information">
      <p>Your information is used to confirm and manage your reservation, to contact you about it by phone, SMS,
        WhatsApp or email, and to prepare for your arrival or event. We do not sell your information.</p>
    </Clause>
    <Clause heading="Sharing">
      <p>Information is shared only with Blue Top Villa staff who need it to serve you, and with service providers
        that help us operate the website, send notifications or process payments.</p>
    </Clause>
    <Clause heading="Data Retention">
      <p>Reservation records are kept for as long as necessary for operational, accounting and legal purposes,
        after which they are deleted.</p>
    </Clause>
    <Clause heading="Security">
      <p>Reservation data is stored on secured, access-controlled systems. Only authorised staff can view reservation
        details, and internal notes are visible to administrators only.</p>
    </Clause>
    <Clause heading="Your Rights">
      <p>You may request a copy of the information we hold about you, ask us to correct it, or ask us to delete it
        where we are not required to keep it.</p>
    </Clause>
    <Clause heading="Contact">
      <p>For privacy requests, call 055 917 1787 or email info@bluetopvilla.com.</p>
    </Clause>
  </LegalPage>
);

export default Privacy;