import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";
import "./App.css";

// ============================================================
// API BASE URLS
// ============================================================
const BRANCH_API       = "http://localhost:1163/api/branches";
const TOKEN_API        = "http://localhost:1163/api/tokens";
const APPOINTMENT_API  = "http://localhost:1163/api/appointments";
const SLOT_API         = "http://localhost:1163/api/slots";
const WAITING_API      = "http://localhost:1163/api/waiting";
const SERVICE_API      = "http://localhost:1163/api/services";
const ANALYTICS_API    = "http://localhost:1163/api/analytics";
const NOTIFICATION_API = "http://localhost:1163/api/notifications";

// [22301187] SHAHRIN — Her service options
const SERVICE_OPTIONS = [
  "General Inquiry",
  "License Renewal",
  "Document Verification",
  "Health Service",
  "Others",
];

function App() {
  const navigate = useNavigate();

  // ============================================================
  // [21301163] SHARMIN — Branch Management State
  // ============================================================
  const [branches, setBranches]             = useState([]);
  const [name, setName]                     = useState("");
  const [address, setAddress]               = useState("");
  const [open, setOpen]                     = useState("");
  const [close, setClose]                   = useState("");
  const [dailyCapacity, setDailyCapacity]   = useState("");
  const [activeCounters, setActiveCounters] = useState("");
  const [status, setStatus]                 = useState("Active");
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [branchMessage, setBranchMessage]   = useState("");

  // [21301163] SHARMIN — Feature 2 State
  const [waitingBranchId, setWaitingBranchId] = useState("");
  const [waitingResult, setWaitingResult]     = useState(null);
  const [waitingMessage, setWaitingMessage]   = useState("");
  const [holidayDate, setHolidayDate]         = useState("");
  const [holidayResult, setHolidayResult]     = useState(null);
  // [21301163] SHARMIN — Feature 3
    const DEFAULT_AVG_PROCESSING_TIME = 15;

  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.status === "Active").length;
  const inactiveBranches = branches.filter((b) => b.status === "Inactive").length;
  const maintenanceBranches = branches.filter(
    (b) => b.status === "Maintenance"
  ).length;

  function timeToMinutes(time) {
    if (!time) return null;

    const parts = time.split(":").map(Number);

    if (parts.length !== 2) return null;
    if (Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;

    return parts[0] * 60 + parts[1];
  }

  function getFeasibleCapacity(branch) {
    const openTime = branch.workingHours?.open;
    const closeTime = branch.workingHours?.close;

    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);

    if (openMinutes === null || closeMinutes === null) {
      return null;
    }

    const workingMinutes = closeMinutes - openMinutes;

    if (workingMinutes <= 0) {
      return null;
    }

    return Math.floor(
      (workingMinutes / DEFAULT_AVG_PROCESSING_TIME) * branch.activeCounters
    );
  }

  function getCapacityWarning(branch) {
    const feasibleCapacity = getFeasibleCapacity(branch);

    if (feasibleCapacity === null) {
      return "Capacity could not be calculated. Please check working hours.";
    }

    if (branch.dailyCapacity > feasibleCapacity) {
      return `Warning: Daily capacity ${branch.dailyCapacity} is higher than feasible capacity ${feasibleCapacity}.`;
    }

    return "";
  }
  // ============================================================
  // [22201001] SUNEHRA — Service Config + Analytics State
  // ============================================================
  const [allServices, setAllServices]           = useState([]);
  const [serviceName, setServiceName]           = useState("");
  const [serviceTime, setServiceTime]           = useState("");
  const [serviceFee, setServiceFee]             = useState("");
  const [servicePriority, setServicePriority]   = useState("Medium");
  const [serviceMessage, setServiceMessage]     = useState("");
  const [analyticsResult, setAnalyticsResult]   = useState(null);
  const [analyticsMessage, setAnalyticsMessage] = useState("");
  const [compareBranchA, setCompareBranchA]     = useState("");
  const [compareBranchB, setCompareBranchB]     = useState("");
  const [compareResult, setCompareResult]       = useState(null);

  // ============================================================
  // [23301695] JAKIA — Token + Notification State
  // ============================================================
  const [tokenBranches, setTokenBranches] = useState([]);
  const [services, setServices]           = useState([]);
  const [tokens, setTokens]               = useState([]);
  const [tokenBranchId, setTokenBranchId] = useState("");
  const [serviceId, setServiceId]         = useState("");
  const [preferredDate, setPreferredDate] = useState("2026-04-19");
  const [isPriority, setIsPriority]       = useState("false");
  const [tokenMessage, setTokenMessage]   = useState("");
  const [citizenName, setCitizenName]     = useState("");
  const [tokenEmail, setTokenEmail]       = useState("");
  const [tokenPhone, setTokenPhone]       = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notifMessage, setNotifMessage]   = useState("");

  // ============================================================
  // [22301187] SHAHRIN — Appointment + Slot State
  // ============================================================
  const [appointments, setAppointments]                     = useState([]);
  const [availableSlots, setAvailableSlots]                 = useState([]);
  const [appointmentServiceType, setAppointmentServiceType] = useState(SERVICE_OPTIONS[0]);
  const [appointmentDate, setAppointmentDate]               = useState(new Date().toISOString().split("T")[0]);
  const [appointmentTimeSlot, setAppointmentTimeSlot]       = useState("");
  const [appointmentUserName, setAppointmentUserName]       = useState("");
  const [appointmentUserEmail, setAppointmentUserEmail]     = useState("");
  const [appointmentUserPhone, setAppointmentUserPhone]     = useState("");
  const [appointmentBranchId, setAppointmentBranchId]       = useState("");
  const [appointmentMessage, setAppointmentMessage]         = useState("");
  const [rescheduleId, setRescheduleId]                     = useState(null);
  const [rescheduleDate, setRescheduleDate]                 = useState(new Date().toISOString().split("T")[0]);
  const [rescheduleSlot, setRescheduleSlot]                 = useState("");


  // ============================================================
  // [21301163] SHARMIN — Branch Functions
  // ============================================================
  const getBranches = async () => {
    try {
      let url = BRANCH_API;
      const params = [];
      if (search) params.push(`search=${search}`);
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (params.length > 0) url = `${BRANCH_API}?${params.join("&")}`;
      const res = await axios.get(url);
      setBranches(res.data);
    } catch {
      setBranchMessage("Failed to load branches");
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(BRANCH_API, {
        name, address, latitude: 0, longitude: 0,
        workingHours: { open, close },
        dailyCapacity: Number(dailyCapacity),
        activeCounters: Number(activeCounters),
        status,
      });
      setBranchMessage("Branch created successfully");
      setName(""); setAddress(""); setOpen(""); setClose("");
      setDailyCapacity(""); setActiveCounters(""); setStatus("Active");
      getBranches(); getTokenBranches();
    } catch (err) {
      setBranchMessage(err.response?.data?.message || "Failed to create branch");
    }
  };

  const deleteBranch = async (id) => {
    try {
      await axios.delete(`${BRANCH_API}/${id}`);
      setBranchMessage("Branch deleted");
      getBranches(); getTokenBranches();
    } catch {
      setBranchMessage("Failed to delete branch");
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await axios.put(`${BRANCH_API}/${id}`, { status: newStatus });
      setBranchMessage(`Status changed to ${newStatus}`);
      getBranches(); getTokenBranches();
    } catch {
      setBranchMessage("Failed to update status");
    }
  };

  const checkWaitingTime = async () => {
    if (!waitingBranchId) return setWaitingMessage("Please select a branch");
    try {
      const res = await axios.get(`${WAITING_API}/${waitingBranchId}`);
      setWaitingResult(res.data); setWaitingMessage("");
    } catch {
      setWaitingMessage("Failed to get waiting time");
    }
  };

  const checkHoliday = async () => {
    if (!holidayDate) return;
    try {
      const res = await axios.get(`${WAITING_API}/holiday/check?date=${holidayDate}&country=BD`);
      setHolidayResult(res.data);
    } catch {
      setHolidayResult(null);
    }
  };


  // ============================================================
  // [22201001] SUNEHRA — Service + Analytics Functions
  // ============================================================
  const getAllServices = async () => {
    try {
      const res = await axios.get(SERVICE_API);
      setAllServices(res.data);
    } catch {
      setServiceMessage("Failed to load services");
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(SERVICE_API, {
        name: serviceName,
        avgProcessingTime: Number(serviceTime),
        fee: Number(serviceFee),
        priority: servicePriority,
      });
      setServiceMessage("Service created successfully");
      setServiceName(""); setServiceTime(""); setServiceFee(""); setServicePriority("Medium");
      getAllServices(); getServices();
    } catch (err) {
      setServiceMessage(err.response?.data?.message || "Failed to create service");
    }
  };

  const deleteService = async (id) => {
    try {
      await axios.delete(`${SERVICE_API}/${id}`);
      setServiceMessage("Service deleted");
      getAllServices(); getServices();
    } catch {
      setServiceMessage("Failed to delete service");
    }
  };

  const getLeastCrowded = async () => {
    try {
      const res = await axios.get(`${ANALYTICS_API}/least-crowded`);
      setAnalyticsResult(res.data); setAnalyticsMessage("");
    } catch {
      setAnalyticsMessage("Failed to get analytics");
    }
  };

  const compareBranches = async () => {
    if (!compareBranchA || !compareBranchB) return setAnalyticsMessage("Please select both branches");
    try {
      const res = await axios.get(`${ANALYTICS_API}/compare?branchAId=${compareBranchA}&branchBId=${compareBranchB}`);
      setCompareResult(res.data); setAnalyticsMessage("");
    } catch {
      setAnalyticsMessage("Failed to compare branches");
    }
  };


  // ============================================================
  // [23301695] JAKIA — Token + Notification Functions
  // ============================================================
  const getTokenBranches = async () => {
    try {
      const res = await axios.get(`${TOKEN_API}/branches`);
      setTokenBranches(res.data);
    } catch {
      setTokenMessage("Failed to load branches");
    }
  };

  const getServices = async () => {
    try {
      const res = await axios.get(`${TOKEN_API}/services`);
      setServices(res.data);
    } catch {
      setTokenMessage("Failed to load services");
    }
  };

  const getTokens = async () => {
    try {
      const res = await axios.get(TOKEN_API);
      setTokens(res.data);
    } catch {
      setTokenMessage("Failed to load tokens");
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(TOKEN_API, {
        branchId: tokenBranchId, serviceId, preferredDate,
        isPriority: isPriority === "true",
        citizenName, email: tokenEmail, phone: tokenPhone,
      });
      setTokenMessage(`Token created: ${res.data.token.tokenNumber}`);
      getTokens();
      setTokenBranchId(""); setServiceId("");
      setPreferredDate("2026-04-19"); setIsPriority("false");
      setCitizenName(""); setTokenEmail(""); setTokenPhone("");
    } catch (err) {
      setTokenMessage(err.response?.data?.message || "Failed to create token");
    }
  };

  const getNotifications = async () => {
    try {
      const res = await axios.get(NOTIFICATION_API);
      setNotifications(res.data.data || []); setNotifMessage("");
    } catch {
      setNotifMessage("Failed to load notifications");
    }
  };

