import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useJsApiLoader } from "@react-google-maps/api";
import "./App.css";
import logo from "./assets/logo.png";
import BranchMap from "./components/BranchMap.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:1163";
const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const TIME_OPTIONS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const TIME_SLOT_OPTIONS = [
  "09:00 - 09:30",
  "09:30 - 10:00",
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "12:00 - 12:30",
  "12:30 - 13:00",
  "13:00 - 13:30",
  "13:30 - 14:00",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
  "16:00 - 16:30",
  "16:30 - 17:00",
];

const SERVICE_CATEGORY_OPTIONS = [
  "Passport",
  "NID",
  "Health",
  "Birth Certificate",
  "Licensing",
  "Utility",
  "Tax",
  "General Inquiry",
  "Other",
];

const api = axios.create({
  baseURL: API_BASE_URL,
});

function showError(error) {
  return error.response?.data?.message || error.message || "Something went wrong";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isStrongPassword(password) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
}

function isAdminUser(user) {
  return user?.role?.toLowerCase() === "admin";
}

function normalizeList(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.items)) return responseData.items;
  if (Array.isArray(responseData?.results)) return responseData.results;
  return [];
}

function displayNotificationType(type) {
  if (type === "QUEUE_ALERT") return "Queue Alert";
  if (type === "SLOT_REMINDER") return "Slot Reminder";
  if (type === "GENERAL") return "General";
  return type || "General";
}

function displayNotificationStatus(notification) {
  return (
    notification.status ||
    notification.emailStatus ||
    notification.smsStatus ||
    "Not Available"
  );
}

function getNotificationEmail(notification) {
  return notification.recipientEmail || notification.email || "Not available";
}

function getNotificationPhone(notification) {
  return notification.recipientPhone || notification.phone || "Not available";
}

function getNotificationError(notification) {
  return notification.errorMessage || notification.error || "None";
}

function getFallbackCoordinates(address) {
  const value = String(address || "").toLowerCase();

  if (
    value.includes("dhaka passport") ||
    value.includes("agargaon") ||
    value.includes("dhaka")
  ) {
    return {
      latitude: 23.7772,
      longitude: 90.3742,
      label: "Dhaka fallback coordinates used",
    };
  }

  if (value.includes("gulshan")) {
    return {
      latitude: 23.7806,
      longitude: 90.4193,
      label: "Gulshan fallback coordinates used",
    };
  }

  if (value.includes("mirpur")) {
    return {
      latitude: 23.8069,
      longitude: 90.3687,
      label: "Mirpur fallback coordinates used",
    };
  }

  return null;
}

