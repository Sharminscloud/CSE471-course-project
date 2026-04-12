import { useEffect, useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import "./App.css";

function App() {
  const [branches, setBranches] = useState([]);
  const [tokenBranches, setTokenBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [open, setOpen] = useState("");
  const [close, setClose] = useState("");
  const [dailyCapacity, setDailyCapacity] = useState("");
  const [activeCounters, setActiveCounters] = useState("");
  const [status, setStatus] = useState("Active");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [message, setMessage] = useState("");

  const [tokenBranchId, setTokenBranchId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [preferredDate, setPreferredDate] = useState("2026-04-12");
  const [isPriority, setIsPriority] = useState("false");
  const [tokenMessage, setTokenMessage] = useState("");

  const [appointmentServiceType, setAppointmentServiceType] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("2026-04-12");
  const [appointmentTimeSlot, setAppointmentTimeSlot] = useState("");
  const [appointmentUserName, setAppointmentUserName] = useState("");
  const [appointmentUserEmail, setAppointmentUserEmail] = useState("");
  const [appointmentUserPhone, setAppointmentUserPhone] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");

  const BRANCH_API = "http://localhost:1163/api/branches";
  const TOKEN_API = "http://localhost:1163/api/tokens";
  const APPOINTMENT_API = "http://localhost:1163/api/appointments";
  const SLOT_API = "http://localhost:1163/api/slots";

  const getBranches = async () => {
    try {
      let url = BRANCH_API;
      const params = [];

      if (search) {
        params.push(`search=${search}`);
      }

      if (filterStatus) {
        params.push(`status=${filterStatus}`);
      }

      if (params.length > 0) {
        url = `${BRANCH_API}?${params.join("&")}`;
      }

      const res = await axios.get(url);
      setBranches(res.data);
    } catch (error) {
      setMessage("Failed to load branches");
    }
  };

  const getTokenBranches = async () => {
    try {
      const res = await axios.get(`${TOKEN_API}/branches`);
      setTokenBranches(res.data);
    } catch (error) {
      setTokenMessage("Failed to load token branches");
    }
  };

  const getServices = async () => {
    try {
      const res = await axios.get(`${TOKEN_API}/services`);
      setServices(res.data);
    } catch (error) {
      setTokenMessage("Failed to load services");
    }
  };

  const getTokens = async () => {
    try {
      const res = await axios.get(TOKEN_API);
      setTokens(res.data);
    } catch (error) {
      setTokenMessage("Failed to load tokens");
    }
  };

  const getAppointments = async () => {
    try {
      const res = await axios.get(APPOINTMENT_API);
      setAppointments(res.data);
    } catch (error) {
      setAppointmentMessage("Failed to load appointments");
    }
  };

  const getAvailableSlots = async () => {
    if (!appointmentServiceType || !appointmentDate) {
      setAvailableSlots([]);
      return;
    }

    try {
      const res = await axios.get(
        `${SLOT_API}/availability?serviceType=${encodeURIComponent(
          appointmentServiceType
        )}&date=${appointmentDate}`
      );
      setAvailableSlots(res.data.availableSlots || []);
    } catch (error) {
      setAvailableSlots([]);
      setAppointmentMessage("Failed to load available slots");
    }
  };

  useEffect(() => {
    getBranches();
  }, [search, filterStatus]);

  useEffect(() => {
    getTokenBranches();
    getServices();
    getTokens();
    getAppointments();
  }, []);

  useEffect(() => {
    getAvailableSlots();
  }, [appointmentServiceType, appointmentDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newBranch = {
      name,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      workingHours: {
        open,
        close,
      },
      dailyCapacity: Number(dailyCapacity),
      activeCounters: Number(activeCounters),
      status,
    };

    try {
      await axios.post(BRANCH_API, newBranch);
      setMessage("Branch created successfully");

      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setOpen("");
      setClose("");
      setDailyCapacity("");
      setActiveCounters("");
      setStatus("Active");

      getBranches();
      getTokenBranches();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create branch");
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(TOKEN_API, {
        branchId: tokenBranchId,
        serviceId,
        preferredDate,
        isPriority: isPriority === "true",
      });

      setTokenMessage(
        `Token created successfully: ${res.data.token.tokenNumber}`
      );

      getTokens();

      setTokenBranchId("");
      setServiceId("");
      setPreferredDate("2026-04-12");
      setIsPriority("false");
    } catch (error) {
      setTokenMessage(
        error.response?.data?.message || "Failed to create token"
      );
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(APPOINTMENT_API, {
        serviceType: appointmentServiceType,
        date: appointmentDate,
        timeSlot: appointmentTimeSlot,
        userName: appointmentUserName,
        userEmail: appointmentUserEmail,
        userPhone: appointmentUserPhone,
      });

      setAppointmentMessage("Appointment created successfully");
      setAppointmentTimeSlot("");
      setAppointmentUserName("");
      setAppointmentUserEmail("");
      setAppointmentUserPhone("");

      getAppointments();
      getAvailableSlots();
    } catch (error) {
      setAppointmentMessage(
        error.response?.data?.error || "Failed to create appointment"
      );
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.patch(`${APPOINTMENT_API}/${id}/cancel`);
      setAppointmentMessage("Appointment cancelled successfully");
      getAppointments();
      getAvailableSlots();
    } catch (error) {
      setAppointmentMessage(
        error.response?.data?.error || "Failed to cancel appointment"
      );
    }
  };

  const deleteBranch = async (id) => {
    try {
      await axios.delete(`${BRANCH_API}/${id}`);
      setMessage("Branch deleted successfully");
      getBranches();
      getTokenBranches();
    } catch (error) {
      setMessage("Failed to delete branch");
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await axios.put(`${BRANCH_API}/${id}`, { status: newStatus });
      setMessage(`Branch status changed to ${newStatus}`);
      getBranches();
      getTokenBranches();
    } catch (error) {
      setMessage("Failed to update status");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <img src={logo} alt="EQueue Logo" className="logo" />
          <div>
            <p className="project-name">
              Government Service Queue Transparency and Smart Slot Management
              System
            </p>
            <p className="subtitle">
              Module 1: Smart Branch Management and Capacity Control
            </p>
          </div>
        </div>

        {message && <div className="message">{message}</div>}



        <div className="card">
          <h2>Create Branch</h2>
          <form className="form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Branch Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />

            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />

            <input
              type="text"
              placeholder="Open Time (09:00)"
              value={open}
              onChange={(e) => setOpen(e.target.value)}
            />

            <input
              type="text"
              placeholder="Close Time (17:00)"
              value={close}
              onChange={(e) => setClose(e.target.value)}
            />

            <input
              type="number"
              placeholder="Daily Capacity"
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(e.target.value)}
            />

            <input
              type="number"
              placeholder="Active Counters"
              value={activeCounters}
              onChange={(e) => setActiveCounters(e.target.value)}
            />

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <button type="submit">Create Branch</button>
          </form>
        </div>
<div className="card">
          <h2>Branch List</h2>

          {branches.length === 0 ? (
            <p>No branches found</p>
          ) : (
            <div className="branch-list">
              {branches.map((branch) => (
                <div className="branch-card" key={branch._id}>
                  <div className="branch-top">
                    <h3>{branch.name}</h3>
                    <span
                      className={`status-badge ${(
                        branch.status || "Active"
                      ).toLowerCase()}`}
                    >
                      {branch.status}
                    </span>
                  </div>

                  <p>
                    <strong>Address:</strong> {branch.address}
                  </p>
                  <p>
                    <strong>Hours:</strong> {branch.workingHours?.open} -{" "}
                    {branch.workingHours?.close}
                  </p>
                  <p>
                    <strong>Daily Capacity:</strong> {branch.dailyCapacity}
                  </p>
                  <p>
                    <strong>Active Counters:</strong> {branch.activeCounters}
                  </p>

                  <div className="buttons">
                    <button
                      type="button"
                      onClick={() => changeStatus(branch._id, "Active")}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(branch._id, "Inactive")}
                    >
                      Inactive
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus(branch._id, "Maintenance")}
                    >
                      Maintenance
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteBranch(branch._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h2>Issue Smart Token</h2>

          {tokenMessage && <div className="message">{tokenMessage}</div>}

          <form className="form" onSubmit={handleTokenSubmit}>
            <select
              value={tokenBranchId}
              onChange={(e) => setTokenBranchId(e.target.value)}
              required
            >
              <option value="">Select Branch</option>
              {tokenBranches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
            >
              <option value="">Select Service</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              required
            />

            <select
              value={isPriority}
              onChange={(e) => setIsPriority(e.target.value)}
            >
              <option value="false">Normal Token</option>
              <option value="true">Priority Token</option>
            </select>

            <button type="submit">Create Token</button>
          </form>
        </div>

        <div className="card">
          <h2>Issued Tokens</h2>

          {tokens.length === 0 ? (
            <p>No tokens found</p>
          ) : (
            <div className="branch-list">
              {tokens.map((token) => (
                <div className="branch-card" key={token._id}>
                  <div className="branch-top">
                    <h3>{token.tokenNumber}</h3>
                    <span className="status-badge active">{token.status}</span>
                  </div>

                  <p>
                    <strong>Branch:</strong> {token.branch?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Service:</strong> {token.service?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Date:</strong> {token.preferredDate || "N/A"}
                  </p>
                  <p>
                    <strong>Priority:</strong> {token.isPriority ? "Yes" : "No"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Book Appointment</h2>

          {appointmentMessage && (
            <div className="message">{appointmentMessage}</div>
          )}

          <form className="form" onSubmit={handleAppointmentSubmit}>
            <select
              value={appointmentServiceType}
              onChange={(e) => setAppointmentServiceType(e.target.value)}
              required
            >
              <option value="">Select Service</option>
              {services.map((service) => (
                <option key={service._id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
            />

            <select
              value={appointmentTimeSlot}
              onChange={(e) => setAppointmentTimeSlot(e.target.value)}
              required
            >
              <option value="">Select Available Slot</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Full Name"
              value={appointmentUserName}
              onChange={(e) => setAppointmentUserName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={appointmentUserEmail}
              onChange={(e) => setAppointmentUserEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={appointmentUserPhone}
              onChange={(e) => setAppointmentUserPhone(e.target.value)}
              required
            />

            <button type="submit">Book Appointment</button>
          </form>
        </div>

        <div className="card">
          <h2>Appointments</h2>

          {appointments.length === 0 ? (
            <p>No appointments found</p>
          ) : (
            <div className="branch-list">
              {appointments.map((appointment) => (
                <div className="branch-card" key={appointment._id}>
                  <div className="branch-top">
                    <h3>{appointment.serviceType}</h3>
                    <span
                      className={`status-badge ${
                        appointment.status === "Cancelled"
                          ? "inactive"
                          : appointment.status === "Rescheduled"
                          ? "maintenance"
                          : "active"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <p>
                    <strong>Name:</strong> {appointment.userName}
                  </p>
                  <p>
                    <strong>Email:</strong> {appointment.userEmail}
                  </p>
                  <p>
                    <strong>Phone:</strong> {appointment.userPhone}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(appointment.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time Slot:</strong> {appointment.timeSlot}
                  </p>

                  {appointment.status !== "Cancelled" && (
                    <div className="buttons">
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => cancelAppointment(appointment._id)}
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
}

export default App;