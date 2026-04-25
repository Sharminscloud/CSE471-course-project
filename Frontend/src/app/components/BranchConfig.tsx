import { useEffect, useState } from 'react';

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

interface BranchConfigProps {
  serviceName: string;
  availableBranches: Branch[];
  assignments: BranchAssignment[];
  onSave: (assignments: BranchAssignment[]) => void;
  onClose: () => void;
}

export function BranchConfig({ serviceName, availableBranches, assignments, onSave, onClose }: BranchConfigProps) {
  const [localAssignments, setLocalAssignments] = useState<BranchAssignment[]>(assignments);

  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  const toggleBranch = (branchId: string) => {
    const existing = localAssignments.find(a => a.branchId === branchId);

    if (existing) {
      setLocalAssignments(localAssignments.filter(a => a.branchId !== branchId));
    } else {
      const branch = availableBranches.find(b => b.id === branchId);
      if (branch) {
        setLocalAssignments([
          ...localAssignments,
          {
            branchId: branch.id,
            branchName: branch.name,
            isActive: true,
          }
        ]);
      }
    }
  };

  const updateAssignment = (branchId: string, field: string, value: any) => {
    setLocalAssignments(localAssignments.map(a =>
      a.branchId === branchId ? { ...a, [field]: value } : a
    ));
  };

  const handleSave = () => {
    onSave(localAssignments);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-blue-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col text-white">
        <div className="px-6 py-4 border-b border-blue-900">
          <h2 className="text-blue-200">Branch Configuration</h2>
          <p className="text-sm text-blue-100/80 mt-1">
            Assign {serviceName} to branches and customize settings
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {availableBranches.map((branch) => {
              const assignment = localAssignments.find(a => a.branchId === branch.id);
              const isAssigned = !!assignment;

              return (
                <div
                  key={branch.id}
                  className={`border rounded-lg transition-all ${
                    isAssigned ? 'border-sky-500 bg-blue-950/30' : 'border-blue-900 bg-slate-900'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleBranch(branch.id)}
                          className="mt-1 w-4 h-4 rounded border-blue-700 accent-sky-500"
                        />
                        <div className="flex-1">
                          <h3 className="text-white">{branch.name}</h3>
                          <p className="text-sm text-blue-100/80 mt-0.5">{branch.location}</p>
                          <p className="text-sm text-blue-100/80 mt-1">
                            Default capacity: {branch.capacity} slots/hour
                          </p>
                        </div>
                      </div>
                    </div>

                    {isAssigned && (
                      <div className="mt-4 pt-4 border-t border-blue-900 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-2 text-white">
                            Custom Processing Time (min)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={assignment.customProcessingTime || ''}
                            onChange={(e) => updateAssignment(branch.id, 'customProcessingTime', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Use default"
                            className="w-full px-3 py-2 bg-slate-950 border border-blue-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-white placeholder:text-blue-100/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-2 text-white">
                            Custom Capacity (slots/hour)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={assignment.customCapacity || ''}
                            onChange={(e) => updateAssignment(branch.id, 'customCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder={`Default: ${branch.capacity}`}
                            className="w-full px-3 py-2 bg-slate-950 border border-blue-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-white placeholder:text-blue-100/50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-blue-900 flex items-center justify-between">
          <p className="text-sm text-blue-100/80">
            {localAssignments.length} {localAssignments.length === 1 ? 'branch' : 'branches'} assigned
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-white hover:bg-blue-950 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-400 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
