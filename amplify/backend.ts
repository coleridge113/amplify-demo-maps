import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.ts"; // or whatever you named your resource file

const backend = defineBackend({
  auth,
});

backend.addOutput({
    geo: {
        aws_region: "ap-northeast-1"
    }
})
