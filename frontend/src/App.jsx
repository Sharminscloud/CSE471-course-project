import { useEffect, useState } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import "./App.css";

function App() {
  const [branches, setBranches] = useState([]);
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

  const API = "http://localhost:1163/api/branches";

  const getBranches = async () => {
    try {
      let url = API;
      const params = [];

      if (search) {
        params.push(`search=${search}`);
      }

      if (filterStatus) {
        params.push(`status=${filterStatus}`);
      }

      if (params.length > 0) {
        url = `${API}?${params.join("&")}`;
      }

      const res = await axios.get(url);
      setBranches(res.data);
    } catch (error) {
      setMessage("Failed to load branches");
    }
  };

  useEffect(() => {
    getBranches();
  }, [search, filterStatus]);

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
      await axios.post(API, newBranch);
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
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create branch");
    }
  };

  const deleteBranch = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setMessage("Branch deleted successfully");
      getBranches();
    } catch (error) {
      setMessage("Failed to delete branch");
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API}/${id}`, { status: newStatus });
      setMessage(`Branch status changed to ${newStatus}`);
      getBranches();
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
          <h2>Search and Filter</h2>
          <div className="form">
            <input
              type="text"
              placeholder="Search by branch name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
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
                    <span className={`status-badge ${branch.status.toLowerCase()}`}>
                      {branch.status}
                    </span>
                  </div>

                  <p><strong>Address:</strong> {branch.address}</p>
                  <p>
                    <strong>Hours:</strong> {branch.workingHours?.open} -{" "}
                    {branch.workingHours?.close}
                  </p>
                  <p><strong>Daily Capacity:</strong> {branch.dailyCapacity}</p>
                  <p><strong>Active Counters:</strong> {branch.activeCounters}</p>

                  <div className="buttons">
                    <button onClick={() => changeStatus(branch._id, "Active")}>
                      Active
                    </button>
                    <button onClick={() => changeStatus(branch._id, "Inactive")}>
                      Inactive
                    </button>
                    <button onClick={() => changeStatus(branch._id, "Maintenance")}>
                      Maintenance
                    </button>
                    <button
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
      </div>
    </div>
  );
}

export default App;