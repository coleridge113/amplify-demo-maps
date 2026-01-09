
function createFeature(geofence) {
    if (!geofence || !geofence.Geometry || !geofence.Geometry.Polygon) return null;
    return {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": geofence.Geometry.Polygon
        },
        "properties": {
            "id": geofence.GeofenceId
        }
    };
}

export default createFeature;
