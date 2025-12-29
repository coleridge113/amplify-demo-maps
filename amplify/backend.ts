import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.ts"; // or whatever you named your resource file

defineBackend({
  auth,
  // add other resources here, e.g. storage, location, etc.
});