export default function App() {
  const savedUser = localStorage.getItem("equeueUser");

  const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);
  const [authMode, setAuthMode] = useState("login");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [analyticsResult, setAnalyticsResult] = useState(null);
  const [coordinateStatus, setCoordinateStatus] = useState("");

  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);

  const [slotResults, setSlotResults] = useState([]);
  const [activityResult, setActivityResult] = useState(null);

  const [visibleTokenCount, setVisibleTokenCount] = useState(10);
  const [visibleAppointmentCount, setVisibleAppointmentCount] = useState(12);
  const [visibleReportCount, setVisibleReportCount] = useState(6);

  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsKey,
  });

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Citizen",
  });

  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    open: "09:00",
    close: "17:00",
    dailyCapacity: "",
    activeCounters: "",
    status: "Active",
  });

  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    category: "",
    description: "",
    averageProcessingTime: "",
    requiredDocuments: "",
    serviceFee: "",
    priorityLevel: "Normal",
  });

  const [tokenForm, setTokenForm] = useState({
    branchId: "",
    serviceId: "",
    preferredDate: today(),
    name: "",
    email: "",
    phone: "",
    isPriority: false,
  });

  const [appointmentForm, setAppointmentForm] = useState({
    branchId: "",
    serviceId: "",
    preferredDate: today(),
    timeSlot: "09:00 - 09:30",
    name: "",
    email: "",
    phone: "",
  });

  const [holidayForm, setHolidayForm] = useState({
    date: today(),
    country: "BD",
  });

  const [capacityForm, setCapacityForm] = useState({
    branchId: "",
    serviceId: "",
    dailyCapacity: "",
  });

  const [waitingForm, setWaitingForm] = useState({
    branchId: "",
    waitingPeople: "",
    averageServiceTime: "15",
  });

  const [queueStatusForm, setQueueStatusForm] = useState({
    tokenId: "",
    status: "Serving",
  });

  const [emailForm, setEmailForm] = useState({
    email: "",
    phone: "",
    subject: "EQueue Notification",
    message: "Your queue or appointment update is available.",
    type: "GENERAL",
  });

  const [queueAlertForm, setQueueAlertForm] = useState({
    branchId: "",
    date: today(),
  });

  const [appointmentReminderForm, setAppointmentReminderForm] = useState({
    date: today(),
  });

  const [slotSearchForm, setSlotSearchForm] = useState({
    branchId: "",
    serviceCategory: "",
    serviceType: "",
    date: today(),
    timeSlot: "",
    maxQueueLength: "",
  });

  const [activityEmail, setActivityEmail] = useState("");

  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentId: "",
    preferredDate: today(),
    timeSlot: "10:00 - 10:30",
  });

  const [reportForm, setReportForm] = useState({
    reportName: "Monthly Operational Report",
    startDate: today(),
    endDate: today(),
    branchId: "",
  });

  const isAdmin = isAdminUser(user);
  const userEmail = user?.email?.toLowerCase() || "";

  const activeBranches = useMemo(() => {
    return branches.filter((branch) => branch.status === "Active");
  }, [branches]);

  const visibleTokensForUser = useMemo(() => {
    if (isAdmin) return tokens;

    return tokens.filter((token) => {
      return token.email?.toLowerCase() === userEmail;
    });
  }, [tokens, isAdmin, userEmail]);

  const visibleAppointmentsForUser = useMemo(() => {
    if (isAdmin) return appointments;

    return appointments.filter((appointment) => {
      return appointment.email?.toLowerCase() === userEmail;
    });
  }, [appointments, isAdmin, userEmail]);

  const visibleNotificationsForUser = useMemo(() => {
    if (isAdmin) return notifications;

    return notifications.filter((notification) => {
      const email = getNotificationEmail(notification).toLowerCase();
      return email === userEmail;
    });
  }, [notifications, isAdmin, userEmail]);

  const branchesWithMapStats = useMemo(() => {
    return branches.map((branch) => {
      const branchId = String(branch._id);

      const branchTokens = tokens.filter((token) => {
        const tokenBranchId = String(token.branch?._id || token.branch || "");
        return tokenBranchId === branchId;
      });

      const waitingCount = branchTokens.filter(
        (token) => token.status === "Waiting",
      ).length;

      const servingCount = branchTokens.filter(
        (token) => token.status === "Serving",
      ).length;

      const totalTokens = branchTokens.length;

      const loadPercentage =
        branch.dailyCapacity > 0
          ? Math.round((waitingCount / branch.dailyCapacity) * 100)
          : 0;

      return {
        ...branch,
        waitingCount,
        servingCount,
        totalTokens,
        loadPercentage,
      };
    });
  }, [branches, tokens]);

  const recentTokens = visibleTokensForUser.slice(0, visibleTokenCount);
  const recentAppointments = visibleAppointmentsForUser.slice(
    0,
    visibleAppointmentCount,
  );
  const recentReports = reports.slice(0, visibleReportCount);

  const slotSearchServices = useMemo(() => {
    if (!slotSearchForm.serviceCategory) return services;

    return services.filter((service) => {
      return service.category === slotSearchForm.serviceCategory;
    });
  }, [services, slotSearchForm.serviceCategory]);

  useEffect(() => {
    if (user) {
      loadAll();

      setTokenForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));

      setAppointmentForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));

      setActivityEmail(user.email || "");
    }
  }, [user]);

  async function loadAll() {
    try {
      const [
        branchRes,
        serviceRes,
        tokenRes,
        appointmentRes,
        notificationRes,
        reportRes,
      ] = await Promise.all([
        api.get("/api/branches"),
        api.get("/api/services"),
        api.get("/api/tokens"),
        api.get("/api/appointments"),
        api.get("/api/notifications"),
        api.get("/api/reports"),
      ]);

      setBranches(normalizeList(branchRes.data));
      setServices(normalizeList(serviceRes.data));
      setTokens(normalizeList(tokenRes.data));
      setAppointments(normalizeList(appointmentRes.data));
      setNotifications(normalizeList(notificationRes.data));
      setReports(normalizeList(reportRes.data));
    } catch (error) {
      setMessage(showError(error));
    }
  }

  function changeModule(moduleName) {
    setActiveModule(moduleName);
    setMessage("");
    setResult(null);
    setAnalyticsResult(null);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";

      if (authMode === "register" && !isStrongPassword(authForm.password)) {
        setMessage(
          "Password must be at least 8 characters and include uppercase, lowercase, and number.",
        );
        return;
      }

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            };
      const res = await api.post(endpoint, body);

      localStorage.setItem("equeueUser", JSON.stringify(res.data.user));
      localStorage.setItem("equeueToken", res.data.token);

      setUser(res.data.user);
      setMessage(res.data.message);
    } catch (error) {
      setMessage(showError(error));
    }
  }

  function logout() {
    localStorage.removeItem("equeueUser");
    localStorage.removeItem("equeueToken");
    setUser(null);
    setMessage("");
    setResult(null);
    setAnalyticsResult(null);
    setSlotResults([]);
    setActivityResult(null);
  }

  function getCoordinatesFromAddress(address) {
    return new Promise((resolve, reject) => {
      const fallback = getFallbackCoordinates(address);

      if (!googleMapsKey) {
        if (fallback) {
          resolve(fallback);
          return;
        }

        reject(new Error("Google Maps API key is missing in frontend/.env"));
        return;
      }

      if (!isGoogleLoaded || !window.google?.maps) {
        if (fallback) {
          resolve(fallback);
          return;
        }

        reject(new Error("Google Maps is still loading. Try again in a few seconds."));
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      const fullAddress = address.toLowerCase().includes("bangladesh")
        ? address
        : `${address}, Bangladesh`;

      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;

          resolve({
            latitude: location.lat(),
            longitude: location.lng(),
            label: "Google detected coordinates",
          });
        } else if (fallback) {
          resolve(fallback);
        } else {
          reject(new Error("Could not detect coordinates from this address."));
        }
      });
    });
  }

  async function autoFillCoordinates() {
    try {
      if (!branchForm.address.trim()) {
        setCoordinateStatus("Enter branch address first.");
        return;
      }

      setCoordinateStatus("Finding latitude and longitude from address...");

      const coords = await getCoordinatesFromAddress(branchForm.address);

      setBranchForm((prev) => ({
        ...prev,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));

      setCoordinateStatus(coords.label || "Latitude and longitude detected successfully.");
    } catch (error) {
      setCoordinateStatus(error.message);
    }
  }

  async function createBranch(event) {
    event.preventDefault();

    try {
      let latitude = branchForm.latitude;
      let longitude = branchForm.longitude;

      if (!latitude || !longitude) {
        const coords = await getCoordinatesFromAddress(branchForm.address);
        latitude = String(coords.latitude);
        longitude = String(coords.longitude);
      }

      const res = await api.post("/api/branches", {
        name: branchForm.name,
        address: branchForm.address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        workingHours: {
          open: branchForm.open,
          close: branchForm.close,
        },
        dailyCapacity: Number(branchForm.dailyCapacity),
        activeCounters: Number(branchForm.activeCounters),
        status: branchForm.status,
      });

      setResult({
        title: "Branch Created",
        message: res.data.message,
      });

      setBranchForm({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        open: "09:00",
        close: "17:00",
        dailyCapacity: "",
        activeCounters: "",
        status: "Active",
      });

      setCoordinateStatus("");
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function updateBranchStatus(branchId, status) {
    try {
      const res = await api.put(`/api/branches/${branchId}`, { status });
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function deleteBranch(branchId) {
    try {
      const res = await api.delete(`/api/branches/${branchId}`);
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function createService(event) {
    event.preventDefault();

    try {
      const docs = serviceForm.requiredDocuments
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await api.post("/api/services", {
        serviceName: serviceForm.serviceName,
        category: serviceForm.category,
        description: serviceForm.description,
        averageProcessingTime: Number(serviceForm.averageProcessingTime),
        requiredDocuments: docs,
        serviceFee: Number(serviceForm.serviceFee || 0),
        priorityLevel: serviceForm.priorityLevel,
      });

      setResult({
        title: "Service Created",
        message: res.data.message,
      });

      setServiceForm({
        serviceName: "",
        category: "",
        description: "",
        averageProcessingTime: "",
        requiredDocuments: "",
        serviceFee: "",
        priorityLevel: "Normal",
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function deleteService(serviceId) {
    try {
      const res = await api.delete(`/api/services/${serviceId}`);
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function createToken(event) {
    event.preventDefault();

    try {
      const res = await api.post("/api/tokens", tokenForm);

      setResult({
        title: "Token Generated",
        message: `${res.data.token?.tokenCode || "Token"} generated successfully.`,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function deleteToken(tokenId) {
    try {
      const res = await api.delete(`/api/tokens/${tokenId}`);
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function createAppointment(event) {
    event.preventDefault();

    try {
      const res = await api.post("/api/appointments", appointmentForm);

      setResult({
        title: "Appointment Booked",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function cancelAppointment(appointmentId) {
    try {
      const res = await api.patch(`/api/appointments/${appointmentId}/cancel`);

      setResult({
        title: "Appointment Cancelled",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function rescheduleAppointment(event) {
    event.preventDefault();

    try {
      const res = await api.patch(
        `/api/appointments/${rescheduleForm.appointmentId}/reschedule`,
        {
          preferredDate: rescheduleForm.preferredDate,
          timeSlot: rescheduleForm.timeSlot,
        },
      );

      setResult({
        title: "Appointment Rescheduled",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function deleteAppointmentRecord(appointmentId) {
    try {
      const res = await api.delete(`/api/appointments/${appointmentId}`);
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function checkHoliday(event) {
    event.preventDefault();

    try {
      const res = await api.get(
        `/api/waiting/holiday/check?date=${holidayForm.date}&country=${holidayForm.country}`,
      );

      setResult({
        title: "Holiday Check",
        message: res.data.message,
      });

      setMessage(res.data.message);
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function checkCapacity(event) {
    event.preventDefault();

    try {
      const query = new URLSearchParams(capacityForm).toString();
      const res = await api.get(`/api/waiting/capacity/check?${query}`);

      setResult({
        title: "Capacity Check",
        message: res.data.warning || "Capacity is realistic",
      });

      setMessage(res.data.warning || "Capacity is realistic");
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function estimateWaitingTime(event) {
    event.preventDefault();

    try {
      const res = await api.get(
        `/api/waiting/${waitingForm.branchId}?waitingPeople=${waitingForm.waitingPeople}&averageServiceTime=${waitingForm.averageServiceTime}`,
      );

      setResult({
        title: "Waiting Time Estimated",
        message: res.data.message,
      });

      setMessage(res.data.message);
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function updateQueueStatus(event) {
    event.preventDefault();

    try {
      const res = await api.patch(
        `/api/queue/tokens/${queueStatusForm.tokenId}/status`,
        {
          status: queueStatusForm.status,
        },
      );

      setResult({
        title: "Queue Updated",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function sendEmail(event) {
    event.preventDefault();

    try {
      const res = await api.post("/api/notifications/send", emailForm);

      setResult({
        title: "Manual Notification Processed",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function sendQueueAlerts(event) {
    event.preventDefault();

    try {
      const res = await api.post(
        "/api/notifications/queue-alerts",
        queueAlertForm,
      );

      setResult({
        title: "Queue Alerts Processed",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function sendAppointmentReminders(event) {
    event.preventDefault();

    try {
      const res = await api.post(
        "/api/notifications/appointment-reminders",
        appointmentReminderForm,
      );

      setResult({
        title: "Appointment Reminders Processed",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const res = await api.delete(`/api/notifications/${notificationId}`);
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function searchSlots(event) {
    event.preventDefault();

    try {
      const query = new URLSearchParams(slotSearchForm).toString();
      const res = await api.get(`/api/slots/search?${query}`);
      const slots = normalizeList(res.data);

      setSlotResults(slots);

      setResult({
        title: "Slot Search Completed",
        message:
          slots.length > 0
            ? `${slots.length} branch result found.`
            : "No available slot found.",
      });

      setMessage("");
    } catch (error) {
      setSlotResults([]);
      setResult({
        title: "Slot Search Failed",
        message: showError(error),
      });
      setMessage("");
    }
  }

  async function loadActivity(event) {
    event.preventDefault();

    try {
      const res = await api.get(`/api/activity?email=${activityEmail}`);

      setActivityResult(res.data);

      setResult({
        title: "Activity History Loaded",
        message: `Tokens: ${res.data.tokens?.length || 0}, Appointments: ${
          res.data.appointments?.length || 0
        }, Notifications: ${res.data.notifications?.length || 0}`,
      });

      setMessage("Citizen activity loaded");
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function loadComparison() {
    try {
      const res = await api.get(`/api/analytics/compare?date=${today()}`);
      setAnalyticsResult({
        type: "compare",
        data: res.data,
      });
      setMessage("Branch load comparison loaded");
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function loadLeastCrowded() {
    try {
      const res = await api.get(`/api/analytics/least-crowded?date=${today()}`);
      setAnalyticsResult({
        type: "least",
        data: res.data,
      });
      setMessage("Least crowded branch loaded");
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function loadHistoryAnalytics() {
    try {
      const res = await api.get("/api/analytics/history");
      setAnalyticsResult({
        type: "history",
        data: res.data,
      });
      setMessage("Historical analytics loaded");
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function generateReport(event) {
    event.preventDefault();

    try {
      const query = new URLSearchParams({
        startDate: reportForm.startDate,
        endDate: reportForm.endDate,
        branchId: reportForm.branchId,
      }).toString();

      const res = await api.get(`/api/reports/generate?${query}`);

      setResult({
        title: "Report Generated",
        message: `Total tokens: ${res.data.metrics?.totalTokens || 0}, Users served: ${
          res.data.metrics?.totalUsersServed || 0
        }`,
      });

      setMessage("Report generated");
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function saveReport() {
    try {
      const res = await api.post("/api/reports/save", reportForm);

      setResult({
        title: "Report Saved",
        message: res.data.message,
      });

      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  async function deleteReport(reportId) {
    try {
      const res = await api.delete(`/api/reports/${reportId}`);
      setMessage(res.data.message);
      await loadAll();
    } catch (error) {
      setMessage(showError(error));
    }
  }

  function renderResultPanel() {
    if (!result) return null;

    return (
      <section className="result-card">
        <div>
          <span>Action Result</span>
          <h2>{result.title}</h2>
          <p>{result.message}</p>
        </div>

        <button className="soft-btn" onClick={() => setResult(null)}>
          Hide
        </button>
      </section>
    );
  }

  function renderInlineResultPanel(allowedTitles) {
    if (!result || !allowedTitles.includes(result.title)) return null;

    return (
      <div className="inline-result-panel">
        <section className="result-card inline-result-card">
          <div>
            <span>Action Result</span>
            <h2>{result.title}</h2>
            <p>{result.message}</p>
          </div>

          <button className="soft-btn" type="button" onClick={() => setResult(null)}>
            Hide
          </button>
        </section>
      </div>
    );
  }

  function renderAccessDenied(title) {
    return (
      <section className="section">
        <h2>{title}</h2>
        <div className="empty-state">
          This module is available for Admin users only. Log out and sign up or log in
          with role Admin to use this section.
        </div>
      </section>
    );
  }

  function renderAnalyticsResult() {
    if (!analyticsResult) return null;

    return (
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Analytics Result</h2>
            <p>Generated from current queue records.</p>
          </div>

          <button className="secondary-btn" onClick={() => setAnalyticsResult(null)}>
            Hide
          </button>
        </div>

        {analyticsResult.type === "compare" && (
          <div className="card-grid">
            {analyticsResult.data.branches.map((branch) => (
              <div className="mini-card" key={branch.branchId}>
                <h4>{branch.branchName}</h4>
                <p>Status: {branch.status}</p>
                <p>Waiting Count: {branch.waitingCount}</p>
                <p>Daily Capacity: {branch.dailyCapacity}</p>
                <p>Load: {branch.loadPercentage}%</p>
              </div>
            ))}
          </div>
        )}

        {analyticsResult.type === "least" && (
          <div className="mini-card accent-card">
            <h4>Least Crowded Branch</h4>
            {analyticsResult.data.leastCrowded ? (
              <>
                <p>Branch: {analyticsResult.data.leastCrowded.branchName}</p>
                <p>Waiting: {analyticsResult.data.leastCrowded.waitingCount}</p>
                <p>Daily Capacity: {analyticsResult.data.leastCrowded.dailyCapacity}</p>
              </>
            ) : (
              <p>No active branch found.</p>
            )}
          </div>
        )}

        {analyticsResult.type === "history" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Tokens</th>
                  <th>Completed</th>
                  <th>Waiting</th>
                </tr>
              </thead>

              <tbody>
                {analyticsResult.data.history.map((item) => (
                  <tr key={item.date}>
                    <td>{item.date}</td>
                    <td>{item.totalTokens}</td>
                    <td>{item.completedTokens}</td>
                    <td>{item.waitingTokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  function renderSlotResults() {
    if (!slotResults || slotResults.length === 0) return null;

    return (
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Available Slot Search Results</h2>
            <p>Booked slots are excluded. Queue length is shown for each branch.</p>
          </div>

          <button className="secondary-btn" onClick={() => setSlotResults([])}>
            Clear Results
          </button>
        </div>

        <div className="card-grid">
          {slotResults.map((item) => (
            <div className="mini-card" key={`${item.branchId}-${item.date}`}>
              <h4>{item.branchName}</h4>
              <p>Service: {item.serviceType}</p>
              <p>Date: {item.date}</p>
              <p>Current Queue Length: {item.queueLength}</p>

              <h4>Available Slots</h4>

              {item.availableSlots?.length > 0 ? (
                <div className="button-row">
                  {item.availableSlots.map((slot) => (
                    <span className="badge" key={slot}>
                      {slot}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No available slot for this branch.</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderActivityHistory() {
    if (!activityResult) return null;

    const activityTokens = activityResult.tokens || [];
    const activityAppointments = activityResult.appointments || [];
    const activityNotifications = activityResult.notifications || [];

    return (
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Structured Citizen Activity History</h2>
            <p>
              Showing token, appointment, and notification history for{" "}
              {activityResult.email}.
            </p>
          </div>

          <button className="secondary-btn" onClick={() => setActivityResult(null)}>
            Clear History
          </button>
        </div>

        <h2>Token History</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Citizen</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Branch</th>
                <th>Service</th>
                <th>Date</th>
                <th>Position</th>
                <th>Waiting Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {activityTokens.length === 0 && (
                <tr>
                  <td colSpan="10">No token history found.</td>
                </tr>
              )}

              {activityTokens.map((token) => (
                <tr key={token._id}>
                  <td>{token.tokenCode || token.tokenNumber}</td>
                  <td>{token.name || token.citizenName}</td>
                  <td>{token.email}</td>
                  <td>{token.phone}</td>
                  <td>{token.branch?.name || "Not available"}</td>
                  <td>{token.service?.serviceName || token.service?.name || "Not available"}</td>
                  <td>{token.preferredDate}</td>
                  <td>{token.queuePosition || token.queueNumber}</td>
                  <td>{token.estimatedWaitingTime || 0} min</td>
                  <td>
                    <span className="badge">{token.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ marginTop: "24px" }}>Appointment History</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Citizen</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Branch</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {activityAppointments.length === 0 && (
                <tr>
                  <td colSpan="8">No appointment history found.</td>
                </tr>
              )}

              {activityAppointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{appointment.name}</td>
                  <td>{appointment.email}</td>
                  <td>{appointment.phone}</td>
                  <td>{appointment.branch?.name || "Not available"}</td>
                  <td>
                    {appointment.serviceType ||
                      appointment.service?.serviceName ||
                      appointment.service?.name ||
                      "Not available"}
                  </td>
                  <td>{appointment.preferredDate}</td>
                  <td>{appointment.timeSlot}</td>
                  <td>
                    <span className="badge">{appointment.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ marginTop: "24px" }}>Notification History</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Channel</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>

            <tbody>
              {activityNotifications.length === 0 && (
                <tr>
                  <td colSpan="7">No notification history found.</td>
                </tr>
              )}

              {activityNotifications.map((notification) => (
                <tr key={notification._id}>
                  <td>{displayNotificationType(notification.type)}</td>
                  <td>{notification.channel || "EMAIL"}</td>
                  <td>{getNotificationEmail(notification)}</td>
                  <td>{getNotificationPhone(notification)}</td>
                  <td>{notification.subject || "No subject"}</td>
                  <td>
                    <span className="badge">
                      {displayNotificationStatus(notification)}
                    </span>
                  </td>
                  <td>{getNotificationError(notification)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const navItems = [
    ["dashboard", "Dashboard"],
    ["branches", "Branch Setup"],
    [isAdmin ? "queue" : "queue", isAdmin ? "Queue Management" : "Request Token"],
    ["appointments", "Appointments & Slots"],
    ["notifications", isAdmin ? "Notifications" : "My Activity"],
    ["analytics", "Analytics & Reports"],
    ["map", "Map View"],
  ];

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
          <div className="logo-container">
            <img src={logo} alt="EQueue logo" className="auth-logo" />
          </div>
            <div>
            </div>
          </div>

          <h2>{authMode === "login" ? "Login" : "Create Account"}</h2>
          <p className="muted">New accounts are created as Citizen users. Admin access is assigned by the system owner.</p>

          <form onSubmit={handleAuthSubmit} className="form-grid one">
            {authMode === "register" && (
              <>
                <input
                  placeholder="Full name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                />

              </>
            )}

            <input
              placeholder="Email"
              type="email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
            />

            <input
              placeholder="Password"
              type="password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
            />

            <button className="primary-btn" type="submit">
              {authMode === "login" ? "Login" : "Signup"}
            </button>
          </form>

          <div className="button-row">
            <button
              className="secondary-btn"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login"
                ? "Need an account? Signup"
                : "Already have an account? Login"}
            </button>
          </div>

          {message && <div className="notice compact">{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand-block">
          <img src={logo} alt="EQueue logo" className="brand-logo" />

          <div>
            <p>Government Service Queue Transparency and Smart Slot Management System</p>
          </div>
        </div>

        <div className="user-block">
          <div>
            <strong>{user.name}</strong>
            <span>
              {user.email} | {user.role || "Citizen"}
            </span>
          </div>

          <button className="danger-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="top-nav">
        {navItems.map(([key, label]) => (
          <button
            key={key}
            className={activeModule === key ? "top-nav-btn active" : "top-nav-btn"}
            onClick={() => changeModule(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="page">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">
              {isAdmin ? "Admin Control Panel" : "Citizen Service Portal"}
            </span>
            <h1>Smart Slot Management for Public Services</h1>
            <p>
              A MERN based queue intelligence platform for branch setup, digital tokens,
              appointment slots, email alerts, analytics, reports, and map visualization.
            </p>
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <span>Branches</span>
              <strong>{branches.length}</strong>
            </div>

            <div className="stat-card">
              <span>Services</span>
              <strong>{services.length}</strong>
            </div>

            <div className="stat-card">
              <span>{isAdmin ? "Tokens" : "My Tokens"}</span>
              <strong>{visibleTokensForUser.length}</strong>
            </div>

            <div className="stat-card">
              <span>{isAdmin ? "Appointments" : "My Appointments"}</span>
              <strong>{visibleAppointmentsForUser.length}</strong>
            </div>
          </div>
        </section>

        {message && <div className="notice">{message}</div>}

        {activeModule === "dashboard" && (
          <>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>System Overview</h2>
                  <p>Role based workflow summary for the EQueue platform.</p>
                </div>
              </div>

              <div className="card-grid">
                <div className="mini-card">
                  <h4>Admin Branch Control</h4>
                  <p>Create, update, deactivate, and delete branches with auto coordinates.</p>
                </div>

                <div className="mini-card">
                  <h4>Token Workflow</h4>
                  <p>Citizens request tokens while Admin manages queue status and service data.</p>
                </div>

                <div className="mini-card">
                  <h4>Jakia Notification Logic</h4>
                  <p>Queue alerts for upcoming tokens and slot reminders within 1 hour.</p>
                </div>

                <div className="mini-card">
                  <h4>Activity and Slot Search</h4>
                  <p>Citizens can see complete token, appointment, and notification history.</p>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>{isAdmin ? "Recent Tokens" : "My Recent Tokens"}</h2>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Citizen</th>
                      <th>Date</th>
                      <th>Branch</th>
                      <th>Service</th>
                      <th>Status</th>
                      {isAdmin && <th>Action</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {recentTokens.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6}>No token records found.</td>
                      </tr>
                    )}

                    {recentTokens.map((token, index) => (
                      <tr key={token._id}>
                        <td>{token.tokenCode || token.tokenNumber || `Token-${index + 1}`}</td>
                        <td>{token.name || token.citizenName || token.email || "Not available"}</td>
                        <td>{token.preferredDate || "Not available"}</td>
                        <td>{token.branch?.name || "Not available"}</td>
                        <td>{token.service?.serviceName || token.service?.name || "Not available"}</td>
                        <td>
                          <span className="badge">{token.status || "Unknown"}</span>
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              className="danger-btn mini"
                              onClick={() => deleteToken(token._id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleTokensForUser.length > visibleTokenCount && (
                <div className="table-footer">
                  <button
                    className="secondary-btn"
                    onClick={() => setVisibleTokenCount(visibleTokenCount + 10)}
                  >
                    Show More Tokens
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {activeModule === "branches" &&
          (isAdmin ? (
            <>
              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Branch Setup and Status Control</h2>
                    <p>
                      Admin creates service branches. Latitude and longitude are detected
                      from the address automatically.
                    </p>
                  </div>
                </div>

                <form onSubmit={createBranch} className="form-grid">
                  <input
                    placeholder="Branch name"
                    value={branchForm.name}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, name: e.target.value })
                    }
                  />

                  <input
                    placeholder="Full branch address"
                    value={branchForm.address}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, address: e.target.value })
                    }
                  />

                  <select
                    value={branchForm.open}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, open: e.target.value })
                    }
                  >
                    <option value="">Opening time</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>

                  <select
                    value={branchForm.close}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, close: e.target.value })
                    }
                  >
                    <option value="">Closing time</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Daily capacity"
                    value={branchForm.dailyCapacity}
                    onChange={(e) =>
                      setBranchForm({
                        ...branchForm,
                        dailyCapacity: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Active counters"
                    value={branchForm.activeCounters}
                    onChange={(e) =>
                      setBranchForm({
                        ...branchForm,
                        activeCounters: e.target.value,
                      })
                    }
                  />

                  <select
                    value={branchForm.status}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, status: e.target.value })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={autoFillCoordinates}
                  >
                    Auto Detect Coordinates
                  </button>

                  <input
                    placeholder="Latitude auto filled"
                    value={branchForm.latitude}
                    readOnly
                  />

                  <input
                    placeholder="Longitude auto filled"
                    value={branchForm.longitude}
                    readOnly
                  />

                  <button className="primary-btn form-wide" type="submit">
                    Create Branch
                  </button>
                </form>

                {coordinateStatus && (
                  <div className="notice subtle">{coordinateStatus}</div>
                )}

                <div className="card-grid">
                  {branches.map((branch) => (
                    <div className="mini-card branch-card" key={branch._id}>
                      <h4>{branch.name}</h4>
                      <p>{branch.address}</p>
                      <span className="badge">{branch.status}</span>
                      <p>
                        Hours: {branch.workingHours?.open} to{" "}
                        {branch.workingHours?.close}
                      </p>
                      <p>
                        Counters: {branch.activeCounters} | Capacity:{" "}
                        {branch.dailyCapacity}
                      </p>

                      <div className="button-row">
                        <button
                          className="secondary-btn mini"
                          onClick={() => updateBranchStatus(branch._id, "Active")}
                        >
                          Active
                        </button>

                        <button
                          className="secondary-btn mini"
                          onClick={() => updateBranchStatus(branch._id, "Inactive")}
                        >
                          Inactive
                        </button>

                        <button
                          className="secondary-btn mini"
                          onClick={() =>
                            updateBranchStatus(branch._id, "Maintenance")
                          }
                        >
                          Maintenance
                        </button>

                        <button
                          className="danger-btn mini"
                          onClick={() => deleteBranch(branch._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="section">
                <h2>Holiday and Capacity Validation</h2>

                <div className="two-column">
                  <form onSubmit={checkHoliday} className="mini-card">
                    <h4>Public Holiday Check</h4>

                    <input
                      type="date"
                      value={holidayForm.date}
                      onChange={(e) =>
                        setHolidayForm({ ...holidayForm, date: e.target.value })
                      }
                    />

                    <input
                      placeholder="Country code, example BD"
                      value={holidayForm.country}
                      onChange={(e) =>
                        setHolidayForm({ ...holidayForm, country: e.target.value })
                      }
                    />

                    <button className="primary-btn" type="submit">
                      Check Holiday
                    </button>
                  </form>

                  <form onSubmit={checkCapacity} className="mini-card">
                    <h4>Capacity Control</h4>

                    <select
                      value={capacityForm.branchId}
                      onChange={(e) =>
                        setCapacityForm({
                          ...capacityForm,
                          branchId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={capacityForm.serviceId}
                      onChange={(e) =>
                        setCapacityForm({
                          ...capacityForm,
                          serviceId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.serviceName}
                        </option>
                      ))}
                    </select>

                    <input
                      placeholder="Daily capacity to check"
                      value={capacityForm.dailyCapacity}
                      onChange={(e) =>
                        setCapacityForm({
                          ...capacityForm,
                          dailyCapacity: e.target.value,
                        })
                      }
                    />

                    <button className="primary-btn" type="submit">
                      Check Capacity
                    </button>
                  </form>
                </div>
              </section>

              {renderResultPanel()}
            </>
          ) : (
            renderAccessDenied("Branch Setup")
          ))}

        {activeModule === "queue" && (
          <>
            {isAdmin && (
              <section className="section">
                <h2>Service Configuration</h2>

                <form onSubmit={createService} className="form-grid">
                  <input
                    placeholder="Service name"
                    value={serviceForm.serviceName}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        serviceName: e.target.value,
                      })
                    }
                  />

                  <select
                    value={serviceForm.category}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, category: e.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {SERVICE_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Average processing time in minutes"
                    value={serviceForm.averageProcessingTime}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        averageProcessingTime: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Service fee"
                    value={serviceForm.serviceFee}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        serviceFee: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Required documents, comma separated"
                    value={serviceForm.requiredDocuments}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        requiredDocuments: e.target.value,
                      })
                    }
                  />

                  <select
                    value={serviceForm.priorityLevel}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        priorityLevel: e.target.value,
                      })
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  <textarea
                    placeholder="Description"
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        description: e.target.value,
                      })
                    }
                  />

                  <button className="primary-btn" type="submit">
                    Create Service
                  </button>
                </form>

                <div className="card-grid">
                  {services.map((service) => (
                    <div className="mini-card" key={service._id}>
                      <h4>{service.serviceName}</h4>
                      <p>{service.category}</p>
                      <p>Average time: {service.averageProcessingTime} minutes</p>
                      <p>Fee: {service.serviceFee}</p>
                      <span className="badge">{service.priorityLevel}</span>

                      <div className="button-row">
                        <button
                          className="danger-btn mini"
                          onClick={() => deleteService(service._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="section">
              <h2>{isAdmin ? "Token Generation and Queue Status" : "Request Token"}</h2>

              <div className="two-column">
                <form onSubmit={createToken} className="mini-card">
                  <h4>Generate Digital Token</h4>

                  <select
                    value={tokenForm.branchId}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, branchId: e.target.value })
                    }
                  >
                    <option value="">Select branch</option>
                    {activeBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={tokenForm.serviceId}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, serviceId: e.target.value })
                    }
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={tokenForm.preferredDate}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, preferredDate: e.target.value })
                    }
                  />

                  <input
                    placeholder="Citizen name"
                    value={tokenForm.name}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, name: e.target.value })
                    }
                  />

                  <input
                    placeholder="Email"
                    value={tokenForm.email}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, email: e.target.value })
                    }
                  />

                  <input
                    placeholder="Phone"
                    value={tokenForm.phone}
                    onChange={(e) =>
                      setTokenForm({ ...tokenForm, phone: e.target.value })
                    }
                  />

                  <select
                    value={tokenForm.isPriority ? "true" : "false"}
                    onChange={(e) =>
                      setTokenForm({
                        ...tokenForm,
                        isPriority: e.target.value === "true",
                      })
                    }
                  >
                    <option value="false">Regular Token</option>
                    <option value="true">Priority Token</option>
                  </select>

                  <button className="primary-btn" type="submit">
                    Generate Token
                  </button>
                </form>

                {isAdmin && (
                  <form onSubmit={updateQueueStatus} className="mini-card">
                    <h4>Update Queue Status</h4>

                    <select
                      value={queueStatusForm.tokenId}
                      onChange={(e) =>
                        setQueueStatusForm({
                          ...queueStatusForm,
                          tokenId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select token</option>
                      {tokens.map((token, index) => (
                        <option key={token._id} value={token._id}>
                          {token.tokenCode || token.tokenNumber || `Token-${index + 1}`} |{" "}
                          {token.name || token.citizenName || token.email || "Unknown"} | {token.status}
                        </option>
                      ))}
                    </select>

                    <select
                      value={queueStatusForm.status}
                      onChange={(e) =>
                        setQueueStatusForm({
                          ...queueStatusForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="Serving">Serving</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <button className="primary-btn" type="submit">
                      Update Status
                    </button>
                  </form>
                )}
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Citizen</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Branch</th>
                      <th>Service</th>
                      <th>Status</th>
                      {isAdmin && <th>Action</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {recentTokens.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7}>No queue tokens found.</td>
                      </tr>
                    )}

                    {recentTokens.map((token, index) => (
                      <tr key={token._id}>
                        <td>{token.tokenCode || token.tokenNumber || `Token-${index + 1}`}</td>
                        <td>{token.name || token.citizenName || "Not available"}</td>
                        <td>{token.email || "Not available"}</td>
                        <td>{token.preferredDate || "Not available"}</td>
                        <td>{token.branch?.name || "Not available"}</td>
                        <td>{token.service?.serviceName || token.service?.name || "Not available"}</td>
                        <td>
                          <span className="badge">{token.status || "Unknown"}</span>
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              className="danger-btn mini"
                              onClick={() => deleteToken(token._id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleTokensForUser.length > visibleTokenCount && (
                <div className="table-footer">
                  <button
                    className="secondary-btn"
                    onClick={() => setVisibleTokenCount(visibleTokenCount + 10)}
                  >
                    Show More Tokens
                  </button>
                </div>
              )}
            </section>

            <section className="section">
              <h2>Waiting Time Estimation</h2>

              <form onSubmit={estimateWaitingTime} className="form-grid">
                <select
                  value={waitingForm.branchId}
                  onChange={(e) =>
                    setWaitingForm({ ...waitingForm, branchId: e.target.value })
                  }
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="People waiting"
                  value={waitingForm.waitingPeople}
                  onChange={(e) =>
                    setWaitingForm({
                      ...waitingForm,
                      waitingPeople: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Average service time"
                  value={waitingForm.averageServiceTime}
                  onChange={(e) =>
                    setWaitingForm({
                      ...waitingForm,
                      averageServiceTime: e.target.value,
                    })
                  }
                />

                <button className="primary-btn" type="submit">
                  Estimate Waiting Time
                </button>
              </form>
            </section>

            {renderResultPanel()}
          </>
        )}

        {activeModule === "appointments" && (
          <>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Appointments and Slot Management</h2>
                  <p>
                    Book appointments, search available slots, view full appointment records,
                    and reschedule or cancel from one place.
                  </p>
                </div>
              </div>

              <div className="subsection-block">
                <h2>Book Appointment</h2>
                <p className="muted">
                  Select branch, service, date, and a valid dropdown time slot.
                </p>

                <form onSubmit={createAppointment} className="form-grid">
                  <select
                    value={appointmentForm.branchId}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        branchId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select branch</option>
                    {activeBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={appointmentForm.serviceId}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        serviceId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={appointmentForm.preferredDate}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        preferredDate: e.target.value,
                      })
                    }
                  />

                  <select
                    value={appointmentForm.timeSlot}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        timeSlot: e.target.value,
                      })
                    }
                  >
                    <option value="">Select time slot</option>
                    {TIME_SLOT_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Name"
                    value={appointmentForm.name}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, name: e.target.value })
                    }
                  />

                  <input
                    placeholder="Email"
                    value={appointmentForm.email}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, email: e.target.value })
                    }
                  />

                  <input
                    placeholder="Phone"
                    value={appointmentForm.phone}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, phone: e.target.value })
                    }
                  />

                  <button className="primary-btn" type="submit">
                    Book Appointment
                  </button>
                </form>
              </div>

              <div className="subsection-block">
                <h2>Advanced Slot Search and Filtering</h2>
                <p className="muted">
                  Search by branch, service type, date, optional time slot, and maximum queue length.
                </p>

                <form onSubmit={searchSlots} className="form-grid">
                  <select
                    value={slotSearchForm.branchId}
                    onChange={(e) =>
                      setSlotSearchForm({
                        ...slotSearchForm,
                        branchId: e.target.value,
                      })
                    }
                  >
                    <option value="">All active branches</option>
                    {activeBranches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={slotSearchForm.serviceCategory}
                    onChange={(e) =>
                      setSlotSearchForm({
                        ...slotSearchForm,
                        serviceCategory: e.target.value,
                        serviceType: "",
                      })
                    }
                  >
                    <option value="">All service categories</option>
                    {SERVICE_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <select
                    value={slotSearchForm.serviceType}
                    onChange={(e) =>
                      setSlotSearchForm({
                        ...slotSearchForm,
                        serviceType: e.target.value,
                      })
                    }
                  >
                    <option value="">Select service type</option>
                    {slotSearchServices.map((service) => (
                      <option key={service._id} value={service.serviceName}>
                        {service.serviceName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={slotSearchForm.date}
                    onChange={(e) =>
                      setSlotSearchForm({ ...slotSearchForm, date: e.target.value })
                    }
                  />

                  <select
                    value={slotSearchForm.timeSlot}
                    onChange={(e) =>
                      setSlotSearchForm({
                        ...slotSearchForm,
                        timeSlot: e.target.value,
                      })
                    }
                  >
                    <option value="">All available slots</option>
                    {TIME_SLOT_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Maximum queue length optional"
                    value={slotSearchForm.maxQueueLength}
                    onChange={(e) =>
                      setSlotSearchForm({
                        ...slotSearchForm,
                        maxQueueLength: e.target.value,
                      })
                    }
                  />

                  <button className="primary-btn" type="submit">
                    Search Slots
                  </button>
                </form>

                {renderInlineResultPanel([
                  "Slot Search Completed",
                  "Slot Search Failed",
                ])}

                {slotResults && slotResults.length > 0 && (
                  <div className="inline-result-panel">
                    <div className="section-head compact-head">
                      <div>
                        <h2>Available Slot Results</h2>
                        <p>Booked slots are excluded. Queue length is shown for each branch.</p>
                      </div>

                      <button className="secondary-btn" onClick={() => setSlotResults([])}>
                        Clear Results
                      </button>
                    </div>

                    <div className="card-grid">
                      {slotResults.map((item) => (
                        <div className="mini-card" key={`${item.branchId}-${item.date}`}>
                          <h4>{item.branchName}</h4>
                          <p>Service: {item.serviceType}</p>
                          <p>Date: {item.date}</p>
                          <p>Current Queue Length: {item.queueLength}</p>

                          <h4>Available Slots</h4>
                          {item.availableSlots?.length > 0 ? (
                            <div className="button-row">
                              {item.availableSlots.map((slot) => (
                                <span className="badge" key={slot}>
                                  {slot}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p>No available slot for this branch.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="subsection-block">
                <h2>{isAdmin ? "Appointment Records" : "My Appointment Records"}</h2>
                <p className="muted">
                  Full appointment information is shown here, including citizen contact, branch,
                  service, date, slot, and status.
                </p>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Branch</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Time Slot</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentAppointments.length === 0 && (
                        <tr>
                          <td colSpan="9">No appointment records found.</td>
                        </tr>
                      )}

                      {recentAppointments.map((appointment) => (
                        <tr key={appointment._id}>
                          <td>{appointment.name || "Not available"}</td>
                          <td>{appointment.email || "Not available"}</td>
                          <td>{appointment.phone || "Not available"}</td>
                          <td>{appointment.branch?.name || "Not available"}</td>
                          <td>
                            {appointment.serviceType ||
                              appointment.service?.serviceName ||
                              appointment.service?.name ||
                              "Not available"}
                          </td>
                          <td>{appointment.preferredDate || "Not available"}</td>
                          <td>{appointment.timeSlot || "Not available"}</td>
                          <td>
                            <span className="badge">
                              {appointment.status || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="danger-btn mini"
                              onClick={() => cancelAppointment(appointment._id)}
                            >
                              Cancel
                            </button>
                            {isAdmin && (
                              <button
                                className="danger-btn mini"
                                onClick={() => deleteAppointmentRecord(appointment._id)}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {visibleAppointmentsForUser.length > visibleAppointmentCount && (
                  <div className="table-footer">
                    <button
                      className="secondary-btn"
                      onClick={() =>
                        setVisibleAppointmentCount(visibleAppointmentCount + 12)
                      }
                    >
                      Show More Appointments
                    </button>
                  </div>
                )}
              </div>

              <div className="subsection-block">
                <h2>Reschedule Selected Appointment</h2>
                <p className="muted">
                  Choose an appointment record, then select a new date and valid time slot.
                </p>

                <form onSubmit={rescheduleAppointment} className="form-grid">
                  <select
                    value={rescheduleForm.appointmentId}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        appointmentId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select appointment</option>
                    {visibleAppointmentsForUser.map((appointment) => (
                      <option key={appointment._id} value={appointment._id}>
                        {appointment.name || "No name"} | {appointment.email || "No email"} |{" "}
                        {appointment.serviceType || appointment.service?.serviceName || "No service"} |{" "}
                        {appointment.preferredDate} | {appointment.timeSlot} | {appointment.status}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={rescheduleForm.preferredDate}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        preferredDate: e.target.value,
                      })
                    }
                  />

                  <select
                    value={rescheduleForm.timeSlot}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        timeSlot: e.target.value,
                      })
                    }
                  >
                    <option value="">Select new time slot</option>
                    {TIME_SLOT_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>

                  <button className="primary-btn" type="submit">
                    Reschedule
                  </button>
                </form>
              </div>
            </section>

          </>
        )}

        {activeModule === "notifications" && (
          <>
            <section className="section">
              <h2>{isAdmin ? "Email Notifications and Citizen Activity" : "My Activity"}</h2>

              <div className="two-column">
                {isAdmin && (
                  <>
                    <form onSubmit={sendQueueAlerts} className="mini-card">
                      <h4>Autogenerated Queue Alert</h4>
                      <p>
                        Sends email and simulated SMS to the first/upcoming 3 waiting tokens.
                      </p>

                      <select
                        value={queueAlertForm.branchId}
                        onChange={(e) =>
                          setQueueAlertForm({
                            ...queueAlertForm,
                            branchId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={queueAlertForm.date}
                        onChange={(e) =>
                          setQueueAlertForm({
                            ...queueAlertForm,
                            date: e.target.value,
                          })
                        }
                      />

                      <button className="primary-btn" type="submit">
                        Send Queue Alerts
                      </button>
                    </form>

                    <form onSubmit={sendAppointmentReminders} className="mini-card">
                      <h4>Autogenerated Appointment Reminder</h4>
                      <p>
                        Sends reminders for confirmed appointments whose slot starts within 1 hour.
                      </p>

                      <input
                        type="date"
                        value={appointmentReminderForm.date}
                        onChange={(e) =>
                          setAppointmentReminderForm({
                            ...appointmentReminderForm,
                            date: e.target.value,
                          })
                        }
                      />

                      <button className="success-btn" type="submit">
                        Send Appointment Reminders
                      </button>
                    </form>

                    <form onSubmit={sendEmail} className="mini-card">
                      <h4>Manual Email or SMS Test</h4>

                      <input
                        placeholder="Recipient email"
                        value={emailForm.email}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, email: e.target.value })
                        }
                      />

                      <input
                        placeholder="Phone optional"
                        value={emailForm.phone}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, phone: e.target.value })
                        }
                      />

                      <select
                        value={emailForm.type}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, type: e.target.value })
                        }
                      >
                        <option value="GENERAL">General</option>
                        <option value="QUEUE_ALERT">Queue Alert</option>
                        <option value="SLOT_REMINDER">Slot Reminder</option>
                      </select>

                      <input
                        placeholder="Subject"
                        value={emailForm.subject}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, subject: e.target.value })
                        }
                      />

                      <textarea
                        placeholder="Message"
                        value={emailForm.message}
                        onChange={(e) =>
                          setEmailForm({ ...emailForm, message: e.target.value })
                        }
                      />

                      <button className="primary-btn" type="submit">
                        Send Manual Notification
                      </button>
                    </form>
                  </>
                )}

                <form onSubmit={loadActivity} className="mini-card">
                  <h4>Citizen Activity History</h4>

                  <input
                    placeholder="Citizen email"
                    value={activityEmail}
                    onChange={(e) => setActivityEmail(e.target.value)}
                  />

                  <button className="primary-btn" type="submit">
                    Search Activity
                  </button>
                </form>
              </div>

              <div className="card-grid">
                {visibleNotificationsForUser.slice(0, 8).map((notification) => (
                  <div className="mini-card" key={notification._id}>
                    <h4>{notification.subject || displayNotificationType(notification.type)}</h4>
                    <p>{getNotificationEmail(notification)}</p>
                    <p>{notification.message}</p>
                    <span className="badge">
                      {notification.channel || "EMAIL"}: {displayNotificationStatus(notification)}
                    </span>

                    {getNotificationError(notification) !== "None" && (
                      <p>Error: {getNotificationError(notification)}</p>
                    )}

                    {isAdmin && (
                      <div className="button-row">
                        <button
                          className="danger-btn mini"
                          onClick={() => deleteNotification(notification._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {renderActivityHistory()}
            {renderResultPanel()}
          </>
        )}

        {activeModule === "analytics" &&
          (isAdmin ? (
            <>
              <section className="section">
                <h2>Analytics and Reports</h2>

                <div className="button-row">
                  <button className="primary-btn" onClick={loadComparison}>
                    Compare Branch Load
                  </button>

                  <button className="success-btn" onClick={loadLeastCrowded}>
                    Find Least Crowded Branch
                  </button>

                  <button className="dark-btn" onClick={loadHistoryAnalytics}>
                    Load Historical Trends
                  </button>
                </div>
              </section>

              {renderAnalyticsResult()}

              <section className="section">
                <h2>Operational Report Generation</h2>

                <form onSubmit={generateReport} className="form-grid">
                  <input
                    placeholder="Report name"
                    value={reportForm.reportName}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, reportName: e.target.value })
                    }
                  />

                  <input
                    type="date"
                    value={reportForm.startDate}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, startDate: e.target.value })
                    }
                  />

                  <input
                    type="date"
                    value={reportForm.endDate}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, endDate: e.target.value })
                    }
                  />

                  <select
                    value={reportForm.branchId}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, branchId: e.target.value })
                    }
                  >
                    <option value="">All branches</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>

                  <button className="primary-btn" type="submit">
                    Generate Report
                  </button>

                  <button className="success-btn" type="button" onClick={saveReport}>
                    Save Report
                  </button>
                </form>

                <div className="card-grid">
                  {recentReports.map((report) => (
                    <div className="mini-card" key={report._id}>
                      <h4>{report.reportName}</h4>
                      <p>
                        {report.startDate} to {report.endDate}
                      </p>
                      <p>Total Tokens: {report.metrics?.totalTokens}</p>
                      <p>Served: {report.metrics?.totalUsersServed}</p>
                      <p>Average Waiting: {report.metrics?.averageWaitingTime} minutes</p>

                      <button
                        className="danger-btn mini"
                        onClick={() => deleteReport(report._id)}
                      >
                        Delete Report
                      </button>
                    </div>
                  ))}
                </div>

                {reports.length > visibleReportCount && (
                  <div className="table-footer">
                    <button
                      className="secondary-btn"
                      onClick={() => setVisibleReportCount(visibleReportCount + 6)}
                    >
                      Show More Reports
                    </button>
                  </div>
                )}
              </section>

              {renderResultPanel()}
            </>
          ) : (
            renderAccessDenied("Analytics and Reports")
          ))}

        {activeModule === "map" && (
          <section className="section">
            <h2>Branch Map Visualization</h2>
            <p className="muted">
              All branches with valid coordinates are shown. Click a marker to view
              branch status, capacity, queue load, and token information.
            </p>

            <BranchMap branches={branchesWithMapStats} />
          </section>
        )}
      </main>
    </div>
  );
}
