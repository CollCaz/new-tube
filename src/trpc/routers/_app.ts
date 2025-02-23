import { categoriesRouter } from '@/modules/categories/server/procedures';
import { createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedurs';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedurs';
export const appRouter = createTRPCRouter({
	categories: categoriesRouter,
	studio: studioRouter,
	videos: videosRouter,
	videoVews: videoViewsRouter,
	videoReactions: videoReactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
