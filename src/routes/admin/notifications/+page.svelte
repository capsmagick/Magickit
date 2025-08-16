<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to user notifications page
	onMount(() => {
		goto('/admin/notifications/user', { replaceState: true });
	});


</script>

<!-- This page redirects to /admin/notifications/user -->
