const LOCATIONS_URL = 'https://meri.digitraffic.fi/api/ais/v1/locations';
const VESSELS_URL = 'https://meri.digitraffic.fi/api/ais/v1/vessels';

const NL_PORTS = [
  'ROTTERDAM', 'AMSTERDAM', 'IJMUIDEN', 'VLISSINGEN', 'TERNEUZEN',
  'DORDRECHT', 'MOERDIJK', 'EUROPOORT', 'MAASVLAKTE', 'EEMSHAVEN',
  'DELFZIJL', 'HARLINGEN', 'DEN HELDER', 'SCHIEDAM', 'BOTLEK',
  'PERNIS', 'HOOK OF HOLLAND', 'HOEK VAN HOLLAND', 'NLRTM', 'NLAMS',
  'NLVLI', 'NLTNZ', 'NLEEM', 'NLIJM', 'NETHERLANDS',
];

const NAV_STATUS = {
  0: 'Varend (motor)',
  1: 'Voor anker',
  2: 'Niet onder commando',
  3: 'Beperkt manoeuvreerbaar',
  4: 'Beperkt door diepgang',
  5: 'Aangemeerd',
  6: 'Aan de grond',
  7: 'Vissend',
  8: 'Varend (zeil)',
  11: 'Gesleept',
  14: 'AIS-SART',
  15: 'Onbekend',
};

const NAV_COLORS = {
  0: '#2563eb',
  1: '#d38b24',
  2: '#cb5d4c',
  3: '#cb5d4c',
  4: '#8b5d10',
  5: '#2f8f83',
  6: '#cb5d4c',
  7: '#3bb8c8',
  8: '#2563eb',
  11: '#8b5d10',
  14: '#cb5d4c',
  15: '#9ca3af',
};

const SHIP_TYPES = [
  [20, 29, 'Vleugelboot'],
  [30, 39, 'Speciaal vaartuig'],
  [40, 49, 'Hogesnelheidsvaartuig'],
  [50, 59, 'Sleepboot/Loods'],
  [60, 69, 'Passagiersschip'],
  [70, 79, 'Vrachtschip'],
  [80, 89, 'Tanker'],
  [90, 99, 'Overig'],
];

export function getNavLabel(code) {
  return NAV_STATUS[code] ?? 'Onbekend';
}

export function getNavColor(code) {
  return NAV_COLORS[code] ?? '#9ca3af';
}

export function getShipType(code) {
  if (code == null) return 'Onbekend';
  for (const [lo, hi, label] of SHIP_TYPES) {
    if (code >= lo && code <= hi) return label;
  }
  return 'Onbekend';
}

export function decodeEta(raw) {
  if (!raw || raw === 0) return null;
  const month = (raw >> 16) & 0xf;
  const day = (raw >> 11) & 0x1f;
  const hour = (raw >> 6) & 0x1f;
  const minute = raw & 0x3f;
  if (month === 0 || day === 0 || hour > 23 || minute > 59) return null;
  const year = new Date().getFullYear();
  return new Date(year, month - 1, day, hour, minute);
}

export function formatSpeed(sog) {
  if (sog == null || sog >= 102.3) return '—';
  return `${(sog / 10).toFixed(1)} kn`;
}

export function formatHeading(hdg) {
  if (hdg == null || hdg === 511) return '—';
  return `${hdg}°`;
}

export async function fetchAllData() {
  const [locRes, metaRes] = await Promise.all([
    fetch(LOCATIONS_URL),
    fetch(VESSELS_URL),
  ]);

  if (!locRes.ok) throw new Error(`Locaties laden mislukt (${locRes.status})`);
  if (!metaRes.ok) throw new Error(`Scheepsdata laden mislukt (${metaRes.status})`);

  const locData = await locRes.json();
  const metaArr = await metaRes.json();

  const metaMap = new Map();
  for (const v of metaArr) {
    metaMap.set(v.mmsi, v);
  }

  const vessels = [];

  for (const feature of locData.features) {
    const props = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;

    if (lat === 0 && lon === 0) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    const meta = metaMap.get(props.mmsi) || {};

    // Alleen vrachtschepen (70-79 = cargo / bulk)
    const type = meta.shipType;
    if (type == null || type < 70 || type > 79) continue;

    // Alleen bestemming Nederland
    const dest = (meta.destination || '').toUpperCase();
    if (!dest || !NL_PORTS.some((port) => dest.includes(port))) continue;

    vessels.push({
      mmsi: props.mmsi,
      lat,
      lon,
      sog: props.sog,
      cog: props.cog,
      heading: props.heading,
      navStat: props.navStat,
      timestamp: props.timestampExternal,
      name: meta.name || `MMSI ${props.mmsi}`,
      destination: meta.destination || '—',
      callSign: meta.callSign || '—',
      imo: meta.imo || 0,
      shipType: meta.shipType,
      draught: meta.draught,
      eta: meta.eta,
      posType: meta.posType,
      dimA: meta.referencePointA,
      dimB: meta.referencePointB,
      dimC: meta.referencePointC,
      dimD: meta.referencePointD,
    });
  }

  return vessels;
}
