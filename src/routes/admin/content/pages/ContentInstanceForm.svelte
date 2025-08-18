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
		Loader2,
		Type,
		Hash,
		Calendar,
		ToggleLeft,
		Image,
		Video,
		List,
		Mail,
		Link,
		FileText
	} from '@lucide/svelte';
	import type { ContentType, ContentInstance, ContentField } from '$lib/db/models';
	import { CONTENT_FIELD_TYPES, CONTENT_STATUSES } from '$lib/db/models';

	interface Props {
		contentTypes: ContentType[];
		contentInstance?: ContentInstance;
		onSubmit: (data: any) => void;
		onCancel: () => void;
		submitting: boolean;
	}

	let { contentTypes, contentInstance, onSubmit, onCancel, submitting }: Props = $props();

	// Form state
	let formData = $state({
		contentTypeId: contentInstance?.contentTypeId?.toString() || '',
		title: contentInstance?.title || '',
		slug: contentInstance?.slug || '',
		status: contentInstance?.status || 'draft',
		data: contentInstance?.data || {},
		seo: {
			title: contentInstance?.seo?.title || '',
			description: contentInstance?.seo?.description || '',
			keywords: contentInstance?.seo?.keywords?.join(', ') || '',
			noIndex: contentInstance?.seo?.noIndex || false
		}
	});

	// Selected content type
	let selectedContentType: ContentType | null = $state(null);

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

	// Watch for content type changes
	$effect(() => {
		if (formData.contentTypeId) {
			selectedContentType = contentTypes.find(ct => ct._id.toString() === formData.contentTypeId) || null;
			
			// Initialize field data if not editing existing content
			if (!contentInstance && selectedContentType) {
				const newData: Record<string, any> = {};
				selectedContentType.fields.forEach(field => {
					if (field.defaultValue !== undefined) {
						newData[field.name] = field.defaultValue;
					} else {
						// Set appropriate default values based on field type
						switch (field.type) {
							case 'boolean':
								newData[field.name] = false;
								break;
							case 'multiselect':
								newData[field.name] = [];
								break;
							default:
								newData[field.name] = '';
						}
					}
				});
				formData.data = newData;
			}
		} else {
			selectedContentType = null;
		}
	});

	// Generate slug from title
	function generateSlug() {
		if (!formData.title) return;
		
		const slug = formData.title
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-+|-+$/g, '');
		
		formData.slug = slug;
	}

	// Handle field value changes
	function handleFieldChange(fieldName: string, value: any, fieldType: string) {
		// Convert value based on field type
		switch (fieldType) {
			case 'number':
				formData.data[fieldName] = value ? parseFloat(value) : null;
				break;
			case 'boolean':
				formData.data[fieldName] = Boolean(value);
				break;
			case 'date':
				formData.data[fieldName] = value ? new Date(value).toISOString() : null;
				break;
			case 'multiselect':
				// Handle multiselect as array
				if (Array.isArray(value)) {
					formData.data[fieldName] = value;
				} else {
					// Toggle single value in array
					const currentValues = formData.data[fieldName] || [];
					if (currentValues.includes(value)) {
						formData.data[fieldName] = currentValues.filter((v: any) => v !== value);
					} else {
						formData.data[fieldName] = [...currentValues, value];
					}
				}
				break;
			default:
				formData.data[fieldName] = value;
		}
	}

	// Validate form
	function validateForm() {
		const errors: string[] = [];

		if (!formData.contentTypeId) {
			errors.push('Content type is required');
		}

		if (!formData.title.trim()) {
			errors.push('Title is required');
		}

		if (!formData.slug.trim()) {
			errors.push('Slug is required');
		}

		// Validate slug format
		if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
			errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
		}

		// Validate required fields
		if (selectedContentType) {
			selectedContentType.fields.forEach(field => {
				if (field.required) {
					const value = formData.data[field.name];
					if (value === undefined || value === null || value === '' || 
						(Array.isArray(value) && value.length === 0)) {
						errors.push(`${field.label} is required`);
					}
				}
			});
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

		// Process SEO keywords
		const seoData = {
			...formData.seo,
			keywords: formData.seo.keywords 
				? formData.seo.keywords.split(',').map(k => k.trim()).filter(Boolean)
				: []
		};

		onSubmit({
			...formData,
			seo: seoData
		});
	}

	// Render field input based on type
	function renderFieldInput(field: ContentField) {
		const value = formData.data[field.name];
		
		switch (field.type) {
			case 'textarea':
				return `<Textarea
					bind:value={formData.data['${field.name}']}
					placeholder="${field.placeholder || ''}"
					disabled={submitting}
				/>`;
			
			case 'number':
				return `<Input
					type="number"
					bind:value={formData.data['${field.name}']}
					placeholder="${field.placeholder || ''}"
					disabled={submitting}
				/>`;
			
			case 'date':
				return `<Input
					type="datetime-local"
					bind:value={formData.data['${field.name}']}
					disabled={submitting}
				/>`;
			
			case 'email':
				return `<Input
					type="email"
					bind:value={formData.data['${field.name}']}
					placeholder="${field.placeholder || ''}"
					disabled={submitting}
				/>`;
			
			case 'url':
				return `<Input
					type="url"
					bind:value={formData.data['${field.name}']}
					placeholder="${field.placeholder || ''}"
					disabled={submitting}
				/>`;
			
			case 'boolean':
				return `<Checkbox
					bind:checked={formData.data['${field.name}']}
					disabled={submitting}
				/>`;
			
			default:
				return `<Input
					bind:value={formData.data['${field.name}']}
					placeholder="${field.placeholder || ''}"
					disabled={submitting}
				/>`;
		}
	}
