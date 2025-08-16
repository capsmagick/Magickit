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
				url: '/admin',
				icon: LayoutDashboard,
				isActive: true,
				items: [
					{ title: 'Overview', url: '/admin' },
					{ title: 'Analytics', url: '/admin' },
					{ title: 'Recent Activity', url: '/admin' }
				]
			},
			{
				title: 'User Management',
				url: '/admin/users',
				icon: UsersIcon,
				items: [
					{ title: 'All Users', url: '/admin/users' },
					{ title: 'User Profiles', url: '/admin/users/profiles' },
					{ title: 'Login Sessions', url: '/admin/users/sessions' }
				]
			},
			{
				title: 'Access Control (RBAC)',
				url: '/admin/access-control',
				icon: KeyRoundIcon,
				items: [
					{ title: 'Roles', url: '/admin/access-control/roles' },
					{ title: 'Permissions', url: '/admin/access-control/permissions' },
					{ title: 'Assign Roles', url: '/admin/access-control/assign' },
					{ title: 'Audit Access', url: '/admin/access-control/audit' }
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
				url: '/admin/notifications',
				icon: BellIcon,
				items: [
					{ title: 'User Notifications', url: '/admin/notifications/user' },
					{ title: 'System Alerts', url: '/admin/notifications/system' },
					{ title: 'Email Templates', url: '/admin/notifications/templates' }
				]
			},
			{
				title: 'Security',
				url: '/admin/security',
				icon: LockIcon,
				items: [
					{ title: 'Overview', url: '/admin/security' },
					{ title: 'IP Access Control', url: '/admin/security/ip-access' },
					{ title: 'Brute Force Protection', url: '/admin/security/brute-force' },
					{ title: 'Audit Trails', url: '/admin/security/audit-trails' }
				]
			},
			{
				title: 'Support',
				url: '/admin/support',
				icon: LifeBuoyIcon,
				items: [
					{ title: 'Support Tickets', url: '/admin/support' },
					{ title: 'Knowledge Base', url: '/admin/support' },
					{ title: 'Feedback', url: '/admin/support' }
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
