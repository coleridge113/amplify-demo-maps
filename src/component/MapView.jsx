import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Overlay from "./Overlay"
import { useDeviceHistory } from "../hooks/useDeviceHistory";
import handleWebSocketEvent from "../services/webSocketService";
import { fetchGeofences } from "../services/awsLocationService";
import createFeature from "../services/geometryService";

const MapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [deviceId, setDeviceId] = useState("Device-1");
    const [jobOrderId, setJobOrderId] = useState("JobOrder-1");
    const [confirmedParams, setConfirmedParams] = useState(null);
    const [geofences, setGeofences] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [geofenceStatus, setGeofencestatus] = useState(true);
    const [coordinate, setCoordinate] = useState(null);

    const { coords, distanceTravelled, straightDistance, loading, error } = useDeviceHistory(confirmedParams);

    const markersRef = useRef([]);

    const handleConfirm = () => {
        setConfirmedParams({ deviceId, jobOrderId });
    };

    const handleClickLive = () => {
        setIsLive((prev) => !prev);
    }; 

    const handleGeofenceEvent = (data) => {
        if (data.EventType === "EXIT") {
            setGeofencestatus(false);
        } else {
            setGeofencestatus(true);
        }
    };

    const handleLocationUpdateEvent = (data) => {
        setCoordinate(data.Position);
    }
    
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
        const loadGeofences = async () => {
            const data = await fetchGeofences(); 
            setGeofences(data);
        }
        loadGeofences();
    }, []);

    useEffect(() => {
        const onMessage = (data) => {
            if (data.EventType === "UPDATE") {
                handleLocationUpdateEvent(data);
            } else {
                handleGeofenceEvent(data);
            }
        };

        const cleanupWebSocket = handleWebSocketEvent(onMessage);
        
        return () => {
            cleanupWebSocket();
        };
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
        const routeGeojson = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: coords
            }
        };

        map.current.addSource("route", {
            type: "geojson",
            data: routeGeojson
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

    useEffect(() => {
        if (!coordinate || !map.current) return;

        const currMarker = new maplibregl.Marker({ color: "red" })
            .setLngLat(coordinate)
            .addTo(map.current);

        markersRef.current.push(currMarker);

        return () => {
            currMarker.remove();
            markersRef.current = markersRef.current.filter(m => m !== currMarker);
        }
    }, [coordinate]);

    useEffect(() => {
        let intervalId;

        if (isLive) {
            console.log("Starting Live Polling...");

            setConfirmedParams({ deviceId, jobOrderId });
            console.log("Grabbing device location");

            intervalId = setInterval(() => {
                setConfirmedParams({ deviceId, jobOrderId });
                console.log("Grabbing device location (interval)");
            }, 2000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log("Polling stopped.");
            }
        };
    }, [isLive, deviceId, jobOrderId]); 

    useEffect(() => {
        const addGeofence = () => {
            if (!map.current || !geofences || geofences.length === 0) return;

            const sourceId = "geofence-source";
            const existingSource = map.current.getSource(sourceId);

            if (!existingSource) {
                const geofenceFeature = createFeature(geofences[0]);
                if (!geofenceFeature) return;

                map.current.addSource(sourceId, {
                    type: "geojson",
                    data: geofenceFeature
                });

                map.current.addLayer({
                    id: "geofence-fill",
                    type: "fill",
                    source: sourceId,
                    paint: {
                        "fill-color": geofenceStatus ? "#00FF00" : "#808080",
                        "fill-opacity": 0.3,
                    }
                });

                map.current.addLayer({
                    id: "geofence-outline",
                    type: "line",
                    source: sourceId,
                    paint: {
                        "line-color": geofenceStatus ? "#006400" : "#000000",
                        "line-width": 2
                    }
                });
            } 
            else {
                map.current.setPaintProperty(
                    "geofence-fill", 
                    "fill-color", 
                    geofenceStatus ? "#00FF00" : "#808080"
                );
                map.current.setPaintProperty(
                    "geofence-outline", 
                    "line-color", 
                    geofenceStatus ? "#006400" : "#000000"
                );
            }
        };

        if (map.current.isStyleLoaded()) {
            setTimeout(2000);
            addGeofence();
        } else {
            map.current.once("style.load", addGeofence);
        }
    }, [geofences, geofenceStatus]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <Overlay 
                deviceId={deviceId}
                setDeviceId={setDeviceId}
                jobOrderId={jobOrderId}
                setJobOrderId={setJobOrderId}
                onClickConfirm={handleConfirm}
                onClickLive={handleClickLive}
                isLiveTracking={isLive}
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
