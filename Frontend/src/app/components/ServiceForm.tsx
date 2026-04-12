import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  category: string;
  avgProcessingTime: number;
  fee: number;
  priority: 'High' | 'Medium' | 'Low';
  branches: number;
  status: 'Active' | 'Inactive';
  requiredDocuments: string[];
  description: string;
}

interface ServiceFormProps {
  service?: Service | null;
  onSave: (service: Partial<Service>) => void;
  onCancel: () => void;
}

export function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    avgProcessingTime: 30,
    fee: 0,
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    status: 'Active' as 'Active' | 'Inactive',
    requiredDocuments: '',
    description: '',
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        category: service.category,
        avgProcessingTime: service.avgProcessingTime,
        fee: service.fee,
        priority: service.priority,
        status: service.status,
        requiredDocuments: service.requiredDocuments?.join(', ') || '',
        description: service.description || '',
      });
    }
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      requiredDocuments: formData.requiredDocuments.split(',').map(doc => doc.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h2>{service ? 'Edit Service' : 'Create New Service'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {service ? 'Update service details and configuration' : 'Add a new service to the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-foreground">Service Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Passport Renewal"
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block mb-2 text-foreground">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  <option value="Passport Services">Passport Services</option>
                  <option value="NID Services">NID Services</option>
                  <option value="Medical Services">Medical Services</option>
                  <option value="Licensing">Licensing</option>
                  <option value="Registration">Registration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the service"
                rows={3}
                className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 text-foreground">Avg. Processing Time (min)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.avgProcessingTime}
                  onChange={(e) => setFormData({ ...formData, avgProcessingTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block mb-2 text-foreground">Service Fee (Rs.)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block mb-2 text-foreground">Priority Level</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                  className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Required Documents</label>
              <input
                type="text"
                value={formData.requiredDocuments}
                onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                placeholder="e.g., CNIC, Previous Passport, Photos (comma separated)"
                className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-sm text-muted-foreground mt-1.5">Separate multiple documents with commas</p>
            </div>

            <div>
              <label className="block mb-2 text-foreground">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={formData.status === 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-4 h-4"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={formData.status === 'Inactive'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-4 h-4"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {service ? 'Update Service' : 'Create Service'}
          </button>
        </div>
      </div>
    </div>
  );
}
