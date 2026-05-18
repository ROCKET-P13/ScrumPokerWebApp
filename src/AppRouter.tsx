import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { AppBar, AppBarCenter, AppBarLeft, AppBarRight } from '@ui/AppBar';

import { Routes } from '@/Common/Routes';
import { JoinRoomPage } from '@/Components/Pages/JoinRoomPage';
import { LandingPage } from '@/Components/Pages/LandingPage';
import { RoomPage } from '@/Components/Pages/RoomPage';
import { StartRoomPage } from '@/Components/Pages/StartRoomPage';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { roomStore } from '@/stores/roomStore';
import { CopyRoomLinkButton } from '@/ui/CopyRoomLinkButton';
import { ThemeToggle } from '@/ui/ThemeToggle';

const queryClient = new QueryClient();

const Root = () => {
	useAppBootstrap();
	const session = roomStore((storeSnapshot) => storeSnapshot.session);

	return (
		<div className="flex min-h-dvh flex-col">
			<AppBar>
				<AppBarLeft>
					<h1 className="text-lg font-semibold tracking-tight text-foreground">Scrum Poker</h1>
				</AppBarLeft>
				<AppBarCenter>
					<div className="flex flex-row items-center gap-1 text-sm text-muted-foreground">
						{
							session.roomCode
								? <div className='flex flex-row gap-2'>
									<div className='flex flex-row gap-1'>
										<p>Room</p>
										<p className="font-mono font-medium text-foreground">{session.roomCode}</p>
									</div>
									<CopyRoomLinkButton roomCode={session.roomCode} />
								</div>
								: <></>
						}

					</div>
				</AppBarCenter>
				<AppBarRight>
					<ThemeToggle />
				</AppBarRight>

			</AppBar>

			<main className="flex min-h-0 flex-1 flex-col">
				<Outlet />
			</main>
		</div>
	);
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
	history: createBrowserHistory(),
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