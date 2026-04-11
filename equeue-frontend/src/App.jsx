import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const serviceOptions = ['General Inquiry', 'License Renewal', 'Document Verification', 'Health Service'];

const SLOT_OPTIONS = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '11:00 - 11:30',
  '11:30 - 12:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
  '15:30 - 16:00',
];

const formatDateForInput = (date) => date.toISOString().split('T')[0];

function App() {
  const [serviceType, setServiceType] = useState(serviceOptions[0]);
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [slots, setSlots] = useState([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(formatDateForInput(new Date()));
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  const availableSlots = useMemo(() => {
    if (slots.length > 0) return slots;
    return SLOT_OPTIONS;
  }, [slots]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/appointments`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error(error);
      setMessage('Unable to fetch appointments');
    }
  };

  const fetchAvailability = async () => {
    if (!serviceType || !date) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(
        `${API_BASE}/api/slots/availability?serviceType=${encodeURIComponent(serviceType)}&date=${date}`
      );
      const data = await response.json();
      if (response.ok) {
        setSlots(data.availableSlots);
        setTimeSlot(data.availableSlots[0] || '');
      } else {
        setMessage(data.error || 'Failed to fetch availability');
      }
    } catch (error) {
      console.error(error);
      setMessage('Backend connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [serviceType, date]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBooking = async (event) => {
    event.preventDefault();
    if (!timeSlot) {
      setMessage('Please select a valid time slot.');
      return;
    }

    const payload = {
      serviceType,
      date,
      timeSlot,
      userName,
      userEmail,
      userPhone,
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Appointment booked successfully.');
        setUserName('');
        setUserEmail('');
        setUserPhone('');
        fetchAppointments();
        fetchAvailability();
      } else {
        setMessage(data.error || 'Booking failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Booking request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, { method: 'PATCH' });
      const data = await response.json();
      if (response.ok) {
        setMessage('Appointment cancelled.');
        fetchAppointments();
        fetchAvailability();
      } else {
        setMessage(data.error || 'Cancellation failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Cancellation request failed.');
    } finally {
      setLoading(false);
    }
  };

  const startReschedule = (appointment) => {
    setRescheduleId(appointment._id);
    setRescheduleDate(formatDateForInput(new Date(appointment.date)));
    setRescheduleSlot(appointment.timeSlot);
  };

  const submitReschedule = async (event) => {
    event.preventDefault();
    if (!rescheduleId || !rescheduleSlot) {
      setMessage('Please select a valid new slot.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/appointments/${rescheduleId}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rescheduleDate, timeSlot: rescheduleSlot }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Appointment rescheduled successfully.');
        setRescheduleId(null);
        setRescheduleSlot('');
        fetchAppointments();
        fetchAvailability();
      } else {
        setMessage(data.error || 'Reschedule failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Reschedule request failed.');
    } finally {
      setLoading(false);
    }
  };

  const closeReschedule = () => {
    setRescheduleId(null);
    setRescheduleSlot('');
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20">
          <h1 className="text-3xl font-semibold text-white">EQueue Appointment System</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Book, cancel, and reschedule service appointments with live slot availability.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
            <div>
              <h2 className="text-2xl font-semibold text-white">Book an Appointment</h2>
              <p className="mt-2 text-slate-400">Choose service, date, and available slot.</p>
            </div>

            <form className="space-y-4" onSubmit={handleBooking}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Service type
                  <select
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    {serviceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Preferred date
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <label className="block">Available slot</label>
                <select
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    <option value="">No available slots</option>
                  )}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Name
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your full name"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Email
                  <input
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm text-slate-300">
                Phone
                <input
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Your phone number"
                  type="tel"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Book Appointment'}
              </button>
            </form>

            {message && (
              <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
                {message}
              </div>
            )}
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
            <div>
              <h2 className="text-2xl font-semibold text-white">Your Appointments</h2>
              <p className="mt-2 text-slate-400">Manage bookings, cancel slots, or reschedule appointments.</p>
            </div>

            {appointments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-6 text-slate-400">
                No appointments yet.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="rounded-3xl border border-slate-700 bg-slate-950/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-sky-300">{appointment.serviceType}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{new Date(appointment.date).toLocaleDateString()}</p>
                        <p className="text-slate-400">{appointment.timeSlot}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          appointment.status === 'Confirmed'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : appointment.status === 'Cancelled'
                            ? 'bg-rose-500/15 text-rose-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="text-sm text-slate-400">
                        <p>{appointment.userName}</p>
                        <p>{appointment.userEmail}</p>
                        <p>{appointment.userPhone}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancel(appointment._id)}
                          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => startReschedule(appointment)}
                          className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {rescheduleId && (
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Reschedule Appointment</h2>
                <p className="mt-2 text-slate-400">Select a new date and time for the appointment.</p>
              </div>
              <button
                type="button"
                onClick={closeReschedule}
                className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <form className="grid gap-4 sm:grid-cols-3" onSubmit={submitReschedule}>
              <label className="space-y-2 text-sm text-slate-300">
                New date
                <input
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                New slot
                <select
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                >
                  {SLOT_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
