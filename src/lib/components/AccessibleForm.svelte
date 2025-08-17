<script lang="ts">
	import { generateId, announceToScreenReader } from '$lib/utils/accessibility';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { AlertCircle, CheckCircle } from '@lucide/svelte';

	interface FormField {
		id: string;
		name: string;
		label: string;
		type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'textarea' | 'select';
		value: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		autocomplete?: string;
		pattern?: string;
		minLength?: number;
		maxLength?: number;
		min?: number;
		max?: number;
		step?: number;
		options?: { value: string; label: string }[];
		validation?: (value: string) => string | null;
		helpText?: string;
	}

	interface Props {
		fields: FormField[];
		title?: string;
		description?: string;
		submitLabel?: string;
		isSubmitting?: boolean;
		onSubmit?: (data: Record<string, string>) => void | Promise<void>;
		children?: any;
	}

	let {
		fields = $bindable(),
		title,
		description,
		submitLabel = 'Submit',
		isSubmitting = false,
		onSubmit,
		children
	}: Props = $props();

	let formElement: HTMLFormElement;
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});
	let isValid = $derived(Object.keys(errors).length === 0);

	// Generate unique IDs for form elements
	const fieldIds = $derived(
		fields.reduce((acc, field) => {
			acc[field.name] = {
				input: generateId(`${field.name}-input`),
				error: generateId(`${field.name}-error`),
				help: generateId(`${field.name}-help`)
			};
			return acc;
		}, {} as Record<string, { input: string; error: string; help: string }>)
	);

	// Validate a single field
	function validateField(field: FormField): string | null {
		const value = field.value?.trim() || '';

		// Required validation
		if (field.required && !value) {
			return `${field.label} is required`;
		}

		// Skip other validations if field is empty and not required
		if (!value && !field.required) {
			return null;
		}

		// Type-specific validation
		switch (field.type) {
			case 'email':
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(value)) {
					return 'Please enter a valid email address';
				}
				break;
			case 'tel':
				const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
				if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
					return 'Please enter a valid phone number';
				}
				break;
			case 'url':
				try {
					new URL(value);
				} catch {
					return 'Please enter a valid URL';
				}
				break;
		}

		// Length validation
		if (field.minLength && value.length < field.minLength) {
			return `${field.label} must be at least ${field.minLength} characters`;
		}
		if (field.maxLength && value.length > field.maxLength) {
			return `${field.label} must be no more than ${field.maxLength} characters`;
		}

		// Pattern validation
		if (field.pattern && !new RegExp(field.pattern).test(value)) {
			return `${field.label} format is invalid`;
		}

		// Custom validation
		if (field.validation) {
			return field.validation(value);
		}

		return null;
	}

	// Validate all fields
	function validateForm(): boolean {
		const newErrors: Record<string, string> = {};

		fields.forEach(field => {
			const error = validateField(field);
			if (error) {
				newErrors[field.name] = error;
			}
		});

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle field blur (validation)
	function handleFieldBlur(field: FormField) {
		touched[field.name] = true;
		const error = validateField(field);
		
		if (error) {
			errors[field.name] = error;
			announceToScreenReader(`Error in ${field.label}: ${error}`, 'assertive');
		} else {
			delete errors[field.name];
			errors = { ...errors };
		}
	}

	// Handle field input (clear errors)
	function handleFieldInput(field: FormField) {
		if (errors[field.name]) {
			delete errors[field.name];
			errors = { ...errors };
		}
	}

	// Handle form submission
	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		// Mark all fields as touched
		fields.forEach(field => {
			touched[field.name] = true;
		});

		if (!validateForm()) {
			// Focus first error field
			const firstErrorField = fields.find(field => errors[field.name]);
			if (firstErrorField) {
				const errorElement = document.getElementById(fieldIds[firstErrorField.name].input);
				errorElement?.focus();
				announceToScreenReader(`Form has errors. Please correct them and try again.`, 'assertive');
			}
			return;
		}

		// Collect form data
		const formData = fields.reduce((acc, field) => {
			acc[field.name] = field.value;
			return acc;
		}, {} as Record<string, string>);

		try {
			await onSubmit?.(formData);
			announceToScreenReader('Form submitted successfully');
		} catch (error) {
			announceToScreenReader('Form submission failed. Please try again.', 'assertive');
		}
	}

	// Get ARIA attributes for field
	function getFieldAriaAttributes(field: FormField) {
		const ids = fieldIds[field.name];
		const attributes: Record<string, string> = {};

		if (field.required) {
			attributes['aria-required'] = 'true';
		}

		if (errors[field.name]) {
			attributes['aria-invalid'] = 'true';
			attributes['aria-describedby'] = ids.error;
		} else if (field.helpText) {
			attributes['aria-describedby'] = ids.help;
		}

		return attributes;
	}
