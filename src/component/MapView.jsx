import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"; 
import { LocationClient, GetDevicePositionHistoryCommand } from "@aws-sdk/client-location";
import { haversineDistance, traceValhallaRoute } from "../utils/DistanceUtils"

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
    let allPositions = [];
    let nextToken = undefined;

    try {
        do {
            const command = new GetDevicePositionHistoryCommand({
                TrackerName: trackerName,
                DeviceId: deviceId,
                NextToken: nextToken,
            });
            const response = await client.send(command);
            if (response.DevicePositions) {
                allPositions = allPositions.concat(response.DevicePositions.map(p => p.Position));
            }
            nextToken = response.NextToken;
        } while (nextToken);

        return allPositions;
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
    const [distanceTravelled, setDistanceTravelled] = useState(null); // NEW
    const [straightDistance, setStraightDistance] = useState(null);
    const markersRef = useRef([]);

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
            if (!coords || coords.length === 0) {
                console.warn("No history found for device:", confirmedId);
                setDistanceTravelled(null);
                return;
            }

            try {
                const result = await traceValhallaRoute(coords);
                const km = result?.trip?.summary?.length || 0;
                setDistanceTravelled(km); // store distance in km

                const straightKm = haversineDistance(coords[0], coords[coords.length - 1]);
                setStraightDistance(straightKm);
            } catch (err) {
                console.error("Valhalla trace_route failed:", err);
                setDistanceTravelled(null);
                setStraightDistance(null);
            }

            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];
            if (map.current.getSource("route")) {
                if (map.current.getLayer("route-line")) {
                    map.current.removeLayer("route-line");
                }
                map.current.removeSource("route");
            }

            map.current.setCenter(coords[0]);
            const geojson = {
                type: "Feature",
                geometry: { type: "LineString", coordinates: coords },
            };
            map.current.addSource("route", { type: "geojson", data: geojson });
            map.current.addLayer({
                id: "route-line",
                type: "line",
                source: "route",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-color": "#FF0000", "line-width": 4 },
            });

            const startMarker = new maplibregl.Marker({ color: "green" })
            .setLngLat(coords[0])
            .addTo(map.current);
            const endMarker = new maplibregl.Marker({ color: "blue" })
            .setLngLat(coords[coords.length - 1])
            .addTo(map.current);
            markersRef.current.push(startMarker, endMarker);
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
                        fontSize: "18px",
                        padding: "10px 14px",
                        width: "220px",
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

                {distanceTravelled !== null && straightDistance !== null && (
                    <div
                        style={{
                            marginTop: "10px",
                            fontSize: "18px",
                            padding: "10px 14px",
                            backgroundColor: "#212121",
                            color: "#ffffff",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Route distance:</span>
                            <span>{distanceTravelled.toFixed(2)} km</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Straight‑line distance:</span>
                            <span>{straightDistance.toFixed(2)} km</span>
                        </div>
                    </div>
                )}
            </ div>
            <div
                ref={mapContainer}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
        </div>
    );
};

export default MapView;
