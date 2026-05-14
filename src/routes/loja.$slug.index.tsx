import { createFileRoute } from "@tanstack/react-router";
import { StorefrontPage } from "@/components/StorefrontPage";

export const Route = createFileRoute("/loja/$slug/")({
  component: StorefrontPage,
});
