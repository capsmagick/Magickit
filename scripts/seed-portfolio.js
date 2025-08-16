import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magickit';

const samplePortfolioItems = [
	{
		_id: new ObjectId(),
		title: 'E-commerce Platform',
		description: 'A modern e-commerce platform built with SvelteKit and Stripe integration. Features include product catalog, shopping cart, user authentication, and payment processing.',
		images: [
			'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=600&fit=crop'
		],
		technologies: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Stripe', 'MongoDB'],
		liveUrl: 'https://example-ecommerce.com',
		githubUrl: 'https://github.com/example/ecommerce-platform',
		featured: true,
		category: 'Web Application',
		createdAt: new Date('2024-01-15'),
		updatedAt: new Date('2024-01-15')
	},
	{
		_id: new ObjectId(),
		title: 'Task Management App',
		description: 'A collaborative task management application with real-time updates, team collaboration features, and project tracking capabilities.',
		images: [
			'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop'
		],
		technologies: ['React', 'Node.js', 'Socket.io', 'PostgreSQL', 'Docker'],
		liveUrl: 'https://example-tasks.com',
		githubUrl: 'https://github.com/example/task-manager',
		featured: true,
		category: 'Web Application',
		createdAt: new Date('2024-02-10'),
		updatedAt: new Date('2024-02-10')
	},
	{
		_id: new ObjectId(),
		title: 'Portfolio Website',
		description: 'A responsive portfolio website showcasing creative work with smooth animations and modern design principles.',
		images: [
			'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop'
		],
		technologies: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'Vercel'],
		liveUrl: 'https://example-portfolio.com',
		githubUrl: 'https://github.com/example/portfolio-site',
		featured: false,
		category: 'Website',
		createdAt: new Date('2024-03-05'),
		updatedAt: new Date('2024-03-05')
	},
	{
		_id: new ObjectId(),
		title: 'Mobile Banking App',
		description: 'A secure mobile banking application with biometric authentication, transaction history, and budget tracking features.',
		images: [
			'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop'
		],
		technologies: ['React Native', 'TypeScript', 'Firebase', 'Plaid API'],
		liveUrl: 'https://app.example-bank.com',
		featured: true,
		category: 'Mobile App',
		createdAt: new Date('2024-01-20'),
		updatedAt: new Date('2024-01-20')
	},
	{
		_id: new ObjectId(),
		title: 'Data Visualization Dashboard',
		description: 'An interactive dashboard for visualizing complex data sets with real-time updates and customizable charts.',
		images: [
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'
		],
		technologies: ['Vue.js', 'D3.js', 'Python', 'FastAPI', 'Redis'],
		liveUrl: 'https://dashboard.example.com',
		githubUrl: 'https://github.com/example/data-dashboard',
		featured: false,
		category: 'Dashboard',
		createdAt: new Date('2024-02-28'),
		updatedAt: new Date('2024-02-28')
	},
	{
		_id: new ObjectId(),
		title: 'Learning Management System',
		description: 'A comprehensive LMS platform with course creation, student progress tracking, and interactive learning modules.',
		images: [
			'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop'
		],
		technologies: ['Django', 'React', 'PostgreSQL', 'AWS', 'Docker'],
		liveUrl: 'https://learn.example.com',
		featured: true,
		category: 'Web Application',
		createdAt: new Date('2024-01-08'),
		updatedAt: new Date('2024-01-08')
	},
	{
		_id: new ObjectId(),
		title: 'Restaurant Booking System',
		description: 'A reservation management system for restaurants with table booking, menu management, and customer notifications.',
		images: [
			'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop'
		],
		technologies: ['Laravel', 'Vue.js', 'MySQL', 'Twilio', 'Stripe'],
		liveUrl: 'https://bookings.example-restaurant.com',
		githubUrl: 'https://github.com/example/restaurant-booking',
		featured: false,
		category: 'Web Application',
		createdAt: new Date('2024-03-12'),
		updatedAt: new Date('2024-03-12')
	},
	{
		_id: new ObjectId(),
		title: 'Fitness Tracking App',
		description: 'A mobile fitness application with workout tracking, progress monitoring, and social features for motivation.',
		images: [
			'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop'
		],
		technologies: ['Flutter', 'Dart', 'Firebase', 'HealthKit', 'Google Fit'],
		liveUrl: 'https://fitness.example.com',
		featured: false,
		category: 'Mobile App',
		createdAt: new Date('2024-02-15'),
		updatedAt: new Date('2024-02-15')
	},
	{
		_id: new ObjectId(),
		title: 'Real Estate Platform',
		description: 'A comprehensive real estate platform with property listings, virtual tours, and mortgage calculator integration.',
		images: [
			'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop'
		],
		technologies: ['Angular', 'Node.js', 'MongoDB', 'Mapbox', 'AWS S3'],
		liveUrl: 'https://realestate.example.com',
		githubUrl: 'https://github.com/example/real-estate-platform',
		featured: true,
		category: 'Web Application',
		createdAt: new Date('2024-01-25'),
		updatedAt: new Date('2024-01-25')
	},
	{
		_id: new ObjectId(),
		title: 'Social Media Analytics',
		description: 'An analytics platform for social media managers to track engagement, analyze trends, and schedule content.',
		images: [
			'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&h=600&fit=crop',
			'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop'
		],
		technologies: ['React', 'Express.js', 'MongoDB', 'Chart.js', 'Twitter API'],
		liveUrl: 'https://analytics.example.com',
		featured: false,
		category: 'Dashboard',
		createdAt: new Date('2024-03-01'),
		updatedAt: new Date('2024-03-01')
	}
];

async function seedPortfolioItems() {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();
		console.log('Connected to MongoDB');

		const db = client.db();
		const collection = db.collection('portfolioItems');

		// Clear existing portfolio items
		await collection.deleteMany({});
		console.log('Cleared existing portfolio items');

		// Insert sample portfolio items
		const result = await collection.insertMany(samplePortfolioItems);
		console.log(`Inserted ${result.insertedCount} portfolio items`);

		// Create indexes
		await collection.createIndex({ featured: 1 });
		await collection.createIndex({ category: 1 });
		await collection.createIndex({ technologies: 1 });
		await collection.createIndex({ createdAt: -1 });
		console.log('Created indexes for portfolio items');

		console.log('Portfolio seeding completed successfully!');
	} catch (error) {
		console.error('Error seeding portfolio items:', error);
		process.exit(1);
	} finally {
		await client.close();
	}
}

// Run the seeding function
seedPortfolioItems();