import LegalPage, { Clause } from "./LegalPage";

const Cancellation = () => (
  <LegalPage
    title="Cancellation Policy"
    description="Blue Top Villa's cancellation and refund terms for room bookings, venue reservations and event reservations."
  >
    <p>
      Cancellation terms depend on the type of reservation. All cancellations must be communicated to Blue Top Villa
      directly by phone, WhatsApp or email, quoting your reservation reference number.
    </p>

    <Clause heading="Room Bookings">
      <p>Cancellations made well ahead of the check-in date can normally be cancelled or rescheduled at no cost.
        Late cancellations and no-shows may attract a charge equal to the first night, and any deposit paid may be
        retained.</p>
    </Clause>
    <Clause heading="Venue Reservations">
      <p>Venue reservations involve setup, staffing and supplier commitments. Deposits may be non-refundable once
        preparations have begun, and cancellations close to the event date may attract a cancellation fee.</p>
    </Clause>
    <Clause heading="Event Reservations">
      <p>Spots reserved for posted events (VIP tables, bottle reservations and similar arrangements) may be released
        if you do not arrive within a reasonable time after the event begins.</p>
    </Clause>
    <Clause heading="Rescheduling">
      <p>Where availability allows, we will always try to move your reservation to another date instead of cancelling it.</p>
    </Clause>
    <Clause heading="Refunds">
      <p>Approved refunds are processed to the original payment method or mobile money number. Processing times depend
        on your payment provider.</p>
    </Clause>
    <Clause heading="Changes by Blue Top Villa">
      <p>In the rare event that we must cancel a confirmed reservation, you will be offered an alternative date or a
        full refund of any amount paid.</p>
    </Clause>
    <Clause heading="Contact">
      <p>To cancel or reschedule, call 055 917 1787 or email info@bluetopvilla.com with your reference number.</p>
    </Clause>
  </LegalPage>
);

export default Cancellation;