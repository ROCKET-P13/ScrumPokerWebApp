import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';

import { Routes } from '@/Common/Routes';
import { JoinRoomPage } from '@/Components/Pages/JoinRoomPage';
import { LandingPage } from '@/Components/Pages/LandingPage';
import { RoomPage } from '@/Components/Pages/RoomPage';
import { StartRoomPage } from '@/Components/Pages/StartRoomPage';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';

const queryClient = new QueryClient();

const Root = () => {
	useAppBootstrap();
	return <Outlet />;
};

const rootRoute = createRootRoute({
	component: () => <Root />,
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

const roomRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: `${Routes.ROOM}/$roomCode`,
	component: RoomPage,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	joinRoomRoute,
	startRoomRoute,
	roomRoute,
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