"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TowerRecord } from "@/app/(app)/dashboard/page";

const towerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FitBounds({ towers }: { towers: TowerRecord[] }) {
  const map = useMap();

  useEffect(() => {
    const validCoords = towers.filter(
      (t) =>
        Number.isFinite(t.latitude) &&
        Number.isFinite(t.longitude) &&
        (t.latitude !== 0 || t.longitude !== 0)
    );
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(
        validCoords.map((t) => [t.latitude, t.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [towers, map]);

  return null;
}

export default function TowerMap({ towers = [] }: { towers: TowerRecord[] }) {
  const validTowers = towers.filter(
    (t) =>
      Number.isFinite(t.latitude) &&
      Number.isFinite(t.longitude) &&
      (t.latitude !== 0 || t.longitude !== 0)
  );

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border border-[#e5e7eb]">
      <MapContainer
        center={[-2.5489, 118.0149]}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds towers={validTowers} />
        {validTowers.map((tower) => (
          <Marker
            key={tower.id}
            position={[tower.latitude, tower.longitude]}
            icon={towerIcon}
          >
            <Popup>
              <div className="space-y-1 text-xs text-[#1f2a37]">
                <p className="font-bold text-[#016db0]">{tower.kodeId}</p>
                <p className="font-medium">{tower.namaPemilik}</p>
                <p className="text-[#6b7280]">{tower.alamat}</p>
                <p>
                  <strong>Jenis:</strong> {tower.jenisMenara} ({tower.tinggiAgl}m)
                </p>
                <p>
                  <strong>No. Reg:</strong> {tower.registrationNo}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}