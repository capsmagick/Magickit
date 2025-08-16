import { json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { BlogPostsCollection } from '$lib/db/collections/blogPosts.js';
import type { RequestHandler } from './$types.js';

/**
 * Sample blog posts for testing the blog functionality
 */
const samplePosts = [
	{
		title: 'Getting Started with Magickit Universal Template',
		slug: 'getting-started-with-magickit',
		excerpt: 'Learn how to use the Magickit universal template to build amazing web applications with SvelteKit, TypeScript, and modern tools.',
		content: `
			<h2>Welcome to Magickit</h2>
			<p>Magickit is a comprehensive universal web application template built with modern technologies. This template provides everything you need to build various types of web applications including SaaS platforms, e-commerce sites, blogs, and more.</p>
			
			<h3>Key Features</h3>
			<ul>
				<li>SvelteKit with Svelte 5 for reactive UI</li>
				<li>TypeScript for type safety</li>
				<li>Tailwind CSS 4 for styling</li>
				<li>shadcn-svelte components for consistent UI</li>
				<li>Better Auth for authentication</li>
				<li>MongoDB for data storage</li>
			</ul>
			
			<h3>Getting Started</h3>
			<p>To get started with Magickit, simply clone the repository and follow the setup instructions in the README file. The template comes with a complete authentication system, admin dashboard, and user management features out of the box.</p>
			
			<blockquote>
				<p>Magickit saves you weeks of development time by providing a solid foundation for your web applications.</p>
			</blockquote>
			
			<h3>What's Next?</h3>
			<p>Once you have the template set up, you can start customizing it to fit your specific needs. The modular architecture makes it easy to add new features and modify existing ones.</p>
		`,
		author: new ObjectId(),
		publishedAt: new Date('2024-01-15'),
		tags: ['tutorial', 'getting-started', 'sveltekit', 'typescript'],
		featured: true,
		status: 'published' as const
	},
	{
		title: 'Building Modern Web Applications with SvelteKit',
		slug: 'building-modern-web-apps-sveltekit',
		excerpt: 'Discover the power of SvelteKit for building fast, modern web applications with excellent developer experience and performance.',
		content: `
			<h2>Why SvelteKit?</h2>
			<p>SvelteKit is a powerful framework for building web applications that combines the simplicity of Svelte with the capabilities needed for production applications.</p>
			
			<h3>Performance Benefits</h3>
			<p>SvelteKit applications are incredibly fast because Svelte compiles your components to vanilla JavaScript at build time, eliminating the need for a virtual DOM.</p>
			
			<h3>Developer Experience</h3>
			<p>The developer experience with SvelteKit is exceptional. Features like hot module replacement, TypeScript support, and intuitive routing make development a joy.</p>
			
			<h3>Full-Stack Capabilities</h3>
			<p>SvelteKit isn't just for frontend development. It includes server-side rendering, API routes, and deployment adapters for various platforms.</p>
			
			<pre><code>// Example SvelteKit API route
export async function GET({ params }) {
  const data = await fetchData(params.id);
  return new Response(JSON.stringify(data));
}</code></pre>
			
			<p>This makes SvelteKit perfect for building full-stack applications with a single framework.</p>
		`,
		author: new ObjectId(),
		publishedAt: new Date('2024-01-20'),
		tags: ['sveltekit', 'web-development', 'javascript', 'performance'],
		featured: true,
		status: 'published' as const
	},
	{
		title: 'TypeScript Best Practices for Web Development',
		slug: 'typescript-best-practices-web-development',
		excerpt: 'Learn essential TypeScript best practices that will help you write more maintainable and robust web applications.',
		content: `
			<h2>Why TypeScript?</h2>
			<p>TypeScript adds static type checking to JavaScript, helping you catch errors early and write more maintainable code.</p>
			
			<h3>Essential Best Practices</h3>
			
			<h4>1. Use Strict Mode</h4>
			<p>Always enable strict mode in your TypeScript configuration for better type safety.</p>
			
			<pre><code>{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}</code></pre>
			
			<h4>2. Define Clear Interfaces</h4>
			<p>Create clear, well-documented interfaces for your data structures.</p>
			
			<pre><code>interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}</code></pre>
			
			<h4>3. Use Type Guards</h4>
			<p>Implement type guards for runtime type checking.</p>
			
			<pre><code>function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}</code></pre>
			
			<h3>Conclusion</h3>
			<p>Following these TypeScript best practices will help you build more reliable and maintainable web applications.</p>
		`,
		author: new ObjectId(),
		publishedAt: new Date('2024-01-25'),
		tags: ['typescript', 'best-practices', 'web-development', 'coding'],
		featured: false,
		status: 'published' as const
	},
	{
		title: 'Tailwind CSS 4: What\'s New and Exciting',
		slug: 'tailwind-css-4-whats-new',
		excerpt: 'Explore the new features and improvements in Tailwind CSS 4 that make styling web applications even more efficient and enjoyable.',
		content: `
			<h2>Tailwind CSS 4 Overview</h2>
			<p>Tailwind CSS 4 brings significant improvements to the popular utility-first CSS framework, making it faster and more powerful than ever.</p>
			
			<h3>Key Improvements</h3>
			
			<h4>Performance Enhancements</h4>
			<p>The new version includes major performance improvements in build times and runtime efficiency.</p>
			
			<h4>New Utilities</h4>
			<p>Tailwind CSS 4 introduces new utility classes for modern CSS features like container queries and advanced grid layouts.</p>
			
			<h4>Better Developer Experience</h4>
			<p>Improved IntelliSense support and better error messages make development smoother.</p>
			
			<h3>Migration Guide</h3>
			<p>Upgrading to Tailwind CSS 4 is straightforward for most projects. The team has provided comprehensive migration guides and tools.</p>
			
			<h3>Getting Started</h3>
			<p>To start using Tailwind CSS 4 in your project:</p>
			
			<pre><code>npm install tailwindcss@next
npx tailwindcss init</code></pre>
			
			<p>Then configure your project according to the new best practices outlined in the documentation.</p>
		`,
		author: new ObjectId(),
		publishedAt: new Date('2024-02-01'),
		tags: ['tailwind-css', 'css', 'styling', 'web-design'],
		featured: false,
		status: 'published' as const
	},
	{
		title: 'Authentication and Security in Modern Web Apps',
		slug: 'authentication-security-modern-web-apps',
		excerpt: 'Learn about implementing secure authentication and authorization in modern web applications using Better Auth and best practices.',
		content: `
			<h2>Modern Authentication Challenges</h2>
			<p>Building secure authentication systems is crucial for modern web applications. Users expect seamless experiences while maintaining the highest security standards.</p>
			
			<h3>Better Auth Integration</h3>
			<p>Better Auth provides a comprehensive solution for authentication in web applications, supporting multiple providers and security features.</p>
			
			<h4>Key Features</h4>
			<ul>
				<li>Multiple authentication providers (email, OAuth, etc.)</li>
				<li>Role-based access control (RBAC)</li>
				<li>Session management</li>
				<li>Security best practices built-in</li>
			</ul>
			
			<h3>Security Best Practices</h3>
			
			<h4>1. Use HTTPS Everywhere</h4>
			<p>Always use HTTPS in production to protect user credentials and session data.</p>
			
			<h4>2. Implement Proper Session Management</h4>
			<p>Use secure session cookies with appropriate expiration times and security flags.</p>
			
			<h4>3. Add Rate Limiting</h4>
			<p>Protect against brute force attacks by implementing rate limiting on authentication endpoints.</p>
			
			<h4>4. Validate Input</h4>
			<p>Always validate and sanitize user input to prevent injection attacks.</p>
			
			<h3>Implementation Example</h3>
			<pre><code>// Better Auth configuration
export const auth = new BetterAuth({
  database: mongoAdapter,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  }
});</code></pre>
			
			<h3>Conclusion</h3>
			<p>Implementing secure authentication requires careful consideration of many factors. Using proven solutions like Better Auth can help you build secure applications faster.</p>
		`,
		author: new ObjectId(),
		publishedAt: new Date('2024-02-05'),
		tags: ['authentication', 'security', 'better-auth', 'web-security'],
		featured: true,
		status: 'published' as const
	}
];

export const POST: RequestHandler = async () => {
	try {
		console.log('Seeding blog posts...');
		
		const results = [];
		
		for (const postData of samplePosts) {
			try {
				// Check if post already exists
				const existingPost = await BlogPostsCollection.findBySlug(postData.slug);
				if (existingPost) {
					console.log(`Post "${postData.title}" already exists, skipping...`);
					results.push({ title: postData.title, status: 'skipped', reason: 'already exists' });
					continue;
				}
				
				// Create the post
				const createdPost = await BlogPostsCollection.create(postData);
				console.log(`✓ Created post: "${createdPost.title}"`);
				results.push({ title: createdPost.title, status: 'created', id: createdPost._id.toString() });
			} catch (error) {
				console.error(`Error creating post "${postData.title}":`, error);
				results.push({ title: postData.title, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
			}
		}
		
		console.log('Blog posts seeding completed!');
		
		return json({
			success: true,
			message: 'Blog posts seeding completed',
			results
		});
	} catch (error) {
		console.error('Error seeding blog posts:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};