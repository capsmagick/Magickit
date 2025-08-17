<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { KeyboardNavigation, announceToScreenReader } from '$lib/utils/accessibility';
	import { ChevronDown } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	interface DropdownItem {
		id: string;
		label: string;
		value: any;
		disabled?: boolean;
		separator?: boolean;
	}

	interface Props {
		items: DropdownItem[];
		value?: any;
		placeholder?: string;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'outline' | 'ghost';
		onSelect?: (item: DropdownItem) => void;
		children?: any;
	}

	let {
		items,
		value = $bindable(),
		placeholder = 'Select an option',
		disabled = false,
		size = 'md',
		variant = 'outline',
		onSelect,
		children
	}: Props = $props();

	let isOpen = $state(false);
	let triggerElement: HTMLElement;
	let menuElement: HTMLElement;
	let focusedIndex = $state(-1);
	let selectedItem = $derived(items.find(item => item.value === value));

	// Filter out separators for keyboard navigation
	let navigableItems = $derived(items.filter(item => !item.separator && !item.disabled));

	function toggleDropdown() {
		if (disabled) return;
		
		isOpen = !isOpen;
		focusedIndex = -1;

		if (isOpen) {
			announceToScreenReader(`Menu opened with ${navigableItems.length} options`);
			// Focus first item after DOM update
			setTimeout(() => {
				if (navigableItems.length > 0) {
					focusedIndex = 0;
				}
			}, 0);
		} else {
			announceToScreenReader('Menu closed');
			triggerElement?.focus();
		}
	}

	function selectItem(item: DropdownItem) {
		if (item.disabled) return;

		value = item.value;
		isOpen = false;
		focusedIndex = -1;
		
		onSelect?.(item);
		announceToScreenReader(`Selected ${item.label}`);
		
		// Return focus to trigger
		triggerElement?.focus();
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
			case ' ':
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					toggleDropdown();
				} else if (event.key === 'ArrowDown') {
					focusedIndex = Math.min(focusedIndex + 1, navigableItems.length - 1);
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (isOpen) {
					focusedIndex = Math.max(focusedIndex - 1, 0);
				}
				break;
			case 'Escape':
				if (isOpen) {
					event.preventDefault();
					isOpen = false;
					focusedIndex = -1;
				}
				break;
		}
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		const menuItems = Array.from(menuElement?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') || []) as HTMLElement[];
		
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
					selectItem(navigableItems[focusedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				isOpen = false;
				focusedIndex = -1;
				triggerElement?.focus();
				break;
			case 'Tab':
				// Close dropdown and let tab continue
				isOpen = false;
				focusedIndex = -1;
				break;
			default:
				// Handle arrow keys and typeahead
				const newIndex = KeyboardNavigation.handleArrowKeys(
					event,
					menuItems,
					focusedIndex,
					{ orientation: 'vertical', loop: true }
				);
				
				if (newIndex !== focusedIndex) {
					focusedIndex = newIndex;
				} else {
					// Try typeahead
					const typeaheadIndex = KeyboardNavigation.handleTypeahead(
						event,
						menuItems,
						focusedIndex,
						(item) => item.textContent || ''
					);
					if (typeaheadIndex !== focusedIndex) {
						focusedIndex = typeaheadIndex;
					}
				}
				break;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && !triggerElement?.contains(event.target as Node) && !menuElement?.contains(event.target as Node)) {
			isOpen = false;
			focusedIndex = -1;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Size classes
	const sizeClasses = {
		sm: 'h-8 px-2 text-sm',
		md: 'h-9 px-3',
		lg: 'h-10 px-4'
	};
</script>

<div class="relative inline-block text-left">
	<!-- Trigger Button -->
	<Button
		bind:this={triggerElement}
		{variant}
		{disabled}
		class="justify-between {sizeClasses[size]} min-w-[120px]"
		onclick={toggleDropdown}
		onkeydown={handleTriggerKeydown}
		aria-haspopup="menu"
		aria-expanded={isOpen}
		aria-label={selectedItem ? `Selected: ${selectedItem.label}` : placeholder}
	>
		<span class="truncate">
			{selectedItem?.label || placeholder}
		</span>
		<ChevronDown class="ml-2 h-4 w-4 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
	</Button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			bind:this={menuElement}
			class="absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
			role="menu"
			aria-orientation="vertical"
			aria-labelledby="dropdown-trigger"
			onkeydown={handleMenuKeydown}
			tabindex="-1"
		>
			{#each items as item, index}
				{#if item.separator}
					<div class="h-px bg-muted my-1" role="separator"></div>
				{:else}
					{@const navigableIndex = navigableItems.findIndex(navItem => navItem.id === item.id)}
					<button
						class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 {navigableIndex === focusedIndex ? 'bg-accent text-accent-foreground' : ''}"
						role="menuitem"
						aria-disabled={item.disabled}
						onclick={() => selectItem(item)}
						tabindex="-1"
					>
						{item.label}
						{#if item.value === value}
							<span class="ml-auto text-xs opacity-60" aria-label="Selected">✓</span>
						{/if}
					</button>
				{/if}
			{/each}

			{#if items.length === 0}
				<div class="px-2 py-1.5 text-sm text-muted-foreground">
					No options available
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Animation classes */
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes zoomIn {
		from { transform: scale(0.95); }
		to { transform: scale(1); }
	}

	.animate-in {
		animation: fadeIn 0.2s ease-out, zoomIn 0.2s ease-out;
	}

	.fade-in-0 {
		animation-fill-mode: forwards;
	}

	.zoom-in-95 {
		animation-fill-mode: forwards;
	}
</style>