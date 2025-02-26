import { PlaylistsView } from "@/modules/playlists/ui/views/playlists-view";
import { trpc } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { DEFAULT_LIMIT } from "../../../../constants";

const Page = async () => {
  void trpc.playlists.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT })

  return (
    <HydrateClient>
      <PlaylistsView />
    </HydrateClient>
  )
}

export default Page;
