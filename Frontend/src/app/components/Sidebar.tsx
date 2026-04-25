interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onBranchClick: () => void;
}

export function Sidebar({ activeView, onViewChange, onBranchClick }: SidebarProps) {
  const menuItems = [
    { id: 'services', label: 'Services' },
    { id: 'branches', label: 'Branch' },
    { id: 'analytics', label: 'Analytics'},
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-blue-900 flex flex-col h-full">
      <div className="p-6 border-b border-blue-900">
        <h1 className="text-blue-200">Queue Management</h1>
        <p className="text-sm text-blue-100/70 mt-1">Admin Portal</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (item.id === 'branches') {
                    onBranchClick();
                    return;
                  }
                  onViewChange(item.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-sky-500 text-white ring-1 ring-sky-300'
                    : 'bg-sky-500 text-white hover:bg-sky-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-blue-900">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-100 truncate">Admin User</p>
            <p className="text-xs text-blue-100/70">admin@gov.pk</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
