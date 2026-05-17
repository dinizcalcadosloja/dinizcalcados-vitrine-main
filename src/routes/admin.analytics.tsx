import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const AnalyticsDashboard = lazy(() =>
  import("@/components/analytics/AnalyticsDashboard").then((m) => ({
    default: m.AnalyticsDashboard,
  })),
);

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const { user } = useAuth();

  const { data: store, isLoading } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !store) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AnalyticsDashboard storeId={store.id} />
    </Suspense>
  );
}
