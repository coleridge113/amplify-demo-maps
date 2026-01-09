import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Overlay from "./Overlay"
import { useDeviceHistory } from "../hooks/useDeviceHistory";

const MapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [deviceId, setDeviceId] = useState("Device-");
    const [jobOrderId, setJobOrderId] = useState("JobOrder-");
    const [confirmedParams, setConfirmedParams] = useState(null);

    const { coords, distanceTravelled, straightDistance, loading, error } = useDeviceHistory(confirmedParams);

    const markersRef = useRef([]);
    
    const clearMap = useCallback(() => {
        if (!map.current) return;
        markersRef.current.forEach(m => m.remove());
        if (map.current.getSource("route")) {
            if (map.current.getLayer("route-line")) {
                map.current.removeLayer("route-line");
            }
            map.current.removeSource("route");
        }
    }, []);

    useEffect(() => {
        if (map.current) return;
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://tiles.openfreemap.org/styles/liberty",
            center: [121.01877, 14.540678],
            zoom: 16,
        });
        map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    }, []);

    useEffect(() => {
        if (!map.current || !coords || coords.length === 0) { 
            clearMap();
            return; 
        }

        map.current.setCenter(coords[0]);
        const geojson = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: coords
            }
        };

        map.current.addSource("route", {
            type: "geojson",
            data: geojson
        });
        map.current.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                "line-color": "#FF0000",
                "line-width": 4
            }
        });

        const startMarker = new maplibregl.Marker({ color: "green" })
            .setLngLat(coords[0])
            .addTo(map.current);
        const endMarker = new maplibregl.Marker({ color: "blue" })
            .setLngLat(coords[coords.length - 1])
            .addTo(map.current);

        markersRef.current.push(startMarker, endMarker);
    }, [coords, clearMap]);

    const handleConfirm = () => {
        setConfirmedParams({ deviceId, jobOrderId });
    };

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <Overlay 
                deviceId={deviceId}
                setDeviceId={setDeviceId}
                jobOrderId={jobOrderId}
                setJobOrderId={setJobOrderId}
                onConfirm={handleConfirm}
                distanceTravelled={distanceTravelled}
                straightDistance={straightDistance}
                error={error}
                loading={loading}
            />
            <div
                ref={mapContainer}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
        </div>
    );
};

export default MapView;
