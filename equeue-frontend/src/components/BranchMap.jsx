import { GoogleMap, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { calculateDistance } from '../utils/distance';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const LIBRARIES = ['marker'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 23.8103,
  lng: 90.4125,
};

const CROWD_COLORS = {
  Low: '#22c55e',    
  Medium: '#eab308', 
  High: '#ef4444',   
};

const BranchMap = ({ onBranchSelect, selectedService }) => {
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [branches, setBranches] = useState([]);
  const [queueData, setQueueData] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapError, setMapError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef([]);

  // Fetch branches once or when service changes
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const url = selectedService
          ? `${API_BASE}/api/branches?serviceType=${encodeURIComponent(selectedService)}`
          : `${API_BASE}/api/branches`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch branches');

        const data = await response.json();
        setBranches(data);

        if (data.length > 0) {
          setMapCenter({ lat: data[0].latitude, lng: data[0].longitude });
        }
      } catch (error) {
        console.error('Branch fetch error:', error);
        setMapError('Unable to load branches');
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [selectedService]);

  // Fetch queue data with polling
  const fetchQueueLoad = useCallback(async () => {
    if (branches.length === 0) return;
    
    const queuePromises = branches.map(async (branch) => {
      try {
        const response = await fetch(`${API_BASE}/api/branches/${branch._id}/queue-load`);
        if (!response.ok) throw new Error('Failed to fetch queue load');
        const data = await response.json();
        return { branchId: branch._id, data };
      } catch (error) {
        console.error(`Queue load error for branch ${branch._id}:`, error);
        return { branchId: branch._id, data: { overallCrowdLevel: 'Low', totalQueueLength: 0, estimatedWaitTime: 0 } };
      }
    });

    const results = await Promise.all(queuePromises);
    const queueMap = {};
    results.forEach(({ branchId, data }) => {
      queueMap[branchId] = data;
    });
    setQueueData(queueMap);
  }, [branches]);

  // Initial fetch and polling set up
  useEffect(() => {
    fetchQueueLoad();
    const interval = setInterval(fetchQueueLoad, 30000); // 30 seconds polling
    return () => clearInterval(interval);
  }, [fetchQueueLoad]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          console.info('Geolocation access denied.');
        } else {
          console.warn('Geolocation unavailable:', error.message);
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Sort branches by distance
  const sortedBranches = useMemo(() => {
    if (!userLocation) return branches;
    return [...branches].sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [branches, userLocation]);

  // Map markers
  useEffect(() => {
    if (!mapInstance || branches.length === 0) return;
    if (!window.google?.maps?.marker?.AdvancedMarkerElement || !mapsLoaded) return;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    // User location marker
    if (userLocation) {
      const userPin = document.createElement('div');
      userPin.style.cssText = `width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);`;
      const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: userLocation,
        content: userPin,
        title: 'Your Location',
      });
      markersRef.current.push(userMarker);
    }

    // Branch markers
    branches.forEach((branch) => {
      const crowdLevel = queueData[branch._id]?.overallCrowdLevel || 'Low';
      const color = CROWD_COLORS[crowdLevel] || '#3b82f6';
      const pin = document.createElement('div');
      pin.style.cssText = `width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;`;
      
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapInstance,
        position: { lat: branch.latitude, lng: branch.longitude },
        content: pin,
        title: branch.name,
      });

      marker.addListener('click', () => {
        setSelectedBranch(branch);
        setMapInstance(prev => {
          prev.panTo({ lat: branch.latitude, lng: branch.longitude });
          return prev;
        });
      });
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => (m.map = null));
    };
  }, [mapInstance, branches, queueData, userLocation, mapsLoaded]);

  const handleSelectBranch = () => {
    if (selectedBranch && onBranchSelect) {
      onBranchSelect(selectedBranch);
      setSelectedBranch(null);
    }
  };

  const getDistanceStr = (lat, lng) => {
    if (!userLocation) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, lat, lng).toFixed(1);
  };

  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <p className="text-amber-200">Google Maps API key not configured</p>
      </div>
    );
  }

  const displayError = mapsLoadError ? 'Failed to load Google Maps.' : mapError;
  if (displayError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
        <p className="text-rose-200">{displayError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600">Retry</button>
      </div>
    );
  }

  if (loading || !mapsLoaded) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80">
        <p className="text-slate-400">Loading map and branches...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[700px]">
      {/* Side Panel: Branch Comparison & Decision Support */}
      <div className="w-full lg:w-96 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold text-white mb-4">Nearby Branches</h2>
        <div className="space-y-3">
          {sortedBranches.map((branch) => {
            const data = queueData[branch._id] || {};
            const dist = getDistanceStr(branch.latitude, branch.longitude);
            const crowdColor = CROWD_COLORS[data.overallCrowdLevel || 'Low'];
            
            return (
              <div 
                key={branch._id}
                onClick={() => {
                  setSelectedBranch(branch);
                  mapInstance.panTo({ lat: branch.latitude, lng: branch.longitude });
                  mapInstance.setZoom(14);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedBranch?._id === branch._id 
                    ? 'bg-slate-800 border-sky-500' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-100">{branch.name}</h3>
                  <div 
                    className="w-3 h-3 rounded-full mt-1 shrink-0" 
                    style={{ backgroundColor: crowdColor }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{branch.address}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dist && <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{dist} km away</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    data.overallCrowdLevel === 'High' ? 'bg-rose-500/20 text-rose-400' : 
                    data.overallCrowdLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {data.overallCrowdLevel || 'Low'} Crowd
                  </span>
                  {data.estimatedWaitTime > 0 && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                      ~{data.estimatedWaitTime} min wait
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 overflow-hidden relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            mapId: 'DEMO_MAP_ID',
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
            ]
          }}
        >
          {selectedBranch && (
            <InfoWindow
              position={{ lat: selectedBranch.latitude, lng: selectedBranch.longitude }}
              onCloseClick={() => setSelectedBranch(null)}
            >
              <div className="p-3 bg-white text-slate-900 rounded-lg" style={{ maxWidth: '280px' }}>
                <h3 className="text-base font-bold">{selectedBranch.name}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-tight">{selectedBranch.address}</p>
                
                <hr className="my-3 border-slate-100" />
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">In Queue</p>
                    <p className="text-lg font-black text-slate-800">
                      {queueData[selectedBranch._id]?.totalQueueLength || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Est. Wait</p>
                    <p className="text-lg font-black text-slate-800">
                      {queueData[selectedBranch._id]?.estimatedWaitTime || 0}<span className="text-[10px] font-normal ml-0.5">min</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-600">Crowd Level:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[${CROWD_COLORS[queueData[selectedBranch._id]?.overallCrowdLevel || 'Low']}]`}
                    style={{ backgroundColor: CROWD_COLORS[queueData[selectedBranch._id]?.overallCrowdLevel || 'Low'] }}
                  >
                    {queueData[selectedBranch._id]?.overallCrowdLevel || 'Low'}
                  </span>
                </div>

                <button
                  onClick={handleSelectBranch}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-md"
                >
                  Join Queue or Book Now
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default BranchMap;
