import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.ts"; 

const backend = defineBackend({
  auth,
});

backend.addOutput({
    geo: {
        aws_region: "ap-southeast-1"
    }
})
