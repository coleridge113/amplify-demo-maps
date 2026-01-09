import { fetchHistory } from "../services/awsLocationService";
import { haversineDistance, traceValhallaRoute } from "../services/distanceCalculationService";
import { useEffect, useState } from "react";

export const useDeviceHistory = (params) => {
    const [coords, setCoords] = useState([]);
    const [distanceTravelled, setDistanceTravelled] = useState(null);
    const [straightDistance, setStraightDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!params?.deviceId || !params?.jobOrderId) {
            setCoords([]);
            setDistanceTravelled(null);
            setStraightDistance(null);
            setError(null);
            return;
        }

        const loadHistory = async () => {
            setLoading(true);
            setError(null);
            setDistanceTravelled(null);
            setStraightDistance(null);
            setCoords([]);

            try {
                const fetchedCoords = await fetchHistory(params.deviceId, params.jobOrderId);
                if (!fetchedCoords || fetchedCoords.length === 0) {
                    console.warn("No history found for device:", params.deviceId);
                    setError("No history found for device given IDs.");
                    return;
                }

                setCoords(fetchedCoords);

                const result = await traceValhallaRoute(fetchedCoords);
                const routeKm = result?.trip?.summary?.length || 0;
                setDistanceTravelled(routeKm);

                const straightKm =  haversineDistance(fetchedCoords[0], fetchedCoords[fetchedCoords.length - 1]);
                setStraightDistance(straightKm);

            } catch (err) {
                console.error("Failed to process device history", err);
                setError("Failed to load or process route data.")
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [params])

    return { coords, distanceTravelled, straightDistance, loading, error };
};
