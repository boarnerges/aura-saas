import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Link } from "@/types";

export function useLinks(userId: string | undefined) {
  const queryClient = useQueryClient();

  // 1. Fetching Logic (The Query)
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["links", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      return data as Link[];
    },
    enabled: !!userId, // Only run if we have a userId
  });

  // 2. The "Optimistic" Add Mutation
  const addMutation = useMutation({
    mutationFn: async (newLink: Partial<Link>) => {
      const { data, error } = await supabase
        .from("links")
        .insert([newLink])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    // 🔥 THIS IS THE MAGIC: Optimistic Update logic
    onMutate: async (newLink) => {
      await queryClient.cancelQueries({ queryKey: ["links", userId] });
      const previousLinks = queryClient.getQueryData<Link[]>(["links", userId]);

      // Instantly add a "fake" link to the UI
      const optimisticLink: Link = {
        id: "temp-id",
        created_at: new Date().toISOString(),
        title: newLink.title ?? "New Link",
        url: newLink.url ?? "https://",
        user_id: newLink.user_id ?? userId ?? "",
        icon_name: newLink.icon_name,
      };

      queryClient.setQueryData<Link[]>(["links", userId], (old = []) => [
        ...old,
        optimisticLink,
      ]);

      return { previousLinks };
    },
    onError: (err, newLink, context) => {
      // Roll back to the old data if the DB call fails
      queryClient.setQueryData(["links", userId], context?.previousLinks);
    },
    onSettled: () => {
      // Refresh the data from the server to get the real ID
      queryClient.invalidateQueries({ queryKey: ["links", userId] });
    },
  });

  return { links, isLoading, addLink: addMutation.mutate };
}
