import { useState, useEffect, useCallback, useRef } from 'react';
import VesselMap from './VesselMap';
import VesselDetail from './VesselDetail';
import { fetchAllData, getNavLabel, getNavColor, formatSpeed } from './api';

export default function App() {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const intervalRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchAllData();
      setVessels(data);
      setLastUpdate(new Date());

      if (selectedVessel) {
        const updated = data.find((v) => v.mmsi === selectedVessel.mmsi);
        if (updated) setSelectedVessel(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedVessel?.mmsi]);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const visibleVessels = vessels.filter((v) => {
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${v.name} ${v.destination} ${v.mmsi} ${v.callSign}`.toLowerCase();
      return haystack.includes(q);
    }
    if (mapBounds && !mapBounds.contains([v.lat, v.lon])) return false;
    return true;
  });

  const listVessels = visibleVessels.slice(0, 200);

  const totalVisible = visibleVessels.length;
  const underway = visibleVessels.filter((v) => v.navStat === 0 || v.navStat === 8).length;
  const anchored = visibleVessels.filter((v) => v.navStat === 1).length;
  const moored = visibleVessels.filter((v) => v.navStat === 5).length;
  const avgSpeed =
    visibleVessels.length > 0
      ? (
          visibleVessels.reduce((sum, v) => sum + (v.sog != null && v.sog < 1023 ? v.sog / 10 : 0), 0) /
          visibleVessels.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="app-shell">
      <VesselMap
        vessels={vessels}
        selectedVessel={selectedVessel}
        onSelectVessel={setSelectedVessel}
        onBoundsChange={setMapBounds}
      />

      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Harbor Flow</h1>
          <p className="subtitle">Bulkschepen richting Nederland · Live AIS</p>
        </div>

        {loading && vessels.length === 0 ? (
          <div className="loading-message">
            <div className="spinner" />
            <p>Scheepsdata ophalen...</p>
          </div>
        ) : error && vessels.length === 0 ? (
          <div className="error-message">
            <p>{error}</p>
            <button className="retry-btn" onClick={loadData}>Opnieuw proberen</button>
          </div>
        ) : selectedVessel ? (
          <VesselDetail vessel={selectedVessel} onBack={() => setSelectedVessel(null)} />
        ) : (
          <>
            <input
              className="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek op naam, MMSI of bestemming"
            />

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">In beeld</span>
                <strong>{totalVisible}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Varend</span>
                <strong>{underway}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Voor anker</span>
                <strong>{anchored}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Aangemeerd</span>
                <strong>{moored}</strong>
              </div>
            </div>

            <div className="vessel-list">
              {listVessels.map((v) => (
                <button
                  key={v.mmsi}
                  className="vessel-item"
                  onClick={() => setSelectedVessel(v)}
                >
                  <div className="vessel-item-top">
                    <strong>{v.name}</strong>
                    <span
                      className="nav-badge-sm"
                      style={{ background: getNavColor(v.navStat) + '22', color: getNavColor(v.navStat) }}
                    >
                      {getNavLabel(v.navStat)}
                    </span>
                  </div>
                  <div className="vessel-item-bottom">
                    <span>→ {v.destination}</span>
                    <span>{formatSpeed(v.sog)}</span>
                  </div>
                </button>
              ))}
              {visibleVessels.length > 200 && (
                <p className="more-note">
                  + {visibleVessels.length - 200} meer — zoom in of gebruik zoeken
                </p>
              )}
            </div>
          </>
        )}

        {lastUpdate && (
          <div className="last-update">
            Bijgewerkt: {lastUpdate.toLocaleTimeString('nl-NL')}
          </div>
        )}
      </aside>
    </div>
  );
}
