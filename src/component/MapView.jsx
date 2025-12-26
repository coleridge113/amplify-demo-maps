import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers"; 
import { LocationClient, GetDevicePositionCommand, BatchUpdateDevicePositionCommand } from "@aws-sdk/client-location";

const awsRegion = import.meta.env.VITE_AWS_REGION; 
const cognitoIdentityPoolId = import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID
const trackerName = "MetromartDemoTracker"
const deviceId = "Vehicle-1"
const hardware = {
    latitude: 13.9735689,
    longitude: 121.6787518
}

const client = new LocationClient({
    region: awsRegion,
    credentials: fromCognitoIdentityPool({
        clientConfig: { region: awsRegion},
        identityPoolId: cognitoIdentityPoolId
    })
});

async function updatePositions() {
    const command = new BatchUpdateDevicePositionCommand({
        TrackerName: "MetromartDemoTracker",
        Updates: [
            {
                DeviceId: deviceId,
                Position: [ hardware.longitude, hardware.latitude ],
                SampleTime: new Date().toISOString(),
                PositionProperties: { name: "Vehicle-1" },
                Accuracy: { Horizontal: 10 }
            }
        ]
    });

    const response = await client.send(command);
    console.log("Update response:", response);
}

async function fetchPosition() {
    try {
        const command = new GetDevicePositionCommand({ TrackerName: trackerName, DeviceId: deviceId });
        const response = await client.send(command);
        return response.Position;
    } catch (err) {
        console.error("Error fetching position:", err);
        return null;
    }
}

const MapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return; // initialize only once

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://tiles.openfreemap.org/styles/liberty", // demo style
            center: [121.6761132, 13.9736382], // Pagbilao, Philippines as example
            zoom: 16,
        });

        map.current.addControl(new maplibregl.NavigationControl(), "top-right");

        async function addTrackerMarker() {
            await updatePositions()
            const pos = await fetchPosition();
            new maplibregl.Marker({ color: "red" })
                .setLngLat(pos)
                .addTo(map.current);
        }

        addTrackerMarker();
    }, []);

    return (
        <div
        ref={mapContainer}
        style={{
            position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
        }}
        />
    );
}

export default MapView;
