<script lang="ts" module>
	import {
		AudioWaveformIcon,
		BookOpenIcon,
		ChartPieIcon,
		CommandIcon,
		FrameIcon,
		GalleryVerticalEndIcon,
		MapIcon,
		UsersIcon,
		LayoutDashboard,
		BellIcon,
		LockIcon,
		LifeBuoyIcon,
		KeyRoundIcon,
		FileTextIcon,
		PenToolIcon,
		ImageIcon,
		FolderIcon,
		ActivityIcon,
		UploadIcon,
		MonitorIcon,
		LogsIcon
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
				title: 'Content Management',
				url: '/admin/content',
				icon: FileTextIcon,
				items: [
					{ title: 'Pages', url: '/admin/content/pages' },
					{ title: 'Components', url: '/admin/content/components' },
					{ title: 'Menus', url: '/admin/content/menus' },
					{ title: 'Content Types', url: '/admin/content/types' }
				]
			},
			{
				title: 'Media Management',
				url: '/admin/media',
				icon: ImageIcon,
				items: [
					{ title: 'Media Library', url: '/admin/media' },
					{ title: 'Upload Files', url: '/admin/media/upload' },
					{ title: 'Organize Folders', url: '/admin/media/folders' }
				]
			},
			{
				title: 'System Health',
				url: '/admin/system',
				icon: ActivityIcon,
				items: [
					{ title: 'System Status', url: '/admin/system/status' },
					{ title: 'Real-time Monitoring', url: '/admin/system/monitoring' },
					{ title: 'System Logs', url: '/admin/system/logs' },
					{ title: 'Performance Metrics', url: '/admin/system/performance' }
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
					{ title: 'Support Tickets', url: '/admin/support/tickets' },
					{ title: 'Contact Submissions', url: '/admin/support/contact' },
					{ title: 'Knowledge Base', url: '/admin/support/knowledge-base' },
					{ title: 'Feedback', url: '/admin/support/feedback' }
				]
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { LightSwitch } from '$lib/components/ui/light-switch';
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
	</Sidebar.Content>
	<Sidebar.Footer>
		<LightSwitch />
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
