import { useEffect, useState } from "react";
import {
  fetchBranches,
  fetchServices,
  generateToken
} from "../api/tokenApi";

const RequestTokenPage = () => {
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    branchId: "",
    serviceId: "",
    preferredDate: "",
    isPriority: false
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError("");
        const [branchesData, servicesData] = await Promise.all([
          fetchBranches(),
          fetchServices()
        ]);
        setBranches(branchesData);
        setServices(servicesData);
      } catch (err) {
        console.error(err);
        setError("Failed to load branches or services");
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessData(null);

    if (!formData.branchId || !formData.serviceId || !formData.preferredDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const result = await generateToken(formData);
      setSuccessData(result.token);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="token-card">
        <h1>Request Digital Queue Token</h1>

        <form onSubmit={handleSubmit} className="token-form">
          <div className="form-group">
            <label>Branch</label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              disabled={pageLoading}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Service Type</label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              disabled={pageLoading}
            >
              <option value="">Select service</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Date</label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="priority"
              name="isPriority"
              checked={formData.isPriority}
              onChange={handleChange}
            />
            <label htmlFor="priority">Request Priority Token</label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Generating..." : "Generate Token"}
          </button>
        </form>

        {error && <p className="message error">{error}</p>}

        {successData && (
          <div className="result-box">
            <h2>Token Generated Successfully</h2>
            <p>
              <strong>Token Number:</strong> {successData.tokenNumber}
            </p>
            <p>
              <strong>Branch:</strong> {successData.branch.name}
            </p>
            <p>
              <strong>Service:</strong> {successData.service.name}
            </p>
            <p>
              <strong>Date:</strong> {successData.preferredDate}
            </p>
            <p>
              <strong>Priority:</strong>{" "}
              {successData.isPriority ? "Yes" : "No"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestTokenPage;