import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { getNavColor, getNavLabel, formatSpeed } from './api';

function BoundsReporter({ onBoundsChange }) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds());
    },
    zoomend() {
      onBoundsChange(map.getBounds());
    },
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, []);

  return null;
}

function FlyTo({ vessel }) {
  const map = useMap();

  useEffect(() => {
    if (vessel) {
      map.flyTo([vessel.lat, vessel.lon], Math.max(map.getZoom(), 10), { duration: 1 });
    }
  }, [vessel?.mmsi]);

  return null;
}

export default function VesselMap({ vessels, selectedVessel, onSelectVessel, onBoundsChange }) {
  return (
    <MapContainer
      center={[54.0, 8.0]}
      zoom={5}
      className="vessel-map"
      preferCanvas={true}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <TileLayer
        url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        opacity={0.6}
      />

      <BoundsReporter onBoundsChange={onBoundsChange} />
      <FlyTo vessel={selectedVessel} />

      {vessels.map((v) => {
        const isSelected = selectedVessel?.mmsi === v.mmsi;
        const isMoving = v.sog != null && v.sog > 5;
        return (
          <CircleMarker
            key={v.mmsi}
            center={[v.lat, v.lon]}
            radius={isSelected ? 8 : isMoving ? 4 : 3}
            pathOptions={{
              color: isSelected ? '#fff' : getNavColor(v.navStat),
              fillColor: getNavColor(v.navStat),
              fillOpacity: isSelected ? 1 : 0.7,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={{
              click: () => onSelectVessel(v),
            }}
          >
            <Popup>
              <strong>{v.name}</strong>
              <br />
              {getNavLabel(v.navStat)} · {formatSpeed(v.sog)}
              <br />
              Bestemming: {v.destination}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
