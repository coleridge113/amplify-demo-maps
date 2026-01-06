import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"; 
import { LocationClient, GetDevicePositionHistoryCommand } from "@aws-sdk/client-location";

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

    useEffect(() => {
        if (map.current) return; // initialize only once
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://tiles.openfreemap.org/styles/liberty", // demo style
            center: [121.01877, 14.540678],
            zoom: 16,
        });

        map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    }, []);

    useEffect(() => {
        if (!confirmedId || !map.current) return;

        async function loadHistory() {
            const coords = await fetchHistory(confirmedId);

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

                // Remove old source/layer if they exist
                if (map.current.getSource("route")) {
                    if (map.current.getLayer("route-line")) {
                        map.current.removeLayer("route-line");
                    }
                    map.current.removeSource("route");
                }

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

                // Add markers at start and end
                new maplibregl.Marker({ color: "green" })
                    .setLngLat(coords[0])
                    .addTo(map.current);

                new maplibregl.Marker({ color: "blue" })
                    .setLngLat(coords[coords.length - 1])
                    .addTo(map.current);
            }
        }

        loadHistory();
    }, [confirmedId]);

    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
            {/* Input + Button overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "white",
                    padding: "8px",
                    borderRadius: "4px",
                    zIndex: 1,
                }}
            >
                <input
                    type="text"
                    placeholder="Enter Device ID"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    style={{ marginRight: "8px" }}
                />
                <button onClick={() => setConfirmedId(deviceId)}>Confirm</button>
            </div>

            {/* Map container */}
            <div
                ref={mapContainer}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            />
        </div>
    );
};

export default MapView;
