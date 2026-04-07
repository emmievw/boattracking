import { useState } from 'react';
import { vessels } from './data/vessels';

const now = new Date('2026-04-07T12:00:00');

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('nl-NL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatRelative = (value) => {
  const diffMs = new Date(value).getTime() - now.getTime();
  const diffHours = Math.round(diffMs / 36e5);

  if (diffHours === 0) {
    return 'Binnen een uur';
  }

  if (diffHours > 0) {
    return `Over ${diffHours} uur`;
  }

  return `${Math.abs(diffHours)} uur geleden`;
};

const statusTone = {
  Onderweg: 'tone-blue',
  Vertraagd: 'tone-red',
  Aangemeerd: 'tone-green',
  'Voor anker': 'tone-amber',
};

function App() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');

  const filteredVessels = vessels
    .filter((vessel) => {
      if (statusFilter === 'Alle') {
        return true;
      }

      return vessel.status === statusFilter;
    })
    .filter((vessel) => {
      const haystack = `${vessel.name} ${vessel.destination} ${vessel.origin} ${vessel.cargo}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    })
    .sort((left, right) => new Date(left.eta) - new Date(right.eta));

  const nextArrival = [...vessels]
    .filter((vessel) => new Date(vessel.eta) > now)
    .sort((left, right) => new Date(left.eta) - new Date(right.eta))[0];

  const activeVoyages = vessels.filter((vessel) => vessel.status === 'Onderweg').length;
  const delayedVoyages = vessels.filter((vessel) => vessel.delayMinutes > 30).length;
  const berthedVoyages = vessels.filter((vessel) => vessel.status === 'Aangemeerd').length;
  const averageDelay = Math.round(
    vessels.reduce((total, vessel) => total + vessel.delayMinutes, 0) / vessels.length
  );

  return (
    <div className="app-shell">
      <div className="background-orb orb-left" />
      <div className="background-orb orb-right" />

      <main className="dashboard">
        <section className="hero-card panel">
          <div>
            <p className="eyebrow">Harbor Flow</p>
            <h1>Volg schepen, ETA&apos;s en aankomstdrukte in een logistiek overzicht.</h1>
            <p className="hero-copy">
              Deze MVP is klaar om uit te bouwen naar een echte boat tracking app met AIS- of port-data.
              Voor nu zie je hoe planning, vertragingen en aankomsten samenkomen in één scherm.
            </p>
          </div>

          <div className="hero-highlight">
            <span className="hero-label">Eerstvolgende aankomst</span>
            <strong>{nextArrival.name}</strong>
            <span>{nextArrival.destination}</span>
            <span>{formatDateTime(nextArrival.eta)}</span>
            <span className="hero-chip">{formatRelative(nextArrival.eta)}</span>
          </div>
        </section>

        <section className="stats-grid">
          <article className="panel stat-card">
            <span className="stat-label">Schepen onderweg</span>
            <strong>{activeVoyages}</strong>
            <p>Actieve routes richting havens in NL en BE.</p>
          </article>
          <article className="panel stat-card">
            <span className="stat-label">Vertragingen</span>
            <strong>{delayedVoyages}</strong>
            <p>Schepen met meer dan 30 minuten afwijking.</p>
          </article>
          <article className="panel stat-card">
            <span className="stat-label">Aangemeerd</span>
            <strong>{berthedVoyages}</strong>
            <p>Schepen die nu aan de kade liggen.</p>
          </article>
          <article className="panel stat-card accent-card">
            <span className="stat-label">Gem. ETA-afwijking</span>
            <strong>{averageDelay} min</strong>
            <p>Handig voor capaciteits- en ploegplanning.</p>
          </article>
        </section>

        <section className="content-grid">
          <div className="panel table-panel">
            <div className="section-header">
              <div>
                <p className="section-kicker">Aankomstplanning</p>
                <h2>Operationeel overzicht</h2>
              </div>

              <div className="toolbar">
                <input
                  className="search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zoek op schip, haven of lading"
                />
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>Alle</option>
                  <option>Onderweg</option>
                  <option>Vertraagd</option>
                  <option>Aangemeerd</option>
                  <option>Voor anker</option>
                </select>
              </div>
            </div>

            <div className="vessel-list">
              {filteredVessels.map((vessel) => (
                <article className="vessel-row" key={vessel.id}>
                  <div className="vessel-primary">
                    <div>
                      <h3>{vessel.name}</h3>
                      <p>
                        {vessel.origin} naar {vessel.destination}
                      </p>
                    </div>
                    <span className={`status-badge ${statusTone[vessel.status]}`}>{vessel.status}</span>
                  </div>

                  <div className="vessel-meta">
                    <div>
                      <span className="meta-label">ETA</span>
                      <strong>{formatDateTime(vessel.eta)}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Ligplaats</span>
                      <strong>{vessel.berth}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Lading</span>
                      <strong>{vessel.cargo}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Snelheid</span>
                      <strong>{vessel.speedKnots} kn</strong>
                    </div>
                  </div>

                  <div className="progress-block">
                    <div className="progress-copy">
                      <span>Routevoortgang</span>
                      <strong>{vessel.progress}%</strong>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${vessel.progress}%` }} />
                    </div>
                    <p className="delay-copy">
                      {vessel.delayMinutes > 0
                        ? `${vessel.delayMinutes} min afwijking op schema`
                        : 'Op schema'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="side-column">
            <div className="panel timeline-panel">
              <p className="section-kicker">Komende vensters</p>
              <h2>ETA timeline</h2>
              <div className="timeline-list">
                {filteredVessels.slice(0, 4).map((vessel) => (
                  <div className="timeline-item" key={vessel.id}>
                    <span className="timeline-dot" />
                    <div>
                      <strong>{formatDateTime(vessel.eta)}</strong>
                      <p>{vessel.name}</p>
                      <span>
                        {vessel.destination} · {formatRelative(vessel.eta)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel insight-panel">
              <p className="section-kicker">Volgende stap</p>
              <h2>Klaar voor echte data</h2>
              <ul>
                <li>Koppel AIS- of haven-API data aan deze lijstweergave.</li>
                <li>Voeg waarschuwingen toe bij vertragingen of gewijzigde ligplaatsen.</li>
                <li>Bouw daarna filters per terminal, klant of routecorridor uit.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;