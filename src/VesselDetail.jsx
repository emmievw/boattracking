import { getNavLabel, getNavColor, getShipType, decodeEta, formatSpeed, formatHeading } from './api';

function DetailRow({ label, value }) {
  if (!value || value === '—' || value === 0) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function VesselDetail({ vessel, onBack }) {
  const eta = decodeEta(vessel.eta);
  const lengthM = (vessel.dimA || 0) + (vessel.dimB || 0);
  const widthM = (vessel.dimC || 0) + (vessel.dimD || 0);
  const dimensions = lengthM > 0 ? `${lengthM} × ${widthM} m` : null;
  const draughtM = vessel.draught ? `${(vessel.draught / 10).toFixed(1)} m` : null;

  return (
    <div className="vessel-detail">
      <button className="back-btn" onClick={onBack}>← Terug naar lijst</button>

      <div className="detail-header">
        <h2>{vessel.name}</h2>
        <span
          className="nav-badge"
          style={{ background: getNavColor(vessel.navStat) + '22', color: getNavColor(vessel.navStat) }}
        >
          {getNavLabel(vessel.navStat)}
        </span>
      </div>

      <div className="detail-grid">
        <DetailRow label="MMSI" value={vessel.mmsi} />
        <DetailRow label="IMO" value={vessel.imo} />
        <DetailRow label="Roepnaam" value={vessel.callSign} />
        <DetailRow label="Type" value={getShipType(vessel.shipType)} />
        <DetailRow label="Bestemming" value={vessel.destination} />
        <DetailRow
          label="ETA"
          value={
            eta
              ? eta.toLocaleString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              : null
          }
        />
        <DetailRow label="Snelheid" value={formatSpeed(vessel.sog)} />
        <DetailRow label="Koers" value={vessel.cog != null ? `${(vessel.cog / 10).toFixed(0)}°` : null} />
        <DetailRow label="Heading" value={formatHeading(vessel.heading)} />
        <DetailRow label="Diepgang" value={draughtM} />
        <DetailRow label="Afmetingen" value={dimensions} />
        <DetailRow
          label="Positie"
          value={`${vessel.lat.toFixed(4)}° N, ${vessel.lon.toFixed(4)}° E`}
        />
      </div>
    </div>
  );
}
