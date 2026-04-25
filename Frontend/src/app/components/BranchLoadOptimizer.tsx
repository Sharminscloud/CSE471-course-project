import { useMemo, useState } from "react";

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

interface ServiceOption {
  _id: string;
  name: string;
  avgProcessingTime: number;
}

interface QueueToken {
  _id: string;
  serviceId: string | { _id: string };
  branchId: string | { _id: string };
  status: "Waiting" | "Serving" | "Completed" | "Skipped" | "Cancelled";
}

interface BranchLoadOptimizerProps {
  services: ServiceOption[];
  branches: Branch[];
  branchAssignments: Record<string, BranchAssignment[]>;
  queueTokens: QueueToken[];
  onClose: () => void;
}

type BranchLoadResult = {
  branchId: string;
  branchName: string;
  location: string;
  waitingDemand: number;
  servingDemand: number;
  totalDemand: number;
  capacityPerHour: number;
  expectedWaitMinutes: number;
  loadRatio: number;
};

export function BranchLoadOptimizer({
  services,
  branches,
  branchAssignments,
  queueTokens,
  onClose,
}: BranchLoadOptimizerProps) {
  const activeServices = services.filter((service) => service._id && service.name);
  const [selectedId, setSelectedId] = useState(activeServices[0]?._id ?? "");

  const selectedService = activeServices.find((service) => service._id === selectedId);
  const selectedAssignments = selectedService ? branchAssignments[selectedService._id] || [] : [];

  const getBranchId = (branchRef: QueueToken["branchId"]) =>
    typeof branchRef === "object" ? branchRef._id : branchRef;
  const getServiceId = (serviceRef: QueueToken["serviceId"]) =>
    typeof serviceRef === "object" ? serviceRef._id : serviceRef;

  const branchRows: BranchLoadResult[] = useMemo(
    () =>
      selectedAssignments
        .map((assignment) => {
          const branch = branches.find((b) => b.id === assignment.branchId);
          if (!branch || !selectedService) return null;

          const branchQueue = queueTokens.filter(
            (token) =>
              getServiceId(token.serviceId) === selectedService._id &&
              getBranchId(token.branchId) === branch.id &&
              (token.status === "Waiting" || token.status === "Serving")
          );

          const waitingDemand = branchQueue.filter((token) => token.status === "Waiting").length;
          const servingDemand = branchQueue.filter((token) => token.status === "Serving").length;
          const totalDemand = waitingDemand + servingDemand;

          const capacityPerHour = assignment.customCapacity || branch.capacity || 1;
          const avgProcessingTime = assignment.customProcessingTime || selectedService.avgProcessingTime || 1;
          const expectedWaitMinutes = waitingDemand * avgProcessingTime;
          const loadRatio = totalDemand / Math.max(capacityPerHour, 1);

          return {
            branchId: branch.id,
            branchName: branch.name,
            location: branch.location,
            waitingDemand,
            servingDemand,
            totalDemand,
            capacityPerHour,
            expectedWaitMinutes,
            loadRatio,
          };
        })
        .filter((item): item is BranchLoadResult => item !== null)
        .sort((a, b) => a.loadRatio - b.loadRatio || a.expectedWaitMinutes - b.expectedWaitMinutes),
    [branches, queueTokens, selectedAssignments, selectedService]
  );

  const recommendation = branchRows[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-xl border border-blue-900 bg-slate-950 text-white shadow-2xl">
        <div className="px-6 py-4 border-b border-blue-900 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-blue-300">Branch Load Comparison & Optimization</h2>
            <p className="mt-1 text-sm text-blue-100/80">
              Compare service demand across branches and suggest the least crowded branch to reduce waiting time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-blue-700 text-blue-100 hover:bg-blue-900/30 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-84px)]">
          <div className="flex items-center gap-3">
            <label htmlFor="serviceFilter" className="text-sm text-blue-200 whitespace-nowrap">
              Select Service:
            </label>
            <select
              id="serviceFilter"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full max-w-sm px-3 py-2 rounded-lg bg-slate-900 border border-blue-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {activeServices.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedAssignments.length === 0 ? (
            <div className="rounded-lg border border-blue-900 bg-slate-900 p-6 text-blue-100/80">
              This service has no branch assignments yet. Configure branches first to run load optimization.
            </div>
          ) : (
            <>
              {recommendation && (
                <div className="rounded-lg border border-blue-700 bg-gradient-to-r from-blue-950 to-slate-900 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-300">Recommended Branch</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{recommendation.branchName}</h3>
                  <p className="mt-1 text-sm text-blue-100/90">
                    Least crowded now with load ratio{" "}
                    <span className="font-semibold text-blue-300">{recommendation.loadRatio.toFixed(2)}</span> and
                    estimated wait time{" "}
                    <span className="font-semibold text-blue-300">{recommendation.expectedWaitMinutes} min</span>.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-blue-900 overflow-hidden">
                <div className="grid grid-cols-8 gap-2 px-4 py-3 bg-slate-900 border-b border-blue-900 text-xs text-blue-200 uppercase tracking-wide">
                  <span>Branch</span>
                  <span>Location</span>
                  <span>Waiting</span>
                  <span>Serving</span>
                  <span>Total Demand</span>
                  <span>Capacity/Hr</span>
                  <span>Expected Wait</span>
                  <span>Load Ratio</span>
                </div>
                <div className="divide-y divide-blue-950">
                  {branchRows.map((row) => (
                    <div
                      key={row.branchId}
                      className={`grid grid-cols-8 gap-2 px-4 py-3 text-sm ${
                        recommendation?.branchId === row.branchId ? "bg-blue-950/40" : "bg-slate-950"
                      }`}
                    >
                      <span className="font-medium text-blue-100">{row.branchName}</span>
                      <span className="text-blue-100/80 truncate">{row.location}</span>
                      <span>{row.waitingDemand}</span>
                      <span>{row.servingDemand}</span>
                      <span>{row.totalDemand}</span>
                      <span>{row.capacityPerHour}</span>
                      <span>{row.expectedWaitMinutes} min</span>
                      <span className="font-semibold text-blue-300">{row.loadRatio.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
