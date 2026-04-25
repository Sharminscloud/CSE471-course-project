const BranchSelector = ({ selectedBranch, onClear }) => {
  if (!selectedBranch) return null;

  return (
    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-sky-300">Selected Branch</p>
          <p className="mt-1 text-lg font-semibold text-white">{selectedBranch.name}</p>
          <p className="text-sm text-slate-400">{selectedBranch.address}</p>
        </div>
        <button
          onClick={onClear}
          className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
        >
          Change
        </button>
      </div>
    </div>
  );
};

export default BranchSelector;
