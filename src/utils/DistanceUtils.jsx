import axios from "axios";

/**
 * Calculate route distance using Valhalla Route API
 * @param {Array} coords - Array of [lon, lat] points
 * @param {String} costing - Travel mode (e.g., "auto", "bicycle", "pedestrian")
 * @param {String} valhallaUrl - Base URL of your Valhalla server (e.g., http://localhost:8002)
 * @returns {Number} distance in meters
 */
export async function calculateValhallaDistance(coords, costing = "auto", valhallaUrl = "/valhalla") {
    if (!coords || coords.length < 2) {
        throw new Error("At least two coordinates are required");
    }

    // Build locations array for Valhalla
    const locations = coords.map(([lon, lat]) => ({
        lat,
        lon
    }));

    const body = {
        locations,
        costing, // travel mode
        directions_options: { units: "kilometers" }
    };
    // const body = {
    //     locations: coords.slice(0, 10).map(([lon, lat]) => ({ lat, lon })),
    //     costing: "auto",
    //     directions_options: { units: "kilometers" }
    // };
    console.log(body)
    try {
        const response = await axios.post(`${valhallaUrl}/route`, body, {
            headers: { "Content-Type": "application/json" }
        });
        // Valhalla returns distance in kilometers per leg
        console.log(response.data.trip.summary.length)
        const totalKm = response.data?.trip?.summary?.length || 0;
        return totalKm * 1000;
    } catch (err) {
        console.error("Error calling Valhalla:", err);
        throw err;
    }
}

/**
 * Example usage:
 * 
 * const coords = [
 *   [121.01877, 14.540678], // start
 *   [121.056, 14.55]        // end
 * ];
 * 
 * calculateValhallaDistance(coords, "auto", "http://localhost:8002")
 *   .then(distance => console.log("Distance (m):", distance));
 */
