import LegalPage, { Clause } from "./LegalPage";

const Terms = () => (
  <LegalPage
    title="Terms & Conditions"
    description="The terms and conditions that govern room bookings, venue reservations and event reservations at Blue Top Villa, Kasoa."
  >
    <p>
      These Terms &amp; Conditions govern all reservations made with Blue Top Villa (Hotel &amp; Events), Kasoa,
      Ghana — including room bookings, venue reservations and event reservations. By submitting a reservation you
      accept the terms below.
    </p>

    <Clause heading="1. Reservation Confirmation">
      <p>Reservations are subject to availability and are only confirmed after Blue Top Villa contacts the guest.</p>
    </Clause>
    <Clause heading="2. Accurate Information">
      <p>Guests must provide truthful and accurate information. Incorrect contact details may prevent us from confirming your reservation.</p>
    </Clause>
    <Clause heading="3. Payment">
      <p>Some reservations may require deposits before confirmation. Any amount shown at the time of booking is an estimate only; the final amount is confirmed by Blue Top Villa.</p>
    </Clause>
    <Clause heading="4. Cancellation">
      <p>Cancellation policies vary depending on reservation type. Please review our Cancellation Policy for full details.</p>
    </Clause>
    <Clause heading="5. Refund Policy">
      <p>Refunds are subject to Blue Top Villa's cancellation policy.</p>
    </Clause>
    <Clause heading="6. Guest Responsibilities">
      <p>Guests must obey hotel rules and conduct themselves respectfully towards staff and other guests at all times.</p>
    </Clause>
    <Clause heading="7. Property Damage">
      <p>Guests are financially responsible for damages caused during their stay or event.</p>
    </Clause>
    <Clause heading="8. Event Reservations">
      <p>Venue bookings are only confirmed after approval by management.</p>
    </Clause>
    <Clause heading="9. Event Capacity">
      <p>Blue Top Villa reserves the right to reject bookings exceeding venue capacity.</p>
    </Clause>
    <Clause heading="10. Privacy">
      <p>Customer information is only used for reservation management. We may contact you by phone, SMS, WhatsApp or email regarding your reservation.</p>
    </Clause>
    <Clause heading="11. Policy Updates">
      <p>Blue Top Villa reserves the right to modify these policies at any time.</p>
    </Clause>
    <Clause heading="Contact">
      <p>Questions? Call 055 917 1787 or email info@bluetopvilla.com.</p>
    </Clause>
  </LegalPage>
);

export default Terms;