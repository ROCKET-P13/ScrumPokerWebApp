import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';

import { Routes } from '@/Common/Routes';
import { JoinRoomPage } from '@/Components/Pages/JoinRoomPage';
import { LandingPage } from '@/Components/Pages/LandingPage';
import { StartRoomPage } from '@/Components/Pages/StartRoomPage';

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
	component: () => <Outlet />,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: Routes.HOME,
	component: LandingPage,
});

const joinRoomRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: Routes.JOIN_ROOM,
	component: JoinRoomPage,
});

const startRoomRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: Routes.START_ROOM,
	component: StartRoomPage,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	joinRoomRoute,
	startRoomRoute,
]);

const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	context: {
		queryClient,
	},
});

export const AppRouter = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider
				router={router}
				context={{ queryClient }}
			/>
		</QueryClientProvider>
	);
};