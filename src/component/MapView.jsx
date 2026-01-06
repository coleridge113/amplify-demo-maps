import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"; 
import { LocationClient, GetDevicePositionHistoryCommand } from "@aws-sdk/client-location";
import { traceValhallaRoute } from "../utils/DistanceUtils"

const awsRegion = import.meta.env.VITE_AWS_REGION; 
const cognitoIdentityPoolId = import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID;
const trackerName = "MetromartDemoTracker";

const client = new LocationClient({
    region: awsRegion,
    credentials: fromCognitoIdentityPool({
        clientConfig: { region: awsRegion },
        identityPoolId: cognitoIdentityPoolId
    })
});

async function fetchHistory(deviceId) {
    try {
        const command = new GetDevicePositionHistoryCommand({ 
            TrackerName: trackerName, 
            DeviceId: deviceId 
        });
        const response = await client.send(command);
        return response.DevicePositions.map(p => p.Position);
    } catch (err) {
        console.error("Error fetching position:", err);
        return null;
    }
}

const MapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [deviceId, setDeviceId] = useState("");
    const [confirmedId, setConfirmedId] = useState(null);
    const markersRef = useRef([]); // keep track of markers

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
        if (!confirmedId || !map.current) return;

        async function loadHistory() {
            const coords = await fetchHistory(confirmedId);
            const distance = traceValhallaRoute(coords)

            // 🔑 Always clear old markers and route first
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            if (map.current.getSource("route")) {
                if (map.current.getLayer("route-line")) {
                    map.current.removeLayer("route-line");
                }
                map.current.removeSource("route");
            }

            if (coords && coords.length > 0) {
                // Center map on the first point
                map.current.setCenter(coords[0]);

                const geojson = {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coords,
                    },
                };

                map.current.addSource("route", {
                    type: "geojson",
                    data: geojson,
                });

                map.current.addLayer({
                    id: "route-line",
                    type: "line",
                    source: "route",
                    layout: {
                        "line-join": "round",
                        "line-cap": "round",
                    },
                    paint: {
                        "line-color": "#FF0000",
                        "line-width": 4,
                    },
                });

                // Add new markers
                const startMarker = new maplibregl.Marker({ color: "green" })
                    .setLngLat(coords[0])
                    .addTo(map.current);
                const endMarker = new maplibregl.Marker({ color: "blue" })
                    .setLngLat(coords[coords.length - 1])
                    .addTo(map.current);

                markersRef.current.push(startMarker, endMarker);
            } else {
                console.warn("No history found for device:", confirmedId);
                // Nothing else to draw, map stays clean
            }
        }

        loadHistory();
    }, [confirmedId]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    zIndex: 1,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                }}
            >
                <input
                    type="text"
                    placeholder="Enter Device ID"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    style={{
                        marginRight: "12px",
                        fontSize: "18px",       // bigger text
                        padding: "10px 14px",   // more space inside
                        width: "220px",         // wider input box
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                    }}
                />
                <button
                    onClick={() => setConfirmedId(deviceId)}
                    style={{
                        fontSize: "18px",
                        padding: "10px 20px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Confirm
                </button>
            </div>

            <div
                ref={mapContainer}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                }}
            />
        </div>
    );
};

export default MapView;
