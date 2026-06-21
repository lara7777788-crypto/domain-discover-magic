import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  beforeLoad: () => {
    throw redirect({ to: "/about", code: 301 });
  },
});
