'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
function initializeLeaflet() {
  const customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  L.Marker.prototype.options.icon = customIcon;
}

interface MapProps {
  center?: [number, number];
  markers?: Array<{
    position: [number, number];
    popup?: string;
    type?: 'attraction' | 'food' | 'accommodation' | 'outdoor';
  }>;
}

function MapUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
      map.invalidateSize();
    }
  }, [center, map]);

  return null;
}

const markerColors = {
  attraction: '#FF4B4B',
  food: '#4CAF50',
  accommodation: '#2196F3',
  outdoor: '#FF9800'
};

export default function Map({ center = [51.505, -0.09], markers = [] }: MapProps) {
  useEffect(() => {
    initializeLeaflet();
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="h-[600px] w-full rounded-lg shadow-lg"
      scrollWheelZoom={true}
    >
      <MapUpdater center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />
      {markers.map((marker, index) => (
        <div key={index}>
          <Marker position={marker.position}>
            {marker.popup && (
              <Popup className="custom-popup">
                <div className="p-2">
                  <h3 className="font-semibold">{marker.popup}</h3>
                  {marker.type && (
                    <span className="text-sm text-muted-foreground capitalize">
                      {marker.type}
                    </span>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
          <Circle
            center={marker.position}
            radius={100}
            pathOptions={{
              color: marker.type ? markerColors[marker.type] : '#3388ff',
              fillColor: marker.type ? markerColors[marker.type] : '#3388ff',
              fillOpacity: 0.2
            }}
          />
        </div>
      ))}
    </MapContainer>
  );
}