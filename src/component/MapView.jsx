import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapView = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return; // initialize only once

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: "https://tiles.openfreemap.org/styles/liberty", // demo style
            center: [120.9, 13.9], // Pagbilao, Philippines as example
            zoom: 10,
        });

        // Add navigation controls
        map.current.addControl(new maplibregl.NavigationControl(), "top-right");
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
