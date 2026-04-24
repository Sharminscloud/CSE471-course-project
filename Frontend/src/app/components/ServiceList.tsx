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
        return 'text-destructive';
      case 'Medium':
        return 'text-chart-4';
      case 'Low':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Service Name</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Category</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Avg. Time</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Fee</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Priority</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Branches</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Status</th>
              <th className="text-right px-6 py-3 text-sm text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-foreground">{service.name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-sm">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground">{service.avgProcessingTime} min</td>
                <td className="px-6 py-4 text-foreground">
                  {service.fee === 0 ? 'Free' : `Rs. ${service.fee.toLocaleString()}`}
                </td>
                <td className="px-6 py-4">
                  <span className={getPriorityColor(service.priority)}>{service.priority}</span>
                </td>
                <td className="px-6 py-4 text-foreground">{service.branches}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                      service.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {service.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(service)}
                      className="px-3 py-1.5 text-sm text-primary hover:bg-muted rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(service.id)}
                      className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
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
