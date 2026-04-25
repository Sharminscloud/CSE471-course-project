import { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function QueueStatus() {
  const [branches, setBranches] = useState([]);
  const [queueData, setQueueData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/branches`);
        const data = await res.json();
        setBranches(data);
      } catch (error) {
        console.error('Failed to fetch branches', error);
      }
    };
    fetchBranches();
  }, []);

  const fetchQueueData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const promises = branches.map(async (branch) => {
        const res = await fetch(`${API_BASE}/api/branches/${branch._id}/queue-load?date=${today}`);
        const data = await res.json();
        
        // Also fetch active token separately contextually if needed, but for now we can fetch all appointments for today to find the active tokens
        const apptRes = await fetch(`${API_BASE}/api/appointments`);
        const apptData = await apptRes.json();
        
        const branchAppts = apptData.filter(
          (a) => a.branch && a.branch._id === branch._id && a.date.startsWith(today)
        );

        const inProgress = branchAppts.filter((a) => a.status === 'In-Progress');
        const activeTokens = inProgress.map((a) => a.tokenNumber).join(', ');
        const inQueue = branchAppts.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled').length;
        
        return {
          branchId: branch._id,
          queueLength: inQueue,
          estimatedWaitTime: inQueue * 10,
          activeToken: activeTokens || 'None',
        };
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach((r) => {
        dataMap[r.branchId] = r;
      });
      setQueueData(dataMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branches.length > 0) {
      fetchQueueData();
    }
  }, [branches]);

  useEffect(() => {
    // connect to socket layer
    const socket = io(API_BASE);

    socket.on('connect', () => {
      console.log('Connected to WebSocket for real-time queue updates');
    });

    socket.on('queueUpdated', (data) => {
      // Re-fetch queue data safely
      if (branches.length > 0) {
         fetchQueueData();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [branches]);

  if (loading) {
    return <div className="text-center text-slate-400 mt-10 text-lg">Loading real-time queue status...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 rounded-3xl border border-sky-500/30 bg-sky-900/20 p-8 shadow-xl shadow-sky-900/10">
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
          </span>
          Live Queue Status
        </h1>
        <p className="mt-2 text-slate-300">
          Check real-time queue conditions before visiting. Avoid long wait times by tracking token progress remotely.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const stats = queueData[branch._id] || { queueLength: 0, estimatedWaitTime: 0, activeToken: 'None' };
          return (
            <div key={branch._id} className="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/80 p-6 flex flex-col transition hover:border-sky-500/50">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{branch.name}</h3>
                <p className="text-sm text-slate-400">{branch.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-grow">
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Active Token</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">{stats.activeToken}</p>
                </div>
                
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">In Queue</p>
                  <p className="mt-1 text-2xl font-bold text-sky-400">{stats.queueLength}</p>
                </div>
              </div>
              
              <div className="mt-4 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 flex justify-between items-center">
                <p className="text-sm font-semibold text-amber-500 uppercase tracking-wider">Est. Wait Time</p>
                <p className="text-lg font-bold text-amber-400">{stats.estimatedWaitTime} min</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
