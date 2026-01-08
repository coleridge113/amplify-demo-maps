const Overlay = ({ deviceId, setDeviceId, jobOrderId, setJobOrderId, onConfirm, distanceTravelled, straightDistance }) => {
    return (
        <div
            style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "white",
                padding: "12px",
                borderRadius: "6px",
                zIndex: 1,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minWidth: "350px",
                maxWidth: "calc(100vw-20px)",
                boxSizing: "border-box"
            }}
        >
            <input
                type="text"
                placeholder="Enter Device ID"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                style={{
                    fontSize: "18px",
                    padding: "10px 14px",
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                }}
            />
            <input
                type="text"
                placeholder="Enter Job Order ID"
                value={jobOrderId}
                onChange={(e) => setJobOrderId(e.target.value)}
                style={{
                    fontSize: "18px",
                    padding: "10px 14px",
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                }}
            />
            <button
                onClick={onConfirm}
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
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Route distance:</span>
                        <span>{distanceTravelled.toFixed(2)} km</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Straight‑line distance:</span>
                        <span>{straightDistance.toFixed(2)} km</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overlay;
