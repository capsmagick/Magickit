<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import { 
		Plus, 
		Trash2, 
		GripVertical, 
		Type, 
		Hash, 
		Calendar, 
		ToggleLeft,
		Image,
		Video,
		List,
		Mail,
		Link,
		FileText,
		Loader2
	} from '@lucide/svelte';
	import type { ContentType, ContentField } from '$lib/db/models';
	import { CONTENT_FIELD_TYPES } from '$lib/db/models';

	interface Props {
		contentType?: ContentType;
		onSubmit: (data: any) => void;
		onCancel: () => void;
		submitting: boolean;
	}

	let { contentType, onSubmit, onCancel, submitting }: Props = $props();

	// Form state
	let formData = $state({
		name: contentType?.name || '',
		slug: contentType?.slug || '',
		description: contentType?.description || '',
		fields: contentType?.fields || []
	});

	// Field type icons
	const fieldTypeIcons: Record<string, any> = {
		text: Type,
		textarea: FileText,
		richtext: FileText,
		number: Hash,
		date: Calendar,
		boolean: ToggleLeft,
		image: Image,
		video: Video,
		select: List,
		multiselect: List,
		email: Mail,
		url: Link
	};

	// Generate slug from name
	function generateSlug() {
		if (!formData.name) return;
		
		const slug = formData.name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '');
		
		formData.slug = slug;
	}

	// Add new field
	function addField() {
		const newField: Partial<ContentField> = {
			name: '',
			label: '',
			type: 'text',
			required: false,
			order: formData.fields.length
		};
		formData.fields = [...formData.fields, newField as ContentField];
	}

	// Remove field
	function removeField(index: number) {
		formData.fields = formData.fields.filter((_, i) => i !== index);
		// Update order for remaining fields
		formData.fields = formData.fields.map((field, i) => ({ ...field, order: i }));
	}

	// Move field up
	function moveFieldUp(index: number) {
		if (index === 0) return;
		const fields = [...formData.fields];
		[fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
		// Update order
		fields.forEach((field, i) => field.order = i);
		formData.fields = fields;
	}

	// Move field down
	function moveFieldDown(index: number) {
		if (index === formData.fields.length - 1) return;
		const fields = [...formData.fields];
		[fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
		// Update order
		fields.forEach((field, i) => field.order = i);
		formData.fields = fields;
	}

	// Generate field name from label
	function generateFieldName(field: ContentField, index: number) {
		if (!field.label) return;
		
		const name = field.label
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_+|_+$/g, '');
		
		formData.fields[index].name = name;
	}

	// Add option to select field
	function addOption(fieldIndex: number) {
		const field = formData.fields[fieldIndex];
		if (!field.options) field.options = [];
		field.options = [...field.options, ''];
	}

	// Remove option from select field
	function removeOption(fieldIndex: number, optionIndex: number) {
		const field = formData.fields[fieldIndex];
		if (field.options) {
			field.options = field.options.filter((_, i) => i !== optionIndex);
		}
	}

	// Validate form
	function validateForm() {
		const errors: string[] = [];

		if (!formData.name.trim()) {
			errors.push('Name is required');
		}

		if (!formData.slug.trim()) {
			errors.push('Slug is required');
		}

		// Validate slug format
		if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
			errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
		}

		// Validate fields
		formData.fields.forEach((field, index) => {
			if (!field.name?.trim()) {
				errors.push(`Field ${index + 1}: Name is required`);
			}
			if (!field.label?.trim()) {
				errors.push(`Field ${index + 1}: Label is required`);
			}
			if (!field.type) {
				errors.push(`Field ${index + 1}: Type is required`);
			}

			// Validate select field options
			if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
				errors.push(`Field ${index + 1}: Select fields must have at least one option`);
			}
		});

		// Check for duplicate field names
		const fieldNames = formData.fields.map(f => f.name?.toLowerCase()).filter(Boolean);
		const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
		if (duplicateNames.length > 0) {
			errors.push(`Duplicate field names: ${duplicateNames.join(', ')}`);
		}

		return errors;
	}

	// Handle form submission
	function handleSubmit() {
		const errors = validateForm();
		if (errors.length > 0) {
			toast.error(`Validation failed: ${errors[0]}`);
			return;
		}

		onSubmit(formData);
	}
</script>

