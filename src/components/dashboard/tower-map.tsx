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

function createClusterPopup(towers: TowerRecord[]) {
  const content = document.createElement("div");
  content.className = "space-y-3";
  towers.forEach((tower, index) => {
    if (index > 0) {
      const separator = document.createElement("hr");
      separator.className = "border-[#e5e7eb]";
      content.appendChild(separator);
    }
    content.appendChild(createTowerPopup(tower));
  });
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

    const renderMarkers = () => {
      markerLayer.clearLayers();
      const groups: TowerRecord[][] = [];
      for (const tower of validTowers) {
        const point = map.latLngToLayerPoint([tower.latitude, tower.longitude]);
        const group = groups.find((entries) => {
          const center = entries.reduce(
            (sum, entry) => ({
              lat: sum.lat + entry.latitude / entries.length,
              lng: sum.lng + entry.longitude / entries.length,
            }),
            { lat: 0, lng: 0 },
          );
          return point.distanceTo(
            map.latLngToLayerPoint([center.lat, center.lng]),
          ) < 28;
        });
        if (group) group.push(tower);
        else groups.push([tower]);
      }

      for (const group of groups) {
        const center = group.reduce(
          (sum, tower) => ({
            lat: sum.lat + tower.latitude / group.length,
            lng: sum.lng + tower.longitude / group.length,
          }),
          { lat: 0, lng: 0 },
        );
        const marker =
          group.length === 1
            ? L.marker([center.lat, center.lng], { icon: towerIcon })
            : L.marker([center.lat, center.lng], {
                icon: L.divIcon({
                  className: "",
                  html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:2px solid white;border-radius:50%;background:#016db0;color:white;font-size:12px;font-weight:700;box-shadow:0 1px 5px #0006">${group.length}</span>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                }),
              });
        marker.bindPopup(
          group.length === 1
            ? createTowerPopup(group[0])
            : createClusterPopup(group),
        );
        if (group.length > 1) {
          marker.on("click", () => {
            const distinctLocations = new Set(
              group.map((tower) => `${tower.latitude},${tower.longitude}`),
            );
            if (distinctLocations.size > 1) {
              map.fitBounds(
                L.latLngBounds(
                  group.map(
                    (tower) =>
                      [tower.latitude, tower.longitude] as [number, number],
                  ),
                ),
                { padding: [40, 40], maxZoom: 18 },
              );
            }
          });
        }
        marker.addTo(markerLayer);
      }
    };

    renderMarkers();
    map.on("zoomend", renderMarkers);
    if (validTowers.length > 0) {
      map.fitBounds(
        L.latLngBounds(
          validTowers.map(
            (tower) => [tower.latitude, tower.longitude] as [number, number],
          ),
        ),
        { padding: [40, 40], maxZoom: 14 },
      );
    }
    return () => {
      map.off("zoomend", renderMarkers);
    };
  }, [validTowers]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border border-[#e5e7eb]">
      <div ref={containerRef} className="h-full w-full z-0" />
    </div>
  );
}