import { categoriesRouter } from '@/modules/categories/server/procedures';
import { createTRPCRouter } from '../init';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedures';
import { videoViewsRouter } from '@/modules/video-views/server/procedurs';
import { videoReactionsRouter } from '@/modules/video-reactions/server/procedurs';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedure';
import { commentsRouter } from '@/modules/comments/server/procedurs';
import { suggestionsRouter } from '@/modules/suggestions/server/procedures';
import { searchRouter } from '@/modules/search/server/procedures';
import { playlistRouter } from '@/modules/playlists/server/procedures';
export const appRouter = createTRPCRouter({
	categories: categoriesRouter,
	comments: commentsRouter,
	search: searchRouter,
	studio: studioRouter,
	subscriptions: subscriptionsRouter,
	suggestions: suggestionsRouter,
	videoReactions: videoReactionsRouter,
	videoVews: videoViewsRouter,
	videos: videosRouter,
	playlists: playlistRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