<div class="space-y-6">
	<!-- Basic Information -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Basic Information</Card.Title>
			<Card.Description>
				Define the basic properties of your content type.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="name">Name *</Label>
					<Input
						id="name"
						bind:value={formData.name}
						placeholder="e.g., Blog Post, Product, Page"
						onblur={generateSlug}
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="slug">Slug *</Label>
					<Input
						id="slug"
						bind:value={formData.slug}
						placeholder="e.g., blog-post, product, page"
						disabled={submitting}
					/>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					bind:value={formData.description}
					placeholder="Describe what this content type is used for..."
					disabled={submitting}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Fields -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title>Fields</Card.Title>
					<Card.Description>
						Define the fields that content of this type will have.
					</Card.Description>
				</div>
				<Button onclick={addField} variant="outline" size="sm" class="gap-2" disabled={submitting}>
					<Plus class="h-4 w-4" />
					Add Field
				</Button>
			</div>
		</Card.Header>
		<Card.Content>
			{#if formData.fields.length === 0}
				<div class="text-center py-8">
					<FileText class="mx-auto h-12 w-12 text-muted-foreground/50" />
					<h3 class="mt-4 text-lg font-semibold">No fields defined</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Add fields to define the structure of your content type.
					</p>
					<Button onclick={addField} class="mt-4 gap-2" disabled={submitting}>
						<Plus class="h-4 w-4" />
						Add First Field
					</Button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each formData.fields as field, index}
						<Card.Root class="border-dashed">
							<Card.Header class="pb-3">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<GripVertical class="h-4 w-4 text-muted-foreground cursor-move" />
										<Badge variant="outline" class="gap-1">
											{#if fieldTypeIcons[field.type]}
												{@const IconComponent = fieldTypeIcons[field.type]}
												<IconComponent class="h-3 w-3" />
											{/if}
											{CONTENT_FIELD_TYPES[field.type] || field.type}
										</Badge>
										{#if field.required}
											<Badge variant="secondary" class="text-xs">Required</Badge>
										{/if}
									</div>
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => moveFieldUp(index)}
											disabled={index === 0 || submitting}
											class="h-8 w-8"
										>
											↑
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => moveFieldDown(index)}
											disabled={index === formData.fields.length - 1 || submitting}
											class="h-8 w-8"
										>
											↓
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => removeField(index)}
											disabled={submitting}
											class="h-8 w-8 text-destructive hover:text-destructive"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
							</Card.Header>
							<Card.Content class="space-y-4">
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="space-y-2">
										<Label>Label *</Label>
										<Input
											bind:value={field.label}
											placeholder="e.g., Title, Content, Featured Image"
											onblur={() => generateFieldName(field, index)}
											disabled={submitting}
										/>
									</div>
									<div class="space-y-2">
										<Label>Name *</Label>
										<Input
											bind:value={field.name}
											placeholder="e.g., title, content, featured_image"
											disabled={submitting}
										/>
									</div>
									<div class="space-y-2">
										<Label>Type *</Label>
										<Select.Root
											selected={{ value: field.type, label: CONTENT_FIELD_TYPES[field.type] || field.type }}
											onSelectedChange={(selected) => {
												if (selected) {
													field.type = selected.value;
												}
											}}
											disabled={submitting}
										>
											<Select.Trigger>
												<Select.Value />
											</Select.Trigger>
											<Select.Content>
												{#each Object.entries(CONTENT_FIELD_TYPES) as [value, label]}
													<Select.Item {value}>{label}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label>Placeholder</Label>
										<Input
											bind:value={field.placeholder}
											placeholder="Placeholder text for this field"
											disabled={submitting}
										/>
									</div>
									<div class="space-y-2">
										<Label>Help Text</Label>
										<Input
											bind:value={field.helpText}
											placeholder="Additional help text for users"
											disabled={submitting}
										/>
									</div>
								</div>

								<!-- Options for select fields -->
								{#if field.type === 'select' || field.type === 'multiselect'}
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<Label>Options *</Label>
											<Button
												onclick={() => addOption(index)}
												variant="outline"
												size="sm"
												class="gap-2"
												disabled={submitting}
											>
												<Plus class="h-3 w-3" />
												Add Option
											</Button>
										</div>
										{#if field.options && field.options.length > 0}
											<div class="space-y-2">
												{#each field.options as option, optionIndex}
													<div class="flex items-center gap-2">
														<Input
															bind:value={field.options[optionIndex]}
															placeholder="Option value"
															disabled={submitting}
														/>
														<Button
															onclick={() => removeOption(index, optionIndex)}
															variant="ghost"
															size="icon"
															disabled={submitting}
															class="h-8 w-8 text-destructive hover:text-destructive"
														>
															<Trash2 class="h-4 w-4" />
														</Button>
													</div>
												{/each}
											</div>
										{:else}
											<p class="text-sm text-muted-foreground">No options defined. Add at least one option.</p>
										{/if}
									</div>
								{/if}

								<!-- Field settings -->
								<div class="flex items-center space-x-2">
									<Checkbox
										id={`required-${index}`}
										bind:checked={field.required}
										disabled={submitting}
									/>
									<Label for={`required-${index}`} class="text-sm">
										Required field
									</Label>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Actions -->
	<div class="flex items-center justify-end gap-2">
		<Button variant="outline" onclick={onCancel} disabled={submitting}>
			Cancel
		</Button>
		<Button onclick={handleSubmit} disabled={submitting} class="gap-2">
			{#if submitting}
				<Loader2 class="h-4 w-4 animate-spin" />
			{/if}
			{contentType ? 'Update' : 'Create'} Content Type
		</Button>
	</div>
</div>