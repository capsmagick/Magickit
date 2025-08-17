<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { trapFocus, focusManager, announceToScreenReader } from '$lib/utils/accessibility';
	import { X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		closeOnEscape?: boolean;
		closeOnOverlayClick?: boolean;
		showCloseButton?: boolean;
		onClose?: () => void;
		children?: any;
	}

	let {
		open = $bindable(),
		title,
		description,
		size = 'md',
		closeOnEscape = true,
		closeOnOverlayClick = true,
		showCloseButton = true,
		onClose,
		children
	}: Props = $props();

	let modalElement: HTMLElement;
	let overlayElement: HTMLElement;
	let titleElement: HTMLElement;
	let cleanupFocusTrap: (() => void) | null = null;

	// Size classes
	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		full: 'max-w-full mx-4'
	};

	// Handle modal open/close
	$effect(() => {
		if (open) {
			openModal();
		} else {
			closeModal();
		}
	});

	function openModal() {
		if (typeof document === 'undefined') return;

		// Prevent body scroll
		document.body.style.overflow = 'hidden';
		
		// Announce modal opening
		announceToScreenReader(`${title} dialog opened`, 'assertive');

		// Set up focus trap after DOM update
		setTimeout(() => {
			if (modalElement) {
				cleanupFocusTrap = trapFocus(modalElement);
			}
		}, 0);
	}

	function closeModal() {
		if (typeof document === 'undefined') return;

		// Restore body scroll
		document.body.style.overflow = '';
		
		// Clean up focus trap
		if (cleanupFocusTrap) {
			cleanupFocusTrap();
			cleanupFocusTrap = null;
		}

		// Return focus to trigger element
		focusManager.returnFocus();
		
		// Announce modal closing
		announceToScreenReader(`${title} dialog closed`);
	}

	function handleClose() {
		open = false;
		onClose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) {
			event.preventDefault();
			handleClose();
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (closeOnOverlayClick && event.target === overlayElement) {
			handleClose();
		}
	}

	// Cleanup on destroy
	onDestroy(() => {
		if (cleanupFocusTrap) {
			cleanupFocusTrap();
		}
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});
</script>

{#if open}
	<!-- Modal Overlay -->
	<div
		bind:this={overlayElement}
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
		onclick={handleOverlayClick}
		onkeydown={handleKeydown}
		role="presentation"
	>
		<!-- Modal Container -->
		<div class="fixed inset-0 flex items-center justify-center p-4">
			<!-- Modal Content -->
			<div
				bind:this={modalElement}
				class="relative bg-background border rounded-lg shadow-lg {sizeClasses[size]} w-full max-h-[90vh] overflow-hidden"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				aria-describedby={description ? "modal-description" : undefined}
				tabindex="-1"
			>
				<!-- Modal Header -->
				<div class="flex items-center justify-between p-6 border-b">
					<div class="space-y-1">
						<h2 
							bind:this={titleElement}
							id="modal-title" 
							class="text-lg font-semibold leading-none tracking-tight"
						>
							{title}
						</h2>
						{#if description}
							<p id="modal-description" class="text-sm text-muted-foreground">
								{description}
							</p>
						{/if}
					</div>
					
					{#if showCloseButton}
						<Button
							variant="ghost"
							size="icon"
							onclick={handleClose}
							aria-label="Close dialog"
							class="h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							<X class="h-4 w-4" />
						</Button>
					{/if}
				</div>

				<!-- Modal Body -->
				<div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
					{@render children?.()}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal is above everything else */
	:global(body:has(.modal-open)) {
		overflow: hidden;
	}

	/* Focus styles for better accessibility */
	:global(.modal-content *:focus) {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	/* Smooth animations */
	.fixed {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.relative {
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>