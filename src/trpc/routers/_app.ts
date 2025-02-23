import { categoriesRouter } from '@/modules/categories/server/procedures';
import { createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedurs';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedurs';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedure';
import { commentsRouter } from '@/modules/comments/server/procedurs';
export const appRouter = createTRPCRouter({
	categories: categoriesRouter,
	studio: studioRouter,
	videos: videosRouter,
	videoVews: videoViewsRouter,
	videoReactions: videoReactionsRouter,
	subscriptions: subscriptionsRouter,
	comments: commentsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
