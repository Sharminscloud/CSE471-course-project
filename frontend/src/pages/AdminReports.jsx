import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function AdminReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // set default dates (last 7 days to today)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);

    fetchBranches();
    fetchSavedReports();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/branches`);
      const data = await res.json();
      setBranches(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      setSavedReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let url = `${API_BASE}/api/reports/generate?startDate=${startDate}&endDate=${endDate}`;
      if (branchId) url += `&branchId=${branchId}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!reportData) return;
    try {
      const payload = {
        reportName: `Performance Report - ${new Date().toLocaleDateString()}`,
        dateRange: { startDate, endDate },
        branch: branchId || null,
        metrics: reportData.metrics
      };
      const res = await fetch(`${API_BASE}/api/reports/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Report saved to system successfully!');
        fetchSavedReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSavedReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('EQueue Performance Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);
    
    const branchName = branchId ? branches.find(b => b._id === branchId)?.name : 'All Branches';
    doc.text(`Branch: ${branchName}`, 14, 36);

    const tableData = [
      ['Total Users Served', reportData.metrics.totalUsersServed],
      ['Average Wait Time', `${reportData.metrics.averageWaitTime} minutes`],
      ['Queue Performance', reportData.metrics.queuePerformanceScore]
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] }
    });

    doc.save(`equeue_report_${new Date().getTime()}.pdf`);
  };

  const printReport = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!reportData) return;
    const branchName = branchId ? branches.find(b => b._id === branchId)?.name : 'All Branches';
    const csvData = [
      { Metric: 'Start Date', Value: startDate },
      { Metric: 'End Date', Value: endDate },
      { Metric: 'Branch Name', Value: branchName },
      { Metric: 'Total Users Served', Value: reportData.metrics.totalUsersServed },
      { Metric: 'Average Wait Time (mins)', Value: reportData.metrics.averageWaitTime },
      { Metric: 'Queue Performance', Value: reportData.metrics.queuePerformanceScore },
    ];
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `equeue_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
          <h2 className="text-2xl font-semibold text-white">Generate Performance Report</h2>
          <p className="mt-2 text-slate-400 mb-6">Select parameters to extract system queue insights.</p>
          
          <form className="grid gap-4 sm:grid-cols-3" onSubmit={handleGenerate}>
            <label className="space-y-2 text-sm text-slate-300">
              Start Date
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              End Date
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Branch Filter
              <select
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </label>
            <div className="col-span-full mt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                {loading ? 'Generating...' : 'Generate Preview'}
              </button>
            </div>
          </form>
        </div>

        {reportData && (
          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl relative overflow-hidden">
             {/* decorative gradient background */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>
            
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-white">Report Preview</h3>
               <div className="flex gap-2 print:hidden">
                 <button onClick={printReport} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition">Print Full Preview</button>
                 <button onClick={exportPDF} className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-bold px-3 py-1.5 rounded-lg border border-sky-500/30 transition">Export PDF</button>
                 <button onClick={exportCSV} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition">Export CSV</button>
                 <button onClick={handleSave} className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-emerald-500/30 transition">Save to System</button>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                <p className="text-sm text-slate-400 mb-2 uppercase font-bold tracking-widest">Total Served</p>
                <p className="text-4xl text-sky-400 font-black">{reportData.metrics.totalUsersServed}</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                <p className="text-sm text-slate-400 mb-2 uppercase font-bold tracking-widest">Avg Wait Time</p>
                <p className="text-4xl text-amber-400 font-black">{reportData.metrics.averageWaitTime}<span className="text-base text-amber-500/50 font-normal ml-1">min</span></p>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                <p className="text-sm text-slate-400 mb-2 uppercase font-bold tracking-widest">Queue Perf.</p>
                <p className={`text-2xl mt-3 font-bold ${
                  reportData.metrics.queuePerformanceScore === 'Excellent' ? 'text-emerald-400' :
                  reportData.metrics.queuePerformanceScore === 'Good' ? 'text-yellow-400' : 'text-rose-400'
                }`}>
                  {reportData.metrics.queuePerformanceScore}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 h-fit shrink-0">
         <h3 className="font-bold text-white mb-4">Saved Reports</h3>
         <div className="space-y-3">
           {savedReports.length === 0 ? (
             <p className="text-sm text-slate-500">No saved reports found.</p>
           ) : (
             savedReports.map(rp => (
               <div key={rp._id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl relative group">
                 <button 
                    onClick={() => handleDelete(rp._id)} 
                    className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                    title="Delete Report"
                 >
                    ✕
                 </button>
                 <p className="text-sm text-white font-medium line-clamp-1 pr-6">{rp.reportName}</p>
                 <p className="text-xs text-slate-500 mt-1">{new Date(rp.dateRange.startDate).toLocaleDateString()} - {new Date(rp.dateRange.endDate).toLocaleDateString()}</p>
                 <div className="flex gap-2 mt-2 text-[10px] uppercase font-bold text-slate-400">
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded">Served: {rp.metrics.totalUsersServed}</span>
                 </div>
               </div>
             ))
           )}
         </div>
      </aside>
    </div>
  );
}
