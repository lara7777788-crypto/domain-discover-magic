import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDesignsTool from "./tools/list-designs";
import getDesignTool from "./tools/get-design";
import createDesignTool from "./tools/create-design";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "layercake-mcp",
  title: "Layercake",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in Layercake account. Use `list_designs` to browse saved slices, `get_design` to read one by ID, and `create_design` to save a new slice draft.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listDesignsTool, getDesignTool, createDesignTool],
});