</script>

<form
	bind:this={formElement}
	onsubmit={handleSubmit}
	novalidate
	class="space-y-6"
	aria-label={title}
>
	{#if title}
		<div class="space-y-2">
			<h2 class="text-2xl font-bold tracking-tight">{title}</h2>
			{#if description}
				<p class="text-muted-foreground">{description}</p>
			{/if}
		</div>
	{/if}

	{#each fields as field}
		<div class="space-y-2">
			<!-- Field Label -->
			<Label 
				for={fieldIds[field.name].input}
				class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
			>
				{field.label}
				{#if field.required}
					<span class="text-destructive ml-1" aria-label="required">*</span>
				{/if}
			</Label>

			<!-- Field Input -->
			{#if field.type === 'textarea'}
				<Textarea
					id={fieldIds[field.name].input}
					name={field.name}
					bind:value={field.value}
					placeholder={field.placeholder}
					disabled={field.disabled}
					autocomplete={field.autocomplete}
					minlength={field.minLength}
					maxlength={field.maxLength}
					onblur={() => handleFieldBlur(field)}
					oninput={() => handleFieldInput(field)}
					class="min-h-[80px] {errors[field.name] ? 'border-destructive focus:border-destructive' : ''}"
					{...getFieldAriaAttributes(field)}
				/>
			{:else if field.type === 'select'}
				<select
					id={fieldIds[field.name].input}
					name={field.name}
					bind:value={field.value}
					disabled={field.disabled}
					onblur={() => handleFieldBlur(field)}
					onchange={() => handleFieldInput(field)}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 {errors[field.name] ? 'border-destructive focus:border-destructive' : ''}"
					{...getFieldAriaAttributes(field)}
				>
					{#if field.placeholder}
						<option value="" disabled>{field.placeholder}</option>
					{/if}
					{#each field.options || [] as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			{:else}
				<Input
					id={fieldIds[field.name].input}
					name={field.name}
					type={field.type}
					bind:value={field.value}
					placeholder={field.placeholder}
					disabled={field.disabled}
					autocomplete={field.autocomplete}
					pattern={field.pattern}
					minlength={field.minLength}
					maxlength={field.maxLength}
					min={field.min}
					max={field.max}
					step={field.step}
					onblur={() => handleFieldBlur(field)}
					oninput={() => handleFieldInput(field)}
					class="{errors[field.name] ? 'border-destructive focus:border-destructive' : ''}"
					{...getFieldAriaAttributes(field)}
				/>
			{/if}

			<!-- Field Help Text -->
			{#if field.helpText && !errors[field.name]}
				<p 
					id={fieldIds[field.name].help}
					class="text-sm text-muted-foreground"
				>
					{field.helpText}
				</p>
			{/if}

			<!-- Field Error -->
			{#if errors[field.name] && touched[field.name]}
				<div 
					id={fieldIds[field.name].error}
					class="flex items-center gap-2 text-sm text-destructive"
					role="alert"
					aria-live="polite"
				>
					<AlertCircle class="h-4 w-4 shrink-0" />
					{errors[field.name]}
				</div>
			{/if}
		</div>
	{/each}

	<!-- Custom Content -->
	{#if children}
		<div class="space-y-4">
			{@render children()}
		</div>
	{/if}

	<!-- Submit Button -->
	<div class="flex items-center gap-4">
		<Button
			type="submit"
			disabled={isSubmitting || !isValid}
			class="min-w-[120px]"
		>
			{#if isSubmitting}
				<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
				Submitting...
			{:else}
				{submitLabel}
			{/if}
		</Button>

		{#if isValid && Object.keys(touched).length > 0}
			<div class="flex items-center gap-2 text-sm text-green-600">
				<CheckCircle class="h-4 w-4" />
				Form is valid
			</div>
		{/if}
	</div>
</form>

<style>
	/* Enhanced focus styles for better accessibility */
	:global(.form-field:focus-within) {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
		border-radius: 6px;
	}

	/* Error state styling */
	:global(.field-error input, .field-error textarea, .field-error select) {
		border-color: hsl(var(--destructive));
	}

	:global(.field-error input:focus, .field-error textarea:focus, .field-error select:focus) {
		border-color: hsl(var(--destructive));
		box-shadow: 0 0 0 1px hsl(var(--destructive));
	}
</style>