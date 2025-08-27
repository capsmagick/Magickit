<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Construction, 
		ArrowLeft, 
		Calendar, 
		Bell,
		Lightbulb,
		Mail
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	interface Props {
		title: string;
		description?: string;
		features?: string[];
		estimatedDate?: string;
		backUrl?: string;
		backLabel?: string;
		showNotifyButton?: boolean;
		priority?: 'high' | 'medium' | 'low';
	}

	let {
		title,
		description = 'This feature is currently under development and will be available soon.',
		features = [],
		estimatedDate,
		backUrl = '/admin',
		backLabel = 'Back to Dashboard',
		showNotifyButton = true,
		priority = 'medium'
	}: Props = $props();

	function handleGoBack() {
		goto(backUrl);
	}

	function handleNotifyMe() {
		// This would typically integrate with a notification system
		alert('You will be notified when this feature is available!');
	}

	function getPriorityBadge(priority: string) {
		switch (priority) {
			case 'high':
				return { variant: 'default' as const, text: 'High Priority', color: 'text-green-600' };
			case 'medium':
				return { variant: 'secondary' as const, text: 'Medium Priority', color: 'text-yellow-600' };
			case 'low':
				return { variant: 'outline' as const, text: 'Low Priority', color: 'text-blue-600' };
			default:
				return { variant: 'outline' as const, text: 'Planned', color: 'text-gray-600' };
		}
	}

	const priorityInfo = $derived(getPriorityBadge(priority));
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-2xl mx-auto text-center space-y-8">
		<!-- Icon and Status -->
		<div class="space-y-4">
			<div class="flex justify-center">
				<div class="p-6 rounded-lg bg-orange-100 dark:bg-orange-900/20">
					<Construction class="h-16 w-16 text-orange-600" />
				</div>
			</div>
			
			<div class="space-y-2">
				<Badge variant={priorityInfo.variant} class="mb-2">
					{priorityInfo.text}
				</Badge>
				<h1 class="text-3xl font-bold tracking-tight">
					{title}
				</h1>
				<p class="text-lg text-muted-foreground">
					{description}
				</p>
			</div>
		</div>

		<!-- Coming Soon Card -->
		<Card class="text-left">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Lightbulb class="h-5 w-5 text-yellow-500" />
					What's Coming
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if features.length > 0}
					<div class="space-y-2">
						<h4 class="font-medium">Planned Features:</h4>
						<ul class="space-y-1 text-sm text-muted-foreground">
							{#each features as feature}
								<li class="flex items-start gap-2">
									<span class="text-primary mt-1">•</span>
									{feature}
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if estimatedDate}
					<div class="flex items-center gap-2 text-sm">
						<Calendar class="h-4 w-4 text-primary" />
						<span class="font-medium">Estimated Release:</span>
						<span class="text-muted-foreground">{estimatedDate}</span>
					</div>
				{/if}

				<div class="pt-4 border-t border-border">
					<p class="text-sm text-muted-foreground">
						We're working hard to bring you this feature. Thank you for your patience!
					</p>
				</div>
			</CardContent>
		</Card>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button onclick={handleGoBack} class="transition-colors duration-200">
				<ArrowLeft class="mr-2 h-4 w-4" />
				{backLabel}
			</Button>
			
			{#if showNotifyButton}
				<Button variant="outline" onclick={handleNotifyMe} class="transition-colors duration-200">
					<Bell class="mr-2 h-4 w-4" />
					Notify Me When Ready
				</Button>
			{/if}
		</div>

		<!-- Help Section -->
		<Card class="bg-muted/50">
			<CardContent class="p-6 text-center space-y-4">
				<Mail class="h-8 w-8 mx-auto text-primary" />
				<div class="space-y-2">
					<h3 class="font-semibold">Need This Feature Urgently?</h3>
					<p class="text-sm text-muted-foreground">
						Contact our team to discuss priority development or alternative solutions.
					</p>
				</div>
				<Button variant="outline" onclick={() => goto('/admin/support/contact')} class="transition-colors duration-200">
					<Mail class="mr-2 h-4 w-4" />
					Contact Support
				</Button>
			</CardContent>
		</Card>
	</div>
</div>