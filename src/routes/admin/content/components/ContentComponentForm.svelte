<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
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
		FileText,
		Package
	} from '@lucide/svelte';
	import type { ContentType, ContentInstance, ContentField } from '$lib/db/models';
	import { CONTENT_FIELD_TYPES } from '$lib/db/models';

	interface Props {
		contentTypes: ContentType[];
		categoryOptions: Array<{ value: string; label: string }>;
		contentComponent?: ContentInstance;
		onSubmit: (data: any) => void;
		onCancel: () => void;
		submitting: boolean;
	}

	let { contentTypes, categoryOptions, contentComponent, onSubmit, onCancel, submitting }: Props = $props();

	// Form state
	let formData = $state({
		contentTypeId: contentComponent?.contentTypeId?.toString() || '',
		title: contentComponent?.title || '',
		slug: contentComponent?.slug || '',
		category: contentComponent?.data?.category || 'content',
		description: contentComponent?.data?.description || '',
		data: contentComponent?.data || {},
		seo: {
			title: contentComponent?.seo?.title || '',
			description: contentComponent?.seo?.description || '',
			keywords: contentComponent?.seo?.keywords?.join(', ') || '',
			noIndex: contentComponent?.seo?.noIndex || false
		},
		// Component-specific fields
		tags: contentComponent?.data?.componentMetadata?.tags?.join(', ') || '',
		difficulty: contentComponent?.data?.componentMetadata?.difficulty || 'beginner',
		documentation: contentComponent?.data?.componentMetadata?.documentation || '',
		compatibility: contentComponent?.data?.componentMetadata?.compatibility?.join(', ') || '',
		dependencies: contentComponent?.data?.componentMetadata?.dependencies?.join(', ') || '',
		changeNote: '',
		changeType: 'minor',
		isBreakingChange: false
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
			
			// Initialize field data if not editing existing component
			if (!contentComponent && selectedContentType) {
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
				formData.data = { ...newData, isComponent: true, category: formData.category };
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
		
		formData.slug = `component-${slug}`;
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
			errors.push('Component name is required');
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

		// Ensure component-specific data
		const componentData = {
			...formData.data,
			isComponent: true,
			category: formData.category,
			description: formData.description
		};

		// Process component metadata
		const componentMetadata = {
			category: formData.category,
			tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
			difficulty: formData.difficulty,
			documentation: formData.documentation,
			compatibility: formData.compatibility ? formData.compatibility.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
			dependencies: formData.dependencies ? formData.dependencies.split(',').map((d: string) => d.trim()).filter(Boolean) : []
		};

		onSubmit({
			...formData,
			data: componentData,
			seo: seoData,
			status: 'published', // Components are typically published by default
			tags: componentMetadata.tags,
			difficulty: componentMetadata.difficulty,
			documentation: componentMetadata.documentation,
			compatibility: componentMetadata.compatibility,
			dependencies: componentMetadata.dependencies,
			changeNote: formData.changeNote,
			changeType: formData.changeType,
			isBreakingChange: formData.isBreakingChange
		});
	}
</script>

<div class="space-y-6">
	<!-- @ts-nocheck -->
	<!-- Basic Information -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Package class="h-5 w-5" />
				Component Information
			</Card.Title>
			<Card.Description>
				Define the basic properties of your reusable component.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="contentType">Content Type *</Label>
				<!-- @ts-ignore - Select component type definitions issue -->
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
					disabled={submitting || !!contentComponent}
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
					<Label for="title">Component Name *</Label>
					<Input
						id="title"
						bind:value={formData.title}
						placeholder="Enter component name"
						onblur={generateSlug}
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="slug">Slug *</Label>
					<Input
						id="slug"
						bind:value={formData.slug}
						placeholder="component-slug"
						disabled={submitting}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="category">Category</Label>
					<!-- @ts-ignore - Select component type definitions issue -->
					<Select.Root
						selected={{ value: formData.category, label: categoryOptions.find(cat => cat.value === formData.category)?.label || 'Content' }}
						onSelectedChange={(selected) => {
							if (selected) {
								formData.category = selected.value;
							}
						}}
						disabled={submitting}
					>
						<Select.Trigger>
							<Select.Value />
						</Select.Trigger>
						<Select.Content>
							{#each categoryOptions.filter(opt => opt.value !== '') as option}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					bind:value={formData.description}
					placeholder="Describe what this component does and how it should be used..."
					disabled={submitting}
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Component Metadata -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Package class="h-5 w-5" />
				Component Metadata
			</Card.Title>
			<Card.Description>
				Additional information about this component for better organization and usage tracking.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="tags">Tags</Label>
					<Input
						id="tags"
						bind:value={formData.tags}
						placeholder="react, button, interactive"
						disabled={submitting}
					/>
					<p class="text-xs text-muted-foreground">Separate tags with commas</p>
				</div>
				<div class="space-y-2">
					<Label for="difficulty">Difficulty Level</Label>
					<!-- @ts-ignore - Select component type definitions issue -->
					<Select.Root
						selected={{ value: formData.difficulty, label: formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1) }}
						onSelectedChange={(selected) => {
							if (selected) {
								formData.difficulty = selected.value;
							}
						}}
						disabled={submitting}
					>
						<Select.Trigger>
							<Select.Value />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="beginner">Beginner</Select.Item>
							<Select.Item value="intermediate">Intermediate</Select.Item>
							<Select.Item value="advanced">Advanced</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="compatibility">Compatibility</Label>
					<Input
						id="compatibility"
						bind:value={formData.compatibility}
						placeholder="svelte-5, tailwind-4"
						disabled={submitting}
					/>
					<p class="text-xs text-muted-foreground">Compatible frameworks/versions (comma-separated)</p>
				</div>
				<div class="space-y-2">
					<Label for="dependencies">Dependencies</Label>
					<Input
						id="dependencies"
						bind:value={formData.dependencies}
						placeholder="lucide-svelte, clsx"
						disabled={submitting}
					/>
					<p class="text-xs text-muted-foreground">Required dependencies (comma-separated)</p>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="documentation">Documentation</Label>
				<Textarea
					id="documentation"
					bind:value={formData.documentation}
					placeholder="Describe how to use this component, its props, and any special considerations..."
					rows={4}
					disabled={submitting}
				/>
			</div>

			{#if contentComponent}
				<div class="space-y-4 pt-4 border-t">
					<h4 class="font-medium">Version Control</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="changeType">Change Type</Label>
							<!-- @ts-ignore - Select component type definitions issue -->
							<Select.Root
								selected={{ value: formData.changeType, label: formData.changeType.charAt(0).toUpperCase() + formData.changeType.slice(1) }}
								onSelectedChange={(selected) => {
									if (selected) {
										formData.changeType = selected.value;
									}
								}}
								disabled={submitting}
							>
								<Select.Trigger>
									<Select.Value />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="patch">Patch (Bug fixes)</Select.Item>
									<Select.Item value="minor">Minor (New features)</Select.Item>
									<Select.Item value="major">Major (Breaking changes)</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="space-y-2">
							<div class="flex items-center space-x-2">
								<Checkbox
									bind:checked={formData.isBreakingChange}
									disabled={submitting}
								/>
								<Label class="text-sm">
									This is a breaking change
								</Label>
							</div>
							<p class="text-xs text-muted-foreground">
								Check if this update breaks compatibility with existing usage
							</p>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="changeNote">Change Notes</Label>
						<Textarea
							id="changeNote"
							bind:value={formData.changeNote}
							placeholder="Describe what changed in this version..."
							rows={2}
							disabled={submitting}
						/>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Dynamic Fields -->
	{#if selectedContentType && selectedContentType.fields.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Component Content</Card.Title>
				<Card.Description>
					Configure the content data for this component.
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
								{#if field.type === 'text'}
									<Type class="h-3 w-3" />
								{:else if field.type === 'textarea'}
									<FileText class="h-3 w-3" />
								{:else if field.type === 'richtext'}
									<FileText class="h-3 w-3" />
								{:else if field.type === 'number'}
									<Hash class="h-3 w-3" />
								{:else if field.type === 'date'}
									<Calendar class="h-3 w-3" />
								{:else if field.type === 'boolean'}
									<ToggleLeft class="h-3 w-3" />
								{:else if field.type === 'image'}
									<Image class="h-3 w-3" />
								{:else if field.type === 'video'}
									<Video class="h-3 w-3" />
								{:else if field.type === 'select'}
									<List class="h-3 w-3" />
								{:else if field.type === 'multiselect'}
									<List class="h-3 w-3" />
								{:else if field.type === 'email'}
									<Mail class="h-3 w-3" />
								{:else if field.type === 'url'}
									<Link class="h-3 w-3" />
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
							<!-- @ts-ignore - Select component type definitions issue -->
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
				Configure search engine optimization settings for this component when used on pages.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="seoTitle">SEO Title</Label>
				<Input
					id="seoTitle"
					bind:value={formData.seo.title}
					placeholder="Leave empty to use component name"
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
					No Index (prevent search engines from indexing pages using this component)
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
			{contentComponent ? 'Update' : 'Create'} Component
		</Button>
	</div>
</div>