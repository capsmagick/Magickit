import db from '$lib/db/dbClient';
import { ObjectId } from 'mongodb';
import type { ContactSubmission } from '$lib/db/models';

export class ContactSubmissionsCollection {
	private collection = db.collection<ContactSubmission>('contactSubmissions');

	async findById(id: string | ObjectId): Promise<ContactSubmission | null> {
		const objectId = typeof id === 'string' ? new ObjectId(id) : id;
		return await this.collection.findOne({ _id: objectId });
	}

	async create(submissionData: Omit<ContactSubmission, '_id'>): Promise<ContactSubmission> {
		const submission: ContactSubmission = {
			_id: new ObjectId(),
			...submissionData
		};
		
		await this.collection.insertOne(submission);
		return submission;
	}

	async updateStatus(
		id: string | ObjectId, 
		status: ContactSubmission['status'],
		respondedBy?: ObjectId
	): Promise<ContactSubmission | null> {
		const objectId = typeof id === 'string' ? new ObjectId(id) : id;
		
		const updateData: any = { status };
		if (status === 'replied') {
			updateData.respondedAt = new Date();
			if (respondedBy) {
				updateData.respondedBy = respondedBy;
			}
		}
		
		const result = await this.collection.findOneAndUpdate(
			{ _id: objectId },
			{ $set: updateData },
			{ returnDocument: 'after' }
		);
		
		return result;
	}

	async findAll(options: {
		status?: ContactSubmission['status'];
		limit?: number;
		skip?: number;
		sortBy?: 'submittedAt' | 'status';
		sortOrder?: 1 | -1;
	} = {}): Promise<ContactSubmission[]> {
		const {
			status,
			limit = 100,
			skip = 0,
			sortBy = 'submittedAt',
			sortOrder = -1
		} = options;

		const filter: any = {};
		if (status) {
			filter.status = status;
		}

		return await this.collection
			.find(filter)
			.sort({ [sortBy]: sortOrder })
			.skip(skip)
			.limit(limit)
			.toArray();
	}

	async findPaginated(
		page: number = 1,
		limit: number = 20,
		filter: any = {}
	) {
		const skip = (page - 1) * limit;
		
		const [items, total] = await Promise.all([
			this.collection
				.find(filter)
				.sort({ submittedAt: -1 })
				.skip(skip)
				.limit(limit)
				.toArray(),
			this.collection.countDocuments(filter)
		]);
		
		return {
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		};
	}

	async getStatusCounts(): Promise<Record<ContactSubmission['status'], number>> {
		const pipeline = [
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		];

		const results = await this.collection.aggregate(pipeline).toArray();
		
		const counts: Record<ContactSubmission['status'], number> = {
			new: 0,
			read: 0,
			replied: 0,
			closed: 0
		};

		results.forEach((result: any) => {
			if (result._id in counts) {
				counts[result._id as ContactSubmission['status']] = result.count;
			}
		});

		return counts;
	}

	async search(query: string, options: any = {}): Promise<ContactSubmission[]> {
		const searchFilter = {
			$or: [
				{ name: { $regex: query, $options: 'i' } },
				{ email: { $regex: query, $options: 'i' } },
				{ subject: { $regex: query, $options: 'i' } },
				{ message: { $regex: query, $options: 'i' } }
			]
		};
		
		return await this.collection
			.find(searchFilter)
			.sort({ submittedAt: -1 })
			.limit(options.limit || 50)
			.toArray();
	}

	async delete(id: string | ObjectId): Promise<boolean> {
		const objectId = typeof id === 'string' ? new ObjectId(id) : id;
		const result = await this.collection.deleteOne({ _id: objectId });
		return result.deletedCount > 0;
	}

	async count(filter: any = {}): Promise<number> {
		return await this.collection.countDocuments(filter);
	}
}

// Export singleton instance
export const contactSubmissionsCollection = new ContactSubmissionsCollection();