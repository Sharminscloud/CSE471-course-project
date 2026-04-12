import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ServiceList } from './components/ServiceList';
import { ServiceForm } from './components/ServiceForm';
import { BranchConfig } from './components/BranchConfig';

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

export default function App() {
  const [activeView, setActiveView] = useState('services');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showBranchConfig, setShowBranchConfig] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [configuringService, setConfiguringService] = useState<Service | null>(null);

  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Passport Renewal',
      category: 'Passport Services',
      avgProcessingTime: 45,
      fee: 7200,
      priority: 'High',
      branches: 12,
      status: 'Active',
      requiredDocuments: ['CNIC', 'Previous Passport', '2 Photos'],
      description: 'Renewal of Bangladeshi passport for citizens',
    },
    {
      id: '2',
      name: 'New NID Registration',
      category: 'NID Services',
      avgProcessingTime: 30,
      fee: 0,
      priority: 'High',
      branches: 18,
      status: 'Active',
      requiredDocuments: ['Birth Certificate', 'Form B', 'Photos'],
      description: 'First-time national identity card registration',
    },
    {
      id: '3',
      name: 'Medical Checkup (General)',
      category: 'Medical Services',
      avgProcessingTime: 60,
      fee: 1500,
      priority: 'Medium',
      branches: 8,
      status: 'Active',
      requiredDocuments: ['CNIC', 'Referral Letter'],
      description: 'General health examination and consultation',
    },
    {
      id: '4',
      name: 'Driving License Renewal',
      category: 'Licensing',
      avgProcessingTime: 25,
      fee: 2500,
      priority: 'Low',
      branches: 15,
      status: 'Active',
      requiredDocuments: ['CNIC', 'Previous License', 'Medical Certificate'],
      description: 'Renewal of existing driving license',
    },
    {
      id: '5',
      name: 'Vehicle Registration',
      category: 'Registration',
      avgProcessingTime: 40,
      fee: 5000,
      priority: 'Medium',
      branches: 10,
      status: 'Active',
      requiredDocuments: ['CNIC', 'Invoice', 'Insurance'],
      description: 'Registration of new or used vehicles',
    },
  ]);

  const availableBranches: Branch[] = [
    { id: 'b1', name: 'Main Branch - Islamabad', location: 'F-6, Islamabad', capacity: 20 },
    { id: 'b2', name: 'Karachi Central', location: 'Saddar, Karachi', capacity: 25 },
    { id: 'b3', name: 'Dhaka Office', location: 'Mirpur, Dhaka', capacity: 22 },
    { id: 'b4', name: 'Rawalpindi Branch', location: 'Saddar, Rawalpindi', capacity: 18 },
    { id: 'b5', name: 'Peshawar Branch', location: 'University Road, Peshawar', capacity: 15 },
  ];

  const [branchAssignments, setBranchAssignments] = useState<Record<string, BranchAssignment[]>>({
    '1': [
      { branchId: 'b1', branchName: 'Main Branch - Islamabad', isActive: true, customProcessingTime: 40 },
      { branchId: 'b2', branchName: 'Karachi Central', isActive: true, customCapacity: 30 },
    ],
  });

  const handleCreateService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleSaveService = (serviceData: Partial<Service>) => {
    if (editingService) {
      setServices(services.map(s =>
        s.id === editingService.id ? { ...s, ...serviceData } : s
      ));
    } else {
      const newService: Service = {
        id: Date.now().toString(),
        branches: 0,
        requiredDocuments: [],
        description: '',
        ...serviceData as Service,
      };
      setServices([...services, newService]);
    }
    setShowServiceForm(false);
    setEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleConfigureBranches = (service: Service) => {
    setConfiguringService(service);
    setShowBranchConfig(true);
  };

  const handleSaveBranchConfig = (assignments: BranchAssignment[]) => {
    if (configuringService) {
      setBranchAssignments({
        ...branchAssignments,
        [configuringService.id]: assignments,
      });
      setServices(services.map(s =>
        s.id === configuringService.id ? { ...s, branches: assignments.length } : s
      ));
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-background px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1>Service Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage public service offerings
              </p>
            </div>
            <button
              onClick={handleCreateService}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              + New Service
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-lg p-5">
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-3xl mt-2">{services.length}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-5">
              <p className="text-sm text-muted-foreground">Active Services</p>
              <p className="text-3xl mt-2">{services.filter(s => s.status === 'Active').length}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-5">
              <p className="text-sm text-muted-foreground">Total Branches</p>
              <p className="text-3xl mt-2">{availableBranches.length}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-5">
              <p className="text-sm text-muted-foreground">Avg. Processing Time</p>
              <p className="text-3xl mt-2">
                {Math.round(services.reduce((sum, s) => sum + s.avgProcessingTime, 0) / services.length)} min
              </p>
            </div>
          </div>

          <div className="bg-background rounded-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3>All Services</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage service details, fees, and branch assignments
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="search"
                  placeholder="Search services..."
                  className="px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-64"
                />
              </div>
            </div>

            <ServiceList
              services={services}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
            />

            <div className="mt-6 space-y-4">
              <h3>Branch Assignments</h3>
              <div className="grid gap-3">
                {services.slice(0, 3).map((service) => (
                  <div key={service.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-foreground">{service.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Assigned to {service.branches} {service.branches === 1 ? 'branch' : 'branches'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfigureBranches(service)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Configure Branches
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showServiceForm && (
        <ServiceForm
          service={editingService}
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
          assignments={branchAssignments[configuringService.id] || []}
          onSave={handleSaveBranchConfig}
          onClose={() => {
            setShowBranchConfig(false);
            setConfiguringService(null);
          }}
        />
      )}
    </div>
  );
}
