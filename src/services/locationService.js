import { GetDevicePositionHistoryCommand, LocationClient } from "@aws-sdk/client-location";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

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

async function fetchHistory(deviceId, jobOrderId) {
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
            const devicePositions = response.DevicePositions || [];

            const matched = devicePositions
                .filter(p => {
                    const props = p.PositionProperties || {};
                    return props.jobOrderId === jobOrderId;
                })
                .map(p => p.Position);
            
            allPositions = allPositions.concat(matched);
            nextToken = response.NextToken;
        } while (nextToken);

        return allPositions;
    } catch(err) {
        console.error("Error fetch device history:", err);
        return null;
    }
}

export default fetchHistory;