</script>

<div class="space-y-6">
	<!-- Basic Information -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Basic Information</Card.Title>
			<Card.Description>
				Define the basic properties of your content.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="contentType">Content Type *</Label>
				<Select.Root
					selected={formData.contentTypeId ? { 
						value: formData.contentTypeId, 
						label: contentTypes.find(ct => ct._id.toString() === formData.contentTypeId)?.name || ''
					} : undefined}
					onSelectedChange={(selected) => {
						if (selected) {
							formData.contentTypeId = selected.value;
						}
					}}
					disabled={submitting || !!contentInstance}
				>
					<Select.Trigger>
						<Select.Value placeholder="Select content type" />
					</Select.Trigger>
					<Select.Content>
						{#each contentTypes as contentType}
							<Select.Item value={contentType._id.toString()}>
								{contentType.name}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="title">Title *</Label>
					<Input
						id="title"
						bind:value={formData.title}
						placeholder="Enter content title"
						onblur={generateSlug}
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="slug">Slug *</Label>
					<Input
						id="slug"
						bind:value={formData.slug}
						placeholder="content-slug"
						disabled={submitting}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="status">Status</Label>
				<Select.Root
					selected={{ value: formData.status, label: CONTENT_STATUSES[formData.status] }}
					onSelectedChange={(selected) => {
						if (selected) {
							formData.status = selected.value;
						}
					}}
					disabled={submitting}
				>
					<Select.Trigger>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						{#each Object.entries(CONTENT_STATUSES) as [value, label]}
							<Select.Item {value}>{label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Dynamic Fields -->
	{#if selectedContentType && selectedContentType.fields.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Content Fields</Card.Title>
				<Card.Description>
					Fill in the content data based on the selected content type.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				{#each selectedContentType.fields as field}
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<Label for={field.name}>
								{field.label}
								{#if field.required}
									<span class="text-destructive">*</span>
								{/if}
							</Label>
							<Badge variant="outline" class="gap-1 text-xs">
								{#if fieldTypeIcons[field.type]}
									{@const IconComponent = fieldTypeIcons[field.type]}
									<IconComponent class="h-3 w-3" />
								{/if}
								{CONTENT_FIELD_TYPES[field.type]}
							</Badge>
						</div>

						{#if field.type === 'text' || field.type === 'email' || field.type === 'url'}
							<Input
								bind:value={formData.data[field.name]}
								placeholder={field.placeholder || ''}
								disabled={submitting}
							/>
						{:else if field.type === 'textarea'}
							<Textarea
								bind:value={formData.data[field.name]}
								placeholder={field.placeholder || ''}
								disabled={submitting}
							/>
						{:else if field.type === 'number'}
							<Input
								type="number"
								bind:value={formData.data[field.name]}
								placeholder={field.placeholder || ''}
								disabled={submitting}
							/>
						{:else if field.type === 'date'}
							<Input
								type="datetime-local"
								bind:value={formData.data[field.name]}
								disabled={submitting}
							/>
						{:else if field.type === 'boolean'}
							<div class="flex items-center space-x-2">
								<Checkbox
									bind:checked={formData.data[field.name]}
									disabled={submitting}
								/>
								<Label class="text-sm font-normal">
									{field.helpText || `Enable ${field.label.toLowerCase()}`}
								</Label>
							</div>
						{:else if field.type === 'select'}
							<Select.Root
								selected={formData.data[field.name] ? {
									value: formData.data[field.name],
									label: formData.data[field.name]
								} : undefined}
								onSelectedChange={(selected) => {
									if (selected) {
										formData.data[field.name] = selected.value;
									}
								}}
								disabled={submitting}
							>
								<Select.Trigger>
									<Select.Value placeholder={field.placeholder || 'Select option'} />
								</Select.Trigger>
								<Select.Content>
									{#each field.options || [] as option}
										<Select.Item value={option}>{option}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{:else if field.type === 'multiselect'}
							<div class="space-y-2">
								{#each field.options || [] as option}
									<div class="flex items-center space-x-2">
										<Checkbox
											checked={(formData.data[field.name] || []).includes(option)}
											onCheckedChange={(checked) => {
												const currentValues = formData.data[field.name] || [];
												if (checked) {
													formData.data[field.name] = [...currentValues, option];
												} else {
													formData.data[field.name] = currentValues.filter((v: string) => v !== option);
												}
											}}
											disabled={submitting}
										/>
										<Label class="text-sm font-normal">{option}</Label>
									</div>
								{/each}
							</div>
						{:else}
							<Input
								bind:value={formData.data[field.name]}
								placeholder={field.placeholder || ''}
								disabled={submitting}
							/>
						{/if}

						{#if field.helpText}
							<p class="text-xs text-muted-foreground">{field.helpText}</p>
						{/if}
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- SEO Settings -->
	<Card.Root>
		<Card.Header>
			<Card.Title>SEO Settings</Card.Title>
			<Card.Description>
				Configure search engine optimization settings for this content.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="seoTitle">SEO Title</Label>
				<Input
					id="seoTitle"
					bind:value={formData.seo.title}
					placeholder="Leave empty to use content title"
					disabled={submitting}
				/>
			</div>
			<div class="space-y-2">
				<Label for="seoDescription">SEO Description</Label>
				<Textarea
					id="seoDescription"
					bind:value={formData.seo.description}
					placeholder="Brief description for search engines"
					disabled={submitting}
				/>
			</div>
			<div class="space-y-2">
				<Label for="seoKeywords">Keywords</Label>
				<Input
					id="seoKeywords"
					bind:value={formData.seo.keywords}
					placeholder="keyword1, keyword2, keyword3"
					disabled={submitting}
				/>
				<p class="text-xs text-muted-foreground">Separate keywords with commas</p>
			</div>
			<div class="flex items-center space-x-2">
				<Checkbox
					bind:checked={formData.seo.noIndex}
					disabled={submitting}
				/>
				<Label class="text-sm">
					No Index (prevent search engines from indexing this page)
				</Label>
			</div>
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
			{contentInstance ? 'Update' : 'Create'} Content
		</Button>
	</div>
</div>