<script lang="ts" module>
	import {
		AudioWaveformIcon,
		BookOpenIcon,
		BotIcon,
		ChartPieIcon,
		CommandIcon,
		FrameIcon,
		SquareTerminalIcon,
		GalleryVerticalEndIcon,
		MapIcon,
		Settings2Icon,
		ShieldIcon,
		UsersIcon,
		FileTextIcon,
		LayoutDashboard,
		DatabaseIcon,
		SlidersHorizontalIcon,
		ActivityIcon,
		BellIcon,
		LockIcon,
		LifeBuoyIcon,
		KeyRoundIcon
	} from '@lucide/svelte';
	import { authClient } from '$lib/auth/auth-client';
	const session = authClient.useSession();

	// This is sample data.
	const data = {
		teams: [
			{
				name: 'Acme Inc',
				logo: GalleryVerticalEndIcon,
				plan: 'Enterprise'
			},
			{
				name: 'Acme Corp.',
				logo: AudioWaveformIcon,
				plan: 'Startup'
			},
			{
				name: 'Evil Corp.',
				logo: CommandIcon,
				plan: 'Free'
			}
		],
		navMain: [
			{
				title: 'Dashboard',
				url: '/dashboard',
				icon: LayoutDashboard,
				isActive: true,
				items: [
					{ title: 'Overview', url: '/dashboard' },
					{ title: 'Reports', url: '/dashboard/reports' },
					{ title: 'Recent Activity', url: '/dashboard/activity' }
				]
			},
			{
				title: 'User Management',
				url: '/users',
				icon: UsersIcon,
				items: [
					{ title: 'All Users', url: '/users' },
					{ title: 'User Profiles', url: '/users/profiles' },
					{ title: 'Login Sessions', url: '/users/sessions' }
				]
			},
			{
				title: 'Access Control (RBAC)',
				url: '/access-control',
				icon: KeyRoundIcon,
				items: [
					{ title: 'Roles', url: '/access-control/roles' },
					{ title: 'Permissions', url: '/access-control/permissions' },
					{ title: 'Assign Roles', url: '/access-control/assign' },
					{ title: 'Audit Access', url: '/access-control/audit' }
				]
			},
			{
				title: 'Documentation',
				url: '#',
				icon: BookOpenIcon,
				items: [
					{
						title: 'Introduction',
						url: '#'
					},
					{
						title: 'Get Started',
						url: '#'
					},
					{
						title: 'Tutorials',
						url: '#'
					},
					{
						title: 'Changelog',
						url: '#'
					}
				]
			},
			
			{
				title: 'Notifications',
				url: '/notifications',
				icon: BellIcon,
				items: [
					{ title: 'User Notifications', url: '/notifications/users' },
					{ title: 'System Alerts', url: '/notifications/system' }
				]
			},
			{
				title: 'Security',
				url: '/security',
				icon: LockIcon,
				items: [
					{ title: 'IP Access Control', url: '/security/ip-access' },
					{ title: 'Brute Force Protection', url: '/security/brute-force' },
					{ title: 'Audit Trails', url: '/security/audit-trails' }
				]
			},
			{
				title: 'Support',
				url: '/support',
				icon: LifeBuoyIcon,
				items: [
					{ title: 'Support Tickets', url: '/support/tickets' },
					{ title: 'Knowledge Base', url: '/support/kb' },
					{ title: 'Feedback', url: '/support/feedback' }
				]
			}
		],
		projects: [
			{
				name: 'Design Engineering',
				url: '#',
				icon: FrameIcon
			},
			{
				name: 'Sales & Marketing',
				url: '#',
				icon: ChartPieIcon
			},
			{
				name: 'Travel',
				url: '#',
				icon: MapIcon
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavProjects from './nav-projects.svelte';
	import NavUser from './nav-user.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	let user = $state({
		name: '',
		email: '',
		avatar: ''
	});

	$effect(() => {
		user.name = $session.data?.user?.name || '';
		user.email = $session.data?.user?.email || '';
		user.avatar = $session.data?.user?.image || '';
	});
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavProjects projects={data.projects} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
