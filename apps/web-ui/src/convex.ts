import { ConvexReactClient } from "convex/react";

// Create the Convex client
const convex = new ConvexReactClient(
  // Use the local Convex deployment URL
  "http://127.0.0.1:3210"
);

export default convex;
