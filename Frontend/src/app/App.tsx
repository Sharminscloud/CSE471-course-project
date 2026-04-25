import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ServiceList } from './components/ServiceList';
import { ServiceForm } from './components/ServiceForm';
import { BranchConfig } from './components/BranchConfig';
import { BranchLoadOptimizer } from './components/BranchLoadOptimizer';
import { HistoricalQueueAnalytics } from './components/HistoricalQueueAnalytics';
import Pusher from 'pusher-js';
import {
  serviceAPI,
  queueAPI,
  type Service,
  type Branch as ApiBranch,
  type QueueToken,
} from './services/api';

// ─── Local-only types (branches are not yet stored in DB) ────────────────────

interface Branch {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface BranchAssignment {
  branchId: string;
  branchName: string;
  customProcessingTime?: number;
  customCapacity?: number;
  isActive: boolean;
}

// Frontend view type that adds `branches` count for display
type ServiceView = Service & { branches: number };

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView] = useState('services');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showBranchConfig, setShowBranchConfig] = useState(false);
  const [showBranchOptimizer, setShowBranchOptimizer] = useState(false);
  const [editingService, setEditingService] = useState<ServiceView | null>(null);
  const [configuringService, setConfiguringService] = useState<ServiceView | null>(null);

  const [services, setServices] = useState<ServiceView[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [branchAssignments, setBranchAssignments] = useState<Record<string, BranchAssignment[]>>({});
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [creatingToken, setCreatingToken] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>(
    'disconnected'
  );
  const [tokenForm, setTokenForm] = useState({
    serviceId: '',
    branchId: '',
    citizenName: '',
    priority: 'Normal' as 'Normal' | 'Priority',
  });

  // ── Fetch services, branches, and service-branch links from DB ───────────
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, branchesData] = await Promise.all([
        serviceAPI.getAll(),
        serviceAPI.getBranches(),
      ]);

      const mappedBranches: Branch[] = branchesData.map((b: ApiBranch) => ({
        id: b._id,
        name: b.name || 'Unnamed Branch',
        location: b.location || 'N/A',
        capacity: b.capacity ?? b.capacityPerDay ?? 0,
      }));
      setAvailableBranches(mappedBranches);

      const assignmentsEntries = await Promise.all(
        servicesData.map(async (service) => {
          const links = await serviceAPI.getServiceBranches(service._id);
          const mappedAssignments: BranchAssignment[] = links.map((link: any) => {
            const populatedBranch = typeof link.branchId === 'object' ? link.branchId : null;
            return {
              branchId: populatedBranch?._id || String(link.branchId),
              branchName: populatedBranch?.name || 'Unknown Branch',
              customProcessingTime: link.customProcessingTime,
              customCapacity: link.capacityPerDay,
              isActive: true,
            };
          });
          return [service._id, mappedAssignments] as const;
        })
      );

      const assignmentMap = Object.fromEntries(assignmentsEntries);
      setBranchAssignments(assignmentMap);
      setServices(
        servicesData.map((s) => ({
          ...s,
          branches: assignmentMap[s._id]?.length || 0,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchQueueTokens = useCallback(async () => {
    try {
      const data = await queueAPI.getTokens();
      setQueueTokens(data);
    } catch (err) {
      console.warn('Failed to fetch queue tokens', err);
    }
  }, []);

  useEffect(() => {
    fetchQueueTokens();
  }, [fetchQueueTokens]);

  useEffect(() => {
    const key = (import.meta as any).env.VITE_PUSHER_KEY;
    const cluster = (import.meta as any).env.VITE_PUSHER_CLUSTER;
    if (!key || !cluster) {
      setRealtimeStatus('disconnected');
      return;
    }

    setRealtimeStatus('connecting');
    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe('queue-updates');
    const connection = pusher.connection;

    const refreshQueue = () => {
      fetchQueueTokens();
    };

    connection.bind('connected', () => setRealtimeStatus('connected'));
    connection.bind('connecting', () => setRealtimeStatus('connecting'));
    connection.bind('disconnected', () => setRealtimeStatus('disconnected'));
    connection.bind('unavailable', () => setRealtimeStatus('disconnected'));
    connection.bind('failed', () => setRealtimeStatus('disconnected'));

    channel.bind('token-created', refreshQueue);
    channel.bind('token-status-updated', refreshQueue);

    return () => {
      channel.unbind('token-created', refreshQueue);
      channel.unbind('token-status-updated', refreshQueue);
      connection.unbind('connected');
      connection.unbind('connecting');
      connection.unbind('disconnected');
      connection.unbind('unavailable');
      connection.unbind('failed');
      pusher.unsubscribe('queue-updates');
      pusher.disconnect();
      setRealtimeStatus('disconnected');
    };
  }, [fetchQueueTokens]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleCreateService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service: ServiceView) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleSaveService = async (serviceData: Partial<ServiceView>) => {
    try {
      const payload = {
        name: serviceData.name!,
        category: serviceData.category || '',
        avgProcessingTime: serviceData.avgProcessingTime!,
        fee: serviceData.fee ?? 0,
        priority: serviceData.priority as 'High' | 'Medium' | 'Low',
        status: serviceData.status as 'Active' | 'Inactive',
        requiredDocuments: serviceData.requiredDocuments || [],
        description: serviceData.description || '',
      };

      if (editingService) {
        // UPDATE
        const updated = await serviceAPI.update(editingService._id, payload);
        setServices(prev =>
          prev.map(s =>
            s._id === editingService._id
              ? { ...updated, branches: s.branches }
              : s
          )
        );
      } else {
        // CREATE
        const created = await serviceAPI.create(payload);
        setServices(prev => [...prev, { ...created, branches: 0 }]);
      }

      setShowServiceForm(false);
      setEditingService(null);
    } catch (err: any) {
      alert(`Failed to save service: ${err.message}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await serviceAPI.delete(id);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch (err: any) {
      alert(`Failed to delete service: ${err.message}`);
    }
  };

  const handleConfigureBranches = (service: ServiceView) => {
    setConfiguringService(service);
    setShowBranchConfig(true);
  };

  const handleSaveBranchConfig = async (assignments: BranchAssignment[]) => {
    try {
      if (!configuringService) return;

      const payload = assignments.map((a) => ({
        branchId: a.branchId,
        customProcessingTime: a.customProcessingTime,
        capacityPerDay: a.customCapacity,
      }));

      const synced = await serviceAPI.syncServiceBranches(configuringService._id, payload);

      const normalizedAssignments: BranchAssignment[] = (synced || []).map((link: any) => {
        const populatedBranch = typeof link.branchId === 'object' ? link.branchId : null;
        return {
          branchId: populatedBranch?._id || String(link.branchId),
          branchName: populatedBranch?.name || 'Unknown Branch',
          customProcessingTime: link.customProcessingTime,
          customCapacity: link.capacityPerDay,
          isActive: true,
        };
      });

      setBranchAssignments((prev) => ({
        ...prev,
        [configuringService._id]: normalizedAssignments,
      }));

      setServices((prev) =>
        prev.map((s) =>
          s._id === configuringService._id ? { ...s, branches: normalizedAssignments.length } : s
        )
      );
    } catch (err: any) {
      alert(`Failed to save branch assignments: ${err.message}`);
    }
  };

  const handleCreateQueueToken = async () => {
    if (!tokenForm.serviceId || !tokenForm.branchId) {
      alert('Please select both service and branch');
      return;
    }

    try {
      setCreatingToken(true);
      await queueAPI.createToken({
        serviceId: tokenForm.serviceId,
        branchId: tokenForm.branchId,
        citizenName: tokenForm.citizenName || undefined,
        priority: tokenForm.priority,
      });

      setTokenForm((prev) => ({
        ...prev,
        citizenName: '',
      }));
      await fetchQueueTokens();
    } catch (err: any) {
      alert(`Failed to create token: ${err.message}`);
    } finally {
      setCreatingToken(false);
    }
  };

  const handleQueueStatusChange = async (tokenId: string, status: QueueToken['status']) => {
    try {
      await queueAPI.updateTokenStatus(tokenId, status);
      await fetchQueueTokens();
    } catch (err: any) {
      alert(`Failed to update token status: ${err.message}`);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const avgTime =
    services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + s.avgProcessingTime, 0) / services.length)
      : 0;

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onBranchClick={() => setShowBranchOptimizer(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'analytics' ? (
          <HistoricalQueueAnalytics services={services} queueTokens={queueTokens} />
        ) : (
          <>
            <header className="border-b border-blue-900 bg-slate-950 px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1>Service Management</h1>
                  <p className="text-sm text-blue-100/80 mt-1">
                    Create and manage public service offerings
                  </p>
                </div>
                <button
                  onClick={handleCreateService}
                  className="px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition-colors"
                >
                  + New Service
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Stats */}
              <div className="mb-6 grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-blue-900 rounded-lg p-5">
                  <p className="text-sm text-blue-200">Total Services</p>
                  <p className="text-3xl mt-2">{services.length}</p>
                </div>
                <div className="bg-slate-900 border border-blue-900 rounded-lg p-5">
                  <p className="text-sm text-blue-200">Active Services</p>
                  <p className="text-3xl mt-2">{services.filter(s => s.status === 'Active').length}</p>
                </div>
                <div className="bg-slate-900 border border-blue-900 rounded-lg p-5">
                  <p className="text-sm text-blue-200">Total Branches</p>
                  <p className="text-3xl mt-2">{availableBranches.length}</p>
                </div>
                <div className="bg-slate-900 border border-blue-900 rounded-lg p-5">
                  <p className="text-sm text-blue-200">Avg. Processing Time</p>
                  <p className="text-3xl mt-2">{avgTime} min</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3>All Services</h3>
                    <p className="text-sm text-blue-100/80 mt-1">
                      Manage service details, fees, and branch assignments
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="search"
                      placeholder="Search services..."
                      className="px-4 py-2 bg-slate-900 border border-blue-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 w-64 text-blue-100"
                    />
                  </div>
                </div>

                {/* Loading / Error / List */}
                {loading ? (
                  <p className="text-blue-100/80 py-8 text-center">Loading services from database…</p>
                ) : error ? (
                  <div className="py-8 text-center">
                    <p className="text-red-500 mb-3">{error}</p>
                    <button
                      onClick={fetchServices}
                      className="px-4 py-2 border border-blue-900 rounded-lg hover:bg-blue-950 transition-colors text-sm text-blue-100"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <ServiceList
                    services={services.map(s => ({ ...s, id: s._id }))}
                    onEdit={(s: any) => handleEditService({ ...s, _id: s.id ?? s._id })}
                    onDelete={(id: string) => handleDeleteService(id)}
                  />
                )}

                {/* Branch Assignments */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-white">Branch Assignments</h3>
                  {services.length === 0 ? (
                    <p className="text-sm text-blue-100/80">
                      No services yet. Create a service to assign it to branches.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Array.from(new Set(services.map((s) => s.category || 'Uncategorized'))).map((category) => {
                        const servicesInCategory = services.filter(
                          (s) => (s.category || 'Uncategorized') === category
                        );

                        return (
                          <div key={category} className="border border-blue-900 rounded-lg overflow-hidden bg-slate-950">
                            <div className="px-4 py-3 bg-slate-900 border-b border-blue-900">
                              <h4 className="text-white">{category}</h4>
                              <p className="text-sm text-blue-100/80 mt-0.5">
                                {servicesInCategory.length} {servicesInCategory.length === 1 ? 'service' : 'services'}
                              </p>
                            </div>

                            <div className="divide-y divide-border">
                              {servicesInCategory.map((service) => {
                                const assigned = branchAssignments[service._id] || [];
                                return (
                                  <div
                                    key={service._id}
                                    className="p-4 flex items-start justify-between gap-4"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-blue-100 font-medium truncate">{service.name}</p>
                                      <p className="text-sm text-blue-100/80 mt-1">
                                        Assigned to {assigned.length} {assigned.length === 1 ? 'branch' : 'branches'}
                                        {assigned.length > 0 ? ` • ${assigned.map((a) => a.branchName).join(', ')}` : ''}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => handleConfigureBranches(service)}
                                      className="shrink-0 px-4 py-2 border border-blue-900 rounded-lg hover:bg-blue-950 transition-colors text-blue-100"
                                    >
                                      Configure Branches
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Real-time Queue Updates */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3>Real-Time Queue Updates</h3>
                    <span
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border ${
                        realtimeStatus === 'connected'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : realtimeStatus === 'connecting'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          realtimeStatus === 'connected'
                            ? 'bg-green-500'
                            : realtimeStatus === 'connecting'
                            ? 'bg-amber-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      Realtime {realtimeStatus}
                    </span>
                  </div>

                  <div className="border border-blue-900 rounded-lg p-4 bg-slate-900">
                    <p className="text-sm text-blue-100/80 mb-3">
                      Create token and watch live status/position updates through Pusher.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select
                        value={tokenForm.serviceId}
                        onChange={(e) => setTokenForm((prev) => ({ ...prev, serviceId: e.target.value }))}
                        className="px-3 py-2 bg-slate-950 border border-blue-900 rounded-lg text-blue-100"
                      >
                        <option value="">Select service</option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={tokenForm.branchId}
                        onChange={(e) => setTokenForm((prev) => ({ ...prev, branchId: e.target.value }))}
                        className="px-3 py-2 bg-slate-950 border border-blue-900 rounded-lg text-blue-100"
                      >
                        <option value="">Select branch</option>
                        {availableBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={tokenForm.citizenName}
                        onChange={(e) => setTokenForm((prev) => ({ ...prev, citizenName: e.target.value }))}
                        placeholder="Citizen name (optional)"
                        className="px-3 py-2 bg-slate-950 border border-blue-900 rounded-lg text-blue-100"
                      />

                      <button
                        disabled={creatingToken}
                        onClick={handleCreateQueueToken}
                        className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-400 disabled:opacity-60"
                      >
                        {creatingToken ? 'Creating...' : 'Create Token'}
                      </button>
                    </div>
                  </div>

                  <div className="border border-blue-900 rounded-lg overflow-hidden bg-slate-950">
                    <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-slate-900 border-b border-blue-900 text-sm text-blue-200">
                      <span>Token</span>
                      <span>Service</span>
                      <span>Branch</span>
                      <span>Status</span>
                      <span>Waiting Position</span>
                      <span className="text-right">Action</span>
                    </div>
                    {queueTokens.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-blue-100/80">No queue tokens yet.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {queueTokens.map((token) => {
                          const serviceName =
                            typeof token.serviceId === 'object' ? token.serviceId.name : token.serviceId;
                          const branchName =
                            typeof token.branchId === 'object' ? token.branchId.name : token.branchId;

                          return (
                            <div key={token._id} className="grid grid-cols-6 gap-2 px-4 py-3 items-center">
                              <span>{token.tokenNumber}</span>
                              <span className="truncate">{serviceName}</span>
                              <span className="truncate">{branchName}</span>
                              <span>{token.status}</span>
                              <span>{token.waitingPosition ?? '-'}</span>
                              <div className="text-right">
                                <select
                                  value={token.status}
                                  onChange={(e) =>
                                    handleQueueStatusChange(token._id, e.target.value as QueueToken['status'])
                                  }
                                  className="px-2 py-1 bg-slate-900 border border-blue-900 rounded-md text-sm text-blue-100"
                                >
                                  <option value="Waiting">Waiting</option>
                                  <option value="Serving">Serving</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Skipped">Skipped</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showServiceForm && (
        <ServiceForm
          service={editingService ? { ...editingService, id: editingService._id } : null}
          onSave={handleSaveService}
          onCancel={() => {
            setShowServiceForm(false);
            setEditingService(null);
          }}
        />
      )}

      {showBranchConfig && configuringService && (
        <BranchConfig
          serviceName={configuringService.name}
          availableBranches={availableBranches}
          assignments={branchAssignments[configuringService._id] || []}
          onSave={handleSaveBranchConfig}
          onClose={() => {
            setShowBranchConfig(false);
            setConfiguringService(null);
          }}
        />
      )}

      {showBranchOptimizer && (
        <BranchLoadOptimizer
          services={services}
          branches={availableBranches}
          branchAssignments={branchAssignments}
          queueTokens={queueTokens}
          onClose={() => setShowBranchOptimizer(false)}
        />
      )}
    </div>
  );
}
