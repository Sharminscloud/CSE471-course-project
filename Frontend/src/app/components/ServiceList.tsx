interface Service {
  id: string;
  name: string;
  category: string;
  avgProcessingTime: number;
  fee: number;
  priority: 'High' | 'Medium' | 'Low';
  branches: number;
  status: 'Active' | 'Inactive';
}

interface ServiceListProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-rose-400';
      case 'Medium':
        return 'text-amber-300';
      case 'Low':
        return 'text-blue-200/80';
      default:
        return 'text-blue-100';
    }
  };

  return (
    <div className="border border-blue-900 rounded-lg overflow-hidden bg-slate-950">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900 border-b border-blue-900">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Service Name</th>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Category</th>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Avg. Time</th>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Fee</th>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Priority</th>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Branches</th>
              <th className="text-left px-6 py-3 text-sm text-blue-200">Status</th>
              <th className="text-right px-6 py-3 text-sm text-blue-200">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-950">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-900 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-blue-100">{service.name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-900/50 text-blue-100 text-sm">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-blue-100">{service.avgProcessingTime} min</td>
                <td className="px-6 py-4 text-blue-100">
                  {service.fee === 0 ? 'Free' : `Rs. ${service.fee.toLocaleString()}`}
                </td>
                <td className="px-6 py-4">
                  <span className={getPriorityColor(service.priority)}>{service.priority}</span>
                </td>
                <td className="px-6 py-4 text-blue-100">{service.branches}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                      service.status === 'Active'
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {service.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(service)}
                      className="px-3 py-1.5 text-sm text-sky-300 hover:bg-blue-950 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(service.id)}
                      className="px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