const deleteToken = async (id) => {
  try {
    await axios.delete(`${TOKEN_API}/${id}`);
    setTokenMessage("Token deleted");
    getTokens();
  } catch {
    setTokenMessage("Failed to delete token");
  }
};
  // ============================================================
  // [22301187] SHAHRIN — Appointment + Slot Functions
  // ============================================================
  const getAppointments = async () => {
    try {
      const res = await axios.get(APPOINTMENT_API);
      setAppointments(res.data);
    } catch {
      setAppointmentMessage("Failed to load appointments");
    }
  };

  const getAvailableSlots = async () => {
    if (!appointmentServiceType || !appointmentDate) { setAvailableSlots([]); return; }
    try {
      const res = await axios.get(
        `${SLOT_API}/availability?serviceType=${encodeURIComponent(appointmentServiceType)}&date=${appointmentDate}`
      );
      setAvailableSlots(res.data.availableSlots || []);
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!appointmentTimeSlot) return setAppointmentMessage("Please select a time slot");
    try {
      const payload = {
        serviceType: appointmentServiceType, date: appointmentDate,
        timeSlot: appointmentTimeSlot, userName: appointmentUserName,
        userEmail: appointmentUserEmail, userPhone: appointmentUserPhone,
      };
      if (appointmentBranchId) payload.branch = appointmentBranchId;
      await axios.post(APPOINTMENT_API, payload);
      setAppointmentMessage("Appointment booked successfully");
      setAppointmentTimeSlot(""); setAppointmentUserName("");
      setAppointmentUserEmail(""); setAppointmentUserPhone(""); setAppointmentBranchId("");
      getAppointments(); getAvailableSlots();
    } catch (err) {
      setAppointmentMessage(err.response?.data?.error || "Failed to book appointment");
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.patch(`${APPOINTMENT_API}/${id}/cancel`);
      setAppointmentMessage("Appointment cancelled");
      getAppointments(); getAvailableSlots();
    } catch {
      setAppointmentMessage("Failed to cancel appointment");
    }
  };

  const startReschedule = (appointment) => {
    setRescheduleId(appointment._id);
    setRescheduleDate(new Date(appointment.date).toISOString().split("T")[0]);
    setRescheduleSlot(appointment.timeSlot);
    setAppointmentMessage("");
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleSlot) return setAppointmentMessage("Please select a slot");
    try {
      await axios.patch(`${APPOINTMENT_API}/${rescheduleId}/reschedule`, {
        date: rescheduleDate, timeSlot: rescheduleSlot,
      });
      setAppointmentMessage("Appointment rescheduled successfully");
      setRescheduleId(null); setRescheduleSlot("");
      getAppointments(); getAvailableSlots();
    } catch (err) {
      setAppointmentMessage(err.response?.data?.error || "Reschedule failed");
    }
  };

  const cancelReschedule = () => { setRescheduleId(null); setRescheduleSlot(""); };


  // ============================================================
  // useEffect — Load on start
  // ============================================================
  useEffect(() => { getBranches(); }, [search, filterStatus]);

  useEffect(() => {
    getBranches();
    getAllServices();
    getTokenBranches();
    getServices();
    getTokens();
    getAppointments();
    getNotifications();
  }, []);

  useEffect(() => { getAvailableSlots(); }, [appointmentServiceType, appointmentDate]);


  // ============================================================
  // UI — Presentation Order:
  // Sharmin (Branch) → Sunehra (Service) → Jakia (Token) → Shahrin (Appointment)
  // then Sharmin Feature 2 → Jakia Feature 2
  // ============================================================
  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="hero">
          <img src={logo} alt="EQueue Logo" className="logo" />
          <div style={{ flex: 1 }}>
            <p className="project-name">
              Government Service Queue Transparency and Smart Slot Management System
            </p>
            <p className="subtitle">Group 03 | CSE471 Lab 09</p>
          </div>
          <button type="button" style={{ width: "auto", padding: "10px 22px" }}
            onClick={() => navigate("/")}>
            Logout
          </button>
        </div>


        {/* ════════════════════════════════════════════════════
            [21301163] SHARMIN — Feature 1: Branch Management
            Step 1 in presentation — branches needed by everyone
            ════════════════════════════════════════════════════ */}
        <div className="section-label">21301163 · Sharmin — Branch Management</div>

        <div className="card">
          <h2>Search Branches</h2>
          <div className="form">
            <input type="text" placeholder="Search by name"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h2>Create Branch</h2>
          <form className="form" onSubmit={handleBranchSubmit}>
            <input type="text" placeholder="Branch Name"
              value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="text" placeholder="Address (e.g. Road 27, Dhanmondi, Dhaka)"
              value={address} onChange={(e) => setAddress(e.target.value)} required />
            <input type="text" placeholder="Open Time (09:00)"
              value={open} onChange={(e) => setOpen(e.target.value)} required />
            <input type="text" placeholder="Close Time (17:00)"
              value={close} onChange={(e) => setClose(e.target.value)} required />
            <input type="number" placeholder="Daily Capacity (e.g. 100)"
              value={dailyCapacity} onChange={(e) => setDailyCapacity(e.target.value)} required />
            <input type="number" placeholder="Active Counters (e.g. 5)"
              value={activeCounters} onChange={(e) => setActiveCounters(e.target.value)} required />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            {branchMessage && (
              <div className="message" style={{ gridColumn: "1 / -1" }}>{branchMessage}</div>
            )}
            <button type="submit">Create Branch</button>
          </form>
        </div>

        <div className="card">
          <h2>Branch List</h2>
          {branches.length === 0 ? <p>No branches found</p> : (
            <div className="branch-list">
              {branches.map((branch) => (
                <div className="branch-card" key={branch._id}>
                  <div className="branch-top">
                    <h3>{branch.name}</h3>
                    {branch.status && (
                      <span className={`status-badge ${branch.status.toLowerCase()}`}>
                        {branch.status}
                      </span>
                    )}
                  </div>
                  <p><strong>Address:</strong> {branch.address}</p>
                  <p><strong>Hours:</strong> {branch.workingHours?.open || "—"} – {branch.workingHours?.close || "—"}</p>
                  <p><strong>Daily Capacity:</strong> {branch.dailyCapacity || "—"}</p>
                  <p><strong>Active Counters:</strong> {branch.activeCounters || "—"}</p>
                  {getCapacityWarning(branch) && (
                    <div className="capacity-warning">
                      {getCapacityWarning(branch)}
                    </div>
                  )}
                  <div className="buttons">
                    <button type="button" onClick={() => changeStatus(branch._id, "Active")}>Active</button>
                    <button type="button" onClick={() => changeStatus(branch._id, "Inactive")}>Inactive</button>
                    <button type="button" onClick={() => changeStatus(branch._id, "Maintenance")}>Maintenance</button>
                    <button type="button" className="delete-btn" onClick={() => deleteBranch(branch._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          <div className="card">
            <h2>Branch Dashboard Summary</h2>

            <div className="summary-grid">
              <div className="summary-box">
                <h3>{totalBranches}</h3>
                <p>Total Branches</p>
              </div>

              <div className="summary-box">
                <h3>{activeBranches}</h3>
                <p>Active Branches</p>
              </div>

              <div className="summary-box">
                <h3>{inactiveBranches}</h3>
                <p>Inactive Branches</p>
              </div>

              <div className="summary-box">
                <h3>{maintenanceBranches}</h3>
                <p>Maintenance Branches</p>
              </div>
            </div>
          </div>

        {/* ════════════════════════════════════════════════════
            [22201001] SUNEHRA — Feature 1: Service Configuration
            Step 2 — services needed before tokens can be issued
            ════════════════════════════════════════════════════ */}
        <div className="section-label">22201001 · Sunehra — Service Configuration</div>

        {serviceMessage && <div className="message">{serviceMessage}</div>}

        <div className="card">
          <h2>Create Service</h2>
          <form className="form" onSubmit={handleServiceSubmit}>
            <input type="text" placeholder="Service Name (e.g. Passport Renewal)"
              value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
            <input type="number" placeholder="Avg Processing Time (minutes)"
              value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} required />
            <input type="number" placeholder="Fee (0 if free)"
              value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
            <select value={servicePriority} onChange={(e) => setServicePriority(e.target.value)}>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <button type="submit">Create Service</button>
          </form>
        </div>

        <div className="card">
          <h2>Service List</h2>
          {allServices.length === 0 ? <p>No services found</p> : (
            <div className="branch-list">
              {allServices.map((s) => (
                <div className="branch-card" key={s._id}>
                  <div className="branch-top">
                    <h3>{s.name}</h3>
                    <span className={`status-badge ${
                      s.priority === "High" ? "inactive" :
                      s.priority === "Medium" ? "maintenance" : "active"
                    }`}>{s.priority}</span>
                  </div>
                  <p><strong>Avg Time:</strong> {s.avgProcessingTime} mins</p>
                  <p><strong>Fee:</strong> {s.fee === 0 ? "Free" : `${s.fee} BDT`}</p>
                  <div className="buttons">
                    <button type="button" className="delete-btn"
                      onClick={() => deleteService(s._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* ════════════════════════════════════════════════════
            [23301695] JAKIA — Feature 1: Token Generation
            Step 3 — uses branch + service created above
            ════════════════════════════════════════════════════ */}
        <div className="section-label">23301695 · Jakia — Token Generation</div>

        <div className="card">
          <h2>Issue Token</h2>
          <form className="form" onSubmit={handleTokenSubmit}>
            <select value={tokenBranchId} onChange={(e) => setTokenBranchId(e.target.value)} required>
              <option value="">Select Branch</option>
              {tokenBranches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
              <option value="">Select Service</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <input type="date" value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)} required />
            <select value={isPriority} onChange={(e) => setIsPriority(e.target.value)}>
              <option value="false">Normal Token</option>
              <option value="true">Priority Token</option>
            </select>
            <input type="text" placeholder="Citizen Name"
              value={citizenName} onChange={(e) => setCitizenName(e.target.value)} />
            <input type="email" placeholder="Email (for queue alert)"
              value={tokenEmail} onChange={(e) => setTokenEmail(e.target.value)} />
            <input type="text" placeholder="Phone (for SMS alert)"
              value={tokenPhone} onChange={(e) => setTokenPhone(e.target.value)} />
            {tokenMessage && (
              <div className="message" style={{ gridColumn: "1 / -1" }}>{tokenMessage}</div>
            )}
            <button type="submit">Issue Token</button>
          </form>
        </div>

        <div className="card">
          <h2>Issued Tokens</h2>
          {tokens.length === 0 ? <p>No tokens found</p> : (
            <div className="branch-list">
              {tokens.map((token) => (
                <div className="branch-card" key={token._id}>
                  <div className="branch-top">
                    <h3>{token.tokenNumber}</h3>
                    <span className={`status-badge ${
                      token.status === "Waiting" ? "active" :
                      token.status === "Completed" ? "inactive" : "maintenance"
                    }`}>{token.status}</span>
                  </div>
                  <p><strong>Branch:</strong> {token.branch?.name || "N/A"}</p>
                  <p><strong>Service:</strong> {token.service?.name || "N/A"}</p>
                  <p><strong>Date:</strong> {token.preferredDate}</p>
                  <p><strong>Priority:</strong> {token.isPriority ? "Yes" : "No"}</p>
                  {token.citizenName && <p><strong>Citizen:</strong> {token.citizenName}</p>}
                  {token.email && <p><strong>Email:</strong> {token.email}</p>}
                  <div className="buttons">
    <button type="button" className="delete-btn"
      onClick={() => deleteToken(token._id)}>Delete</button>
  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* ════════════════════════════════════════════════════
            [22301187] SHAHRIN — Feature 1: Appointment & Slot Management
            Step 4 — books appointments at the branch
            ════════════════════════════════════════════════════ */}
        <div className="section-label">22301187 · Shahrin — Appointment & Slot Management</div>

        {appointmentMessage && <div className="message">{appointmentMessage}</div>}

        <div className="card">
          <h2>Book Appointment</h2>
          <form className="form" onSubmit={handleAppointmentSubmit}>
            <select value={appointmentServiceType}
              onChange={(e) => setAppointmentServiceType(e.target.value)} required>
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={appointmentBranchId}
              onChange={(e) => setAppointmentBranchId(e.target.value)}>
              <option value="">Select Branch (Optional)</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <input type="date" value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)} required />
            <select value={appointmentTimeSlot}
              onChange={(e) => setAppointmentTimeSlot(e.target.value)} required>
              <option value="">Select Available Slot</option>
              {availableSlots.length > 0
                ? availableSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))
                : <option disabled>No slots available</option>
              }
            </select>
            <input type="text" placeholder="Full Name" value={appointmentUserName}
              onChange={(e) => setAppointmentUserName(e.target.value)} required />
            <input type="email" placeholder="Email" value={appointmentUserEmail}
              onChange={(e) => setAppointmentUserEmail(e.target.value)} required />
            <input type="text" placeholder="Phone (+8801XXXXXXXXX)" value={appointmentUserPhone}
              onChange={(e) => setAppointmentUserPhone(e.target.value)} required />
            <button type="submit" style={{ gridColumn: "1 / -1" }}>Book Appointment</button>
          </form>
        </div>

        {rescheduleId && (
          <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <h2>Reschedule Appointment</h2>
            <form className="form" onSubmit={submitReschedule}>
              <input type="date" value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)} required />
              <select value={rescheduleSlot}
                onChange={(e) => setRescheduleSlot(e.target.value)} required>
                <option value="">Select New Slot</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <button type="submit">Confirm Reschedule</button>
              <button type="button" className="delete-btn" onClick={cancelReschedule}>Cancel</button>
            </form>
          </div>
        )}

        <div className="card">
          <h2>Appointments</h2>
          {appointments.length === 0 ? <p>No appointments found</p> : (
            <div className="branch-list">
              {appointments.map((appointment) => (
                <div className="branch-card" key={appointment._id}>
                  <div className="branch-top">
                    <h3>{appointment.serviceType}</h3>
                    <span className={`status-badge ${
                      appointment.status === "Cancelled" ? "inactive" :
                      appointment.status === "Rescheduled" ? "maintenance" : "active"
                    }`}>{appointment.status}</span>
                  </div>
                  {appointment.branch && <p><strong>Branch:</strong> {appointment.branch.name}</p>}
                  <p><strong>Name:</strong> {appointment.userName}</p>
                  <p><strong>Email:</strong> {appointment.userEmail}</p>
                  <p><strong>Phone:</strong> {appointment.userPhone}</p>
                  <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                  <p><strong>Time Slot:</strong> {appointment.timeSlot}</p>
                  {appointment.status !== "Cancelled" && (
                    <div className="buttons">
                      <button type="button" onClick={() => startReschedule(appointment)}>Reschedule</button>
                      <button type="button" className="delete-btn"
                        onClick={() => cancelAppointment(appointment._id)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* ════════════════════════════════════════════════════
            [21301163] SHARMIN — Feature 2: Waiting Time + Holiday API
            ════════════════════════════════════════════════════ */}
        <div className="section-label">21301163 · Sharmin — Waiting Time & Holiday Check</div>

        <div className="card">
          <h2>Real-Time Waiting Time</h2>
          <div className="form">
            <select value={waitingBranchId} onChange={(e) => setWaitingBranchId(e.target.value)}>
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <button type="button" onClick={checkWaitingTime}>Check Waiting Time</button>
          </div>
          {waitingMessage && <div className="message" style={{ marginTop: "1rem" }}>{waitingMessage}</div>}
          {waitingResult && (
            <div className="branch-card" style={{ marginTop: "1rem" }}>
              <p><strong>Branch:</strong> {waitingResult.branchName}</p>
              <p><strong>Date:</strong> {waitingResult.date}</p>
              <p><strong>People Waiting:</strong> {waitingResult.waitingPeople}</p>
              <p><strong>Estimated Wait:</strong> {waitingResult.estimatedWaitMinutes} minutes</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Public Holiday Check (Bangladesh)</h2>
          <div className="form">
            <input type="date" value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)} />
            <button type="button" onClick={checkHoliday}>Check Date</button>
          </div>
          {holidayResult && (
            <div className="branch-card" style={{
              marginTop: "1rem",
              borderLeft: `4px solid ${holidayResult.isHoliday ? "#ef4444" : "#22c55e"}`,
            }}>
              <p><strong>Date:</strong> {holidayResult.date}</p>
              <p><strong>Is Holiday:</strong> {holidayResult.isHoliday ? "Yes" : "No"}</p>
              <p><strong>Booking Allowed:</strong> {holidayResult.bookingAllowed ? "Yes" : "No"}</p>
              {holidayResult.holidayName && <p><strong>Holiday:</strong> {holidayResult.holidayName}</p>}
              <p>{holidayResult.message}</p>
            </div>
          )}
        </div>


        {/* ════════════════════════════════════════════════════
            [22201001] SUNEHRA — Feature 2: Branch Analytics
            ════════════════════════════════════════════════════ */}
        <div className="section-label">22201001 · Sunehra — Branch Analytics</div>

        {analyticsMessage && <div className="message">{analyticsMessage}</div>}

        <div className="card">
          <h2>Least Crowded Branch</h2>
          <div className="form">
            <button type="button" onClick={getLeastCrowded}>Find Least Crowded</button>
          </div>
          {analyticsResult && (
            <div style={{ marginTop: "1rem" }}>
              <div className="branch-card" style={{ borderLeft: "4px solid #22c55e" }}>
                <p><strong>Least Crowded:</strong> {analyticsResult.leastCrowded?.name}</p>
                <p><strong>Address:</strong> {analyticsResult.leastCrowded?.address}</p>
                <p><strong>Waiting:</strong> {analyticsResult.leastCrowded?.waiting} people</p>
              </div>
              {analyticsResult.allBranches?.length > 1 && (
                <div className="branch-list" style={{ marginTop: "1rem" }}>
                  {analyticsResult.allBranches.map((b, i) => (
                    <div className="branch-card" key={i}>
                      <p><strong>{b.name}</strong></p>
                      <p>Waiting: {b.waiting} people</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Compare Two Branches</h2>
          <div className="form">
            <select value={compareBranchA} onChange={(e) => setCompareBranchA(e.target.value)}>
              <option value="">Select Branch A</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <select value={compareBranchB} onChange={(e) => setCompareBranchB(e.target.value)}>
              <option value="">Select Branch B</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            <button type="button" onClick={compareBranches}>Compare</button>
          </div>
          {compareResult && (
            <div style={{ marginTop: "1rem" }}>
              <div className="branch-list">
                <div className="branch-card">
                  <p><strong>{compareResult.branchA?.name}</strong></p>
                  <p>Waiting: {compareResult.branchA?.waiting} people</p>
                </div>
                <div className="branch-card">
                  <p><strong>{compareResult.branchB?.name}</strong></p>
                  <p>Waiting: {compareResult.branchB?.waiting} people</p>
                </div>
              </div>
              <div className="branch-card" style={{ marginTop: "1rem", borderLeft: "4px solid #3b82f6" }}>
                <p><strong>Recommendation:</strong> Go to {compareResult.recommendation}</p>
              </div>
            </div>
          )}
        </div>


        {/* ════════════════════════════════════════════════════
            [23301695] JAKIA — Feature 2: Queue Alert + Notification Log
            ════════════════════════════════════════════════════ */}
        <div className="section-label">23301695 · Jakia — Queue Alert & Notification Log</div>

        {notifMessage && <div className="message">{notifMessage}</div>}

        <div className="card">
          <h2>Notification Log</h2>
          <div className="form">
            <button type="button" onClick={getNotifications}>Refresh Notifications</button>
          </div>
          {notifications.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>
              No notifications yet. Alerts are sent automatically when a token queue number is 3 or below.
            </p>
          ) : (
            <div className="branch-list" style={{ marginTop: "1rem" }}>
              {notifications.map((n) => (
                <div className="branch-card" key={n._id}>
                  <div className="branch-top">
                    <h3>{n.type}</h3>
                    <span className={`status-badge ${n.status === "SENT" ? "active" : "inactive"}`}>
                      {n.status}
                    </span>
                  </div>
                  <p><strong>Channel:</strong> {n.channel}</p>
                  {n.recipientEmail && <p><strong>Email:</strong> {n.recipientEmail}</p>}
                  {n.recipientPhone && <p><strong>Phone:</strong> {n.recipientPhone}</p>}
                  <p><strong>Message:</strong> {n.message}</p>
                  <p><strong>Sent At:</strong> {new Date(n.sentAt).toLocaleString()}</p>
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