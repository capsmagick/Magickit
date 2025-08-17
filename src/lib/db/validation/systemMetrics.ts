import { z } from 'zod';
import type { SystemMetrics, SystemAlert, SystemHealthStatus } from '../models';

// CPU metrics schema
export const CPUMetricsSchema = z.object({
	usage: z.number().min(0).max(100, 'CPU usage must be between 0 and 100'),
	loadAverage: z.array(z.number().min(0)).length(3, 'Load average must have exactly 3 values'),
	cores: z.number().min(1, 'Number of cores must be at least 1')
});

// Memory metrics schema
export const MemoryMetricsSchema = z.object({
	used: z.number().min(0, 'Used memory must be non-negative'),
	total: z.number().min(1, 'Total memory must be greater than 0'),
	percentage: z.number().min(0).max(100, 'Memory percentage must be between 0 and 100'),
	available: z.number().min(0, 'Available memory must be non-negative')
});

// Disk metrics schema
export const DiskMetricsSchema = z.object({
	used: z.number().min(0, 'Used disk space must be non-negative'),
	total: z.number().min(1, 'Total disk space must be greater than 0'),
	percentage: z.number().min(0).max(100, 'Disk percentage must be between 0 and 100'),
	available: z.number().min(0, 'Available disk space must be non-negative')
});

// Network metrics schema
export const NetworkMetricsSchema = z.object({
	bytesIn: z.number().min(0, 'Bytes in must be non-negative'),
	bytesOut: z.number().min(0, 'Bytes out must be non-negative'),
	packetsIn: z.number().min(0, 'Packets in must be non-negative'),
	packetsOut: z.number().min(0, 'Packets out must be non-negative')
});

// Database metrics schema
export const DatabaseMetricsSchema = z.object({
	connections: z.number().min(0, 'Connections must be non-negative'),
	activeConnections: z.number().min(0, 'Active connections must be non-negative'),
	queryTime: z.number().min(0, 'Query time must be non-negative'),
	slowQueries: z.number().min(0, 'Slow queries must be non-negative'),
	operationsPerSecond: z.number().min(0, 'Operations per second must be non-negative')
});

// Application metrics schema
export const ApplicationMetricsSchema = z.object({
	responseTime: z.number().min(0, 'Response time must be non-negative'),
	errorRate: z.number().min(0).max(100, 'Error rate must be between 0 and 100'),
	requestsPerMinute: z.number().min(0, 'Requests per minute must be non-negative'),
	activeUsers: z.number().min(0, 'Active users must be non-negative'),
	uptime: z.number().min(0, 'Uptime must be non-negative')
});

// System metrics creation schema
export const SystemMetricsCreateSchema = z.object({
	timestamp: z.date(),
	cpu: CPUMetricsSchema,
	memory: MemoryMetricsSchema,
	disk: DiskMetricsSchema,
	network: NetworkMetricsSchema,
	database: DatabaseMetricsSchema,
	application: ApplicationMetricsSchema
});

// System alert creation schema
export const SystemAlertCreateSchema = z.object({
	type: z.enum(['info', 'warning', 'error', 'critical']),
	category: z.enum(['cpu', 'memory', 'disk', 'network', 'database', 'application', 'security']),
	title: z.string()
		.min(1, 'Alert title is required')
		.max(200, 'Alert title must be less than 200 characters'),
	message: z.string()
		.min(1, 'Alert message is required')
		.max(1000, 'Alert message must be less than 1000 characters'),
	metric: z.string()
		.min(1, 'Metric name is required')
		.max(100, 'Metric name must be less than 100 characters'),
	threshold: z.number(),
	currentValue: z.number(),
	severity: z.number().min(1).max(5, 'Severity must be between 1 and 5'),
	acknowledged: z.boolean().default(false),
	acknowledgedBy: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Acknowledged by ID must be a valid ObjectId')
		.optional(),
	acknowledgedAt: z.date().optional(),
	resolvedAt: z.date().optional()
});

// System alert update schema
export const SystemAlertUpdateSchema = z.object({
	acknowledged: z.boolean().optional(),
	acknowledgedBy: z.string()
		.regex(/^[0-9a-fA-F]{24}$/, 'Acknowledged by ID must be a valid ObjectId')
		.optional(),
	acknowledgedAt: z.date().optional(),
	resolvedAt: z.date().optional()
});

// System health status schema
export const SystemHealthStatusSchema = z.object({
	status: z.enum(['healthy', 'warning', 'critical', 'maintenance']),
	score: z.number().min(0).max(100, 'Health score must be between 0 and 100'),
	uptime: z.number().min(0, 'Uptime must be non-negative'),
	lastCheck: z.date(),
	services: z.object({
		database: z.enum(['healthy', 'warning', 'critical']),
		storage: z.enum(['healthy', 'warning', 'critical']),
		cache: z.enum(['healthy', 'warning', 'critical']),
		email: z.enum(['healthy', 'warning', 'critical'])
	}),
	activeAlerts: z.number().min(0, 'Active alerts must be non-negative'),
	criticalAlerts: z.number().min(0, 'Critical alerts must be non-negative')
});

// Metrics query schema
export const MetricsQuerySchema = z.object({
	startDate: z.date(),
	endDate: z.date(),
	interval: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).default('5m'),
	metrics: z.array(z.enum(['cpu', 'memory', 'disk', 'network', 'database', 'application'])).optional()
}).refine(
	(data) => data.endDate > data.startDate,
	{
		message: 'End date must be after start date',
		path: ['endDate']
	}
).refine(
	(data) => {
		// Limit query range based on interval
		const diffMs = data.endDate.getTime() - data.startDate.getTime();
		const diffHours = diffMs / (1000 * 60 * 60);
		
		switch (data.interval) {
			case '1m':
				return diffHours <= 24; // Max 24 hours for 1-minute intervals
			case '5m':
				return diffHours <= 168; // Max 7 days for 5-minute intervals
			case '15m':
				return diffHours <= 720; // Max 30 days for 15-minute intervals
			case '1h':
				return diffHours <= 2160; // Max 90 days for 1-hour intervals
			case '6h':
				return diffHours <= 8760; // Max 1 year for 6-hour intervals
			case '1d':
				return diffHours <= 26280; // Max 3 years for 1-day intervals
			default:
				return true;
		}
	},
	{
		message: 'Query range too large for selected interval',
		path: ['interval']
	}
);

// Alert query schema
export const AlertQuerySchema = z.object({
	type: z.enum(['info', 'warning', 'error', 'critical']).optional(),
	category: z.enum(['cpu', 'memory', 'disk', 'network', 'database', 'application', 'security']).optional(),
	acknowledged: z.boolean().optional(),
	resolved: z.boolean().optional(),
	severity: z.number().min(1).max(5).optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	sortBy: z.enum(['createdAt', 'severity', 'type']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Type exports
export type SystemMetricsCreateData = z.infer<typeof SystemMetricsCreateSchema>;
export type SystemAlertCreateData = z.infer<typeof SystemAlertCreateSchema>;
export type SystemAlertUpdateData = z.infer<typeof SystemAlertUpdateSchema>;
export type SystemHealthStatusData = z.infer<typeof SystemHealthStatusSchema>;
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;
export type AlertQuery = z.infer<typeof AlertQuerySchema>;
export type CPUMetricsData = z.infer<typeof CPUMetricsSchema>;
export type MemoryMetricsData = z.infer<typeof MemoryMetricsSchema>;
export type DiskMetricsData = z.infer<typeof DiskMetricsSchema>;
export type NetworkMetricsData = z.infer<typeof NetworkMetricsSchema>;
export type DatabaseMetricsData = z.infer<typeof DatabaseMetricsSchema>;
export type ApplicationMetricsData = z.infer<typeof ApplicationMetricsSchema>;

// Validation functions
export function validateSystemMetricsCreate(data: unknown): SystemMetricsCreateData {
	return SystemMetricsCreateSchema.parse(data);
}

export function validateSystemAlertCreate(data: unknown): SystemAlertCreateData {
	return SystemAlertCreateSchema.parse(data);
}

export function validateSystemAlertUpdate(data: unknown): SystemAlertUpdateData {
	return SystemAlertUpdateSchema.parse(data);
}

export function validateSystemHealthStatus(data: unknown): SystemHealthStatusData {
	return SystemHealthStatusSchema.parse(data);
}

export function validateMetricsQuery(data: unknown): MetricsQuery {
	return MetricsQuerySchema.parse(data);
}

export function validateAlertQuery(data: unknown): AlertQuery {
	return AlertQuerySchema.parse(data);
}

// Safe validation functions
export function safeValidateSystemMetricsCreate(data: unknown) {
	const result = SystemMetricsCreateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateSystemAlertCreate(data: unknown) {
	const result = SystemAlertCreateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateSystemAlertUpdate(data: unknown) {
	const result = SystemAlertUpdateSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateSystemHealthStatus(data: unknown) {
	const result = SystemHealthStatusSchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateMetricsQuery(data: unknown) {
	const result = MetricsQuerySchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}

export function safeValidateAlertQuery(data: unknown) {
	const result = AlertQuerySchema.safeParse(data);
	return {
		success: result.success,
		data: result.success ? result.data : null,
		errors: result.success ? null : result.error.errors
	};
}