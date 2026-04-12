import { useState } from 'react';

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
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h2>Branch Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
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
                    isAssigned ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleBranch(branch.id)}
                          className="mt-1 w-4 h-4 rounded border-border"
                        />
                        <div className="flex-1">
                          <h3 className="text-foreground">{branch.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{branch.location}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Default capacity: {branch.capacity} slots/hour
                          </p>
                        </div>
                      </div>
                    </div>

                    {isAssigned && (
                      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-2 text-foreground">
                            Custom Processing Time (min)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={assignment.customProcessingTime || ''}
                            onChange={(e) => updateAssignment(branch.id, 'customProcessingTime', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Use default"
                            className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-2 text-foreground">
                            Custom Capacity (slots/hour)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={assignment.customCapacity || ''}
                            onChange={(e) => updateAssignment(branch.id, 'customCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder={`Default: ${branch.capacity}`}
                            className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {localAssignments.length} {localAssignments.length === 1 ? 'branch' : 'branches'} assigned
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
