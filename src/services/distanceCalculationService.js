import axios from "axios";

export async function calculateValhallaDistance(coords, costing = "auto", valhallaUrl = "/valhalla") {
    if (!coords || coords.length < 2) {
        throw new Error("At least two coordinates are required");
    }

    const locations = coords.map(([lon, lat]) => ({
        lat,
        lon
    }));

    const body = {
        locations,
        costing, 
        directions_options: { units: "kilometers" }
    };

    try {
        const response = await axios.post(`${valhallaUrl}/trace_route`, body, {
            headers: { "Content-Type": "application/json" }
        });
        console.log(response.data.trip.summary.length)
        const totalKm = response.data?.trip?.summary?.length || 0;
        return totalKm * 1000;
    } catch (err) {
        console.error("Error calling Valhalla:", err);
        throw err;
    }
}

export async function traceValhallaRoute(coords, costing = "auto") {
    const shape = coords.map(([lon, lat]) => ({ lat, lon }));

    const body = {
        shape,
        costing,
        shape_match: "map_snap",
        directions_options: { units: "kilometers" }
    };

    try {
        const response = await axios.post("/valhalla/trace_route", body, {
            headers: { "Content-Type": "application/json" }
        });
        return response.data;
    } catch (err) {
        console.error("Error calling Valhalla trace_route:", err.response?.data || err);
        throw err;
    }
}

export function haversineDistance([lon1, lat1], [lon2, lat2]) {
    const R = 6371e3; 
    const toRad = deg => deg * Math.PI / 180;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a = Math.sin(Δφ/2)**2 +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c / 1000; 
}
