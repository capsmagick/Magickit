<script lang="ts" module>
	import {
		AudioWaveformIcon,
		BookOpenIcon,
		CommandIcon,
		GalleryVerticalEndIcon,
		UsersIcon,
		LayoutDashboard,
		BellIcon,
		LockIcon,
		LifeBuoyIcon,
		KeyRoundIcon,
		FileTextIcon,
		ImageIcon,
		ActivityIcon
	} from '@lucide/svelte';

	// Base navigation data (static)
	const baseNavigation = [
		{
			title: 'Dashboard',
			url: '/admin',
			icon: LayoutDashboard,
			items: [
				{ title: 'Overview', url: '/admin' },
				{ title: 'Analytics', url: '/admin' },
				{ title: 'Recent Activity', url: '/admin' }
			],
			requiresPermission: false // Dashboard is always accessible to authenticated admin users
		},
		{
			title: 'User Management',
			url: '/admin/users',
			icon: UsersIcon,
			items: [
				{ title: 'All Users', url: '/admin/users' },
				{ title: 'User Profiles', url: '/admin/users/profiles' },
				{ title: 'Login Sessions', url: '/admin/users/sessions' }
			],
			requiresPermission: true,
			permissionCheck: 'users'
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
			],
			requiresPermission: true,
			permissionCheck: 'roles'
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
			],
			requiresPermission: true,
			permissionCheck: 'content'
		},
		{
			title: 'Media Management',
			url: '/admin/media',
			icon: ImageIcon,
			items: [
				{ title: 'Media Library', url: '/admin/media' },
				{ title: 'Upload Files', url: '/admin/media/upload' },
				{ title: 'Organize Folders', url: '/admin/media/folders' }
			],
			requiresPermission: true,
			permissionCheck: 'media'
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
			],
			requiresPermission: true,
			permissionCheck: 'system'
		},
		{
			title: 'Documentation',
			url: '/admin/docs',
			icon: BookOpenIcon,
			items: [
				{
					title: 'Introduction',
					url: '/admin/docs/introduction'
				},
				{
					title: 'Get Started',
					url: '/admin/docs/getting-started'
				},
				{
					title: 'Tutorials',
					url: '/admin/docs/tutorials'
				},
				{
					title: 'Changelog',
					url: '/admin/docs/changelog'
				}
			],
			requiresPermission: false // Documentation is always accessible
		},
		{
			title: 'Notifications',
			url: '/admin/notifications',
			icon: BellIcon,
			items: [
				{ title: 'User Notifications', url: '/admin/notifications/user' },
				{ title: 'System Alerts', url: '/admin/notifications/system' },
				{ title: 'Email Templates', url: '/admin/notifications/templates' }
			],
			requiresPermission: false // Basic notifications accessible to all admin users
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
			],
			requiresPermission: true,
			permissionCheck: 'system'
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
			],
			requiresPermission: false // Support is accessible to all admin users
		}
	];

	// Teams data (unchanged)
	const teams = [
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
	];
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth/auth-client';
	import { 
		canAccessAdminSection, 
		loadUserPermissions, 
		permissionsLoading 
	} from '$lib/auth/rbac-client';
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import TeamSwitcher from './team-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { LightSwitch } from '$lib/components/ui/light-switch';

	const session = authClient.useSession();

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

	// Load user permissions on mount
	onMount(() => {
		loadUserPermissions();
	});

	// Check if user is admin (Better Auth role) - with loading state handling
	const isUserAdmin = $derived(() => {
		// Wait for session to load
		if (!$session.data) {
			return false;
		}
		
		return $session.data.user?.role === 'admin';
	});

	// Permission checks for each admin section (only used for non-admin users)
	const canAccessContent = canAccessAdminSection('content');
	const canAccessMedia = canAccessAdminSection('media');
	const canAccessSystem = canAccessAdminSection('system');
	const canAccessUsers = canAccessAdminSection('users');
	const canAccessRoles = canAccessAdminSection('roles');
	const canAccessAudit = canAccessAdminSection('audit');

	// Reactive navigation that filters based on permissions
	const data = $derived(() => {
		const adminStatus = isUserAdmin();
		
		// Show all navigation items if user is admin
		if (adminStatus) {
			return {
				teams,
				navMain: baseNavigation
			};
		}
		
		// For non-admin users, filter based on permissions
		const filteredNav = baseNavigation.filter(item => {
			if (!item.requiresPermission) return true;
			
			// Hide during loading for non-admins
			if ($permissionsLoading) return false;
			
			switch (item.permissionCheck) {
				case 'content':
					return $canAccessContent;
				case 'media':
					return $canAccessMedia;
				case 'system':
					return $canAccessSystem;
				case 'users':
					return $canAccessUsers;
				case 'roles':
					return $canAccessRoles;
				case 'audit':
					return $canAccessAudit;
				default:
					return false;
			}
		});
		
		return {
			teams,
			navMain: filteredNav
		};
	});

	$effect(() => {
		user.name = $session.data?.user?.name || '';
		user.email = $session.data?.user?.email || '';
		user.avatar = $session.data?.user?.image || '';
	});
</script>

<Sidebar.Root 
	{collapsible} 
	{...restProps}
	role="navigation"
	aria-label="Main navigation sidebar"
>
	<Sidebar.Header>
		<TeamSwitcher teams={data().teams} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data().navMain} />
	</Sidebar.Content>
	<Sidebar.Footer role="contentinfo" aria-label="User settings and profile">
		<LightSwitch />
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
