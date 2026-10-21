"use client";

import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TowerRecord } from "@/app/(app)/dashboard/page";

const INITIAL_CENTER: L.LatLngExpression = [-2.5489, 118.0149];
const EMPTY_TOWERS: TowerRecord[] = [];

const towerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function createTowerPopup(tower: TowerRecord) {
  const content = document.createElement("div");
  content.className = "space-y-1 text-xs text-[#1f2a37]";

  const addParagraph = (text: string, className?: string) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    if (className) paragraph.className = className;
    content.appendChild(paragraph);
    return paragraph;
  };
  const addField = (label: string, value: string) => {
    const paragraph = document.createElement("p");
    const labelElement = document.createElement("strong");
    labelElement.textContent = `${label}: `;
    paragraph.append(labelElement, document.createTextNode(value));
    content.appendChild(paragraph);
  };

  addParagraph(tower.kodeId, "font-bold text-[#016db0]");
  addParagraph(tower.namaPemilik, "font-medium");
  addParagraph(tower.alamat, "text-[#6b7280]");
  addField("Jenis", `${tower.jenisMenara} (${tower.tinggiAgl}m)`);
  addField("No. Reg", tower.registrationNo);

  return content;
}

export default function TowerMap({
  towers = EMPTY_TOWERS,
}: {
  towers: TowerRecord[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const validTowers = useMemo(
    () =>
      towers.filter(
        (tower) =>
          Number.isFinite(tower.latitude) &&
          Number.isFinite(tower.longitude) &&
          (tower.latitude !== 0 || tower.longitude !== 0)
      ),
    [towers]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { scrollWheelZoom: true }).setView(
      INITIAL_CENTER,
      5
    );
    const markerLayer = L.layerGroup().addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;
    markerLayerRef.current = markerLayer;

    return () => {
      markerLayer.clearLayers();
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    validTowers.forEach((tower) => {
      L.marker([tower.latitude, tower.longitude], { icon: towerIcon })
        .bindPopup(createTowerPopup(tower))
        .addTo(markerLayer);
    });

    if (validTowers.length > 0) {
      const bounds = L.latLngBounds(
        validTowers.map(
          (tower) => [tower.latitude, tower.longitude] as [number, number]
        )
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [validTowers]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border border-[#e5e7eb]">
      <div ref={containerRef} className="h-full w-full z-0" />
    </div>
  );
}