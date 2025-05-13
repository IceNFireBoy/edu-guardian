import User, { IUser, IUserActivity } from '../models/User';
import Note from '../models/Note';
import ErrorResponse from '../utils/errorResponse';
import mongoose from 'mongoose';

interface ActivityFeedQueryOptions {
    page?: number;
    limit?: number;
    type?: string; // Filter by activity type
    filter?: 'my' | 'class' | 'global' | 'ai'; // Filter scope
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface ActivityFeedItem extends Partial<IUserActivity> {
    user: {
        _id: string;
        username: string;
        name: string;
        profileImage?: string;
    };
    itemType: 'activity' | 'badge' | 'note' | 'study' | 'ai';
    relatedData?: any; // Badge, Note, or other data related to this activity
    isNew?: boolean; // For highlighting new items
}

class UserActivityFeedService {
    /**
     * Get activity feed items for a user
     * Can include the user's own activities and/or global activities
     */
    public async getUserActivityFeed(
        userId: string, 
        options: ActivityFeedQueryOptions
    ): Promise<{
        items: ActivityFeedItem[];
        totalCount: number;
        hasMore: boolean;
    }> {
        const { 
            page = 1, 
            limit = 20, 
            filter = 'my', 
            type,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;
        
        const skip = (page - 1) * limit;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        
        // Define our base pipeline stages
        const matchStage: any = {};
        let userLookupNeeded = true;
        
        // Apply filter to determine whose activities to include
        switch (filter) {
            case 'my': // Only user's own activities
                // Query directly from user document 
                const user = await User.findById(userId)
                    .select('activity badges')
                    .populate({
                        path: 'badges.badge',
                        select: 'name description icon rarity'
                    })
                    .lean();
                
                if (!user) {
                    throw new ErrorResponse('User not found', 404);
                }
                
                // Process user's activity items
                const activities = this.processUserActivities(user, userId);
                
                // Sort, filter and paginate in memory since it's a relatively small dataset
                let filteredActivities = activities;
                if (type) {
                    filteredActivities = activities.filter(item => 
                        item.itemType === type || 
                        (item.action && item.action.includes(type))
                    );
                }
                
                // Sort the items
                const sortKey = sortBy as keyof ActivityFeedItem;
                filteredActivities.sort((a, b) => {
                    if (!a[sortKey] || !b[sortKey]) return 0;
                    return sortDirection * ((a[sortKey] > b[sortKey]) ? 1 : -1);
                });
                
                // Apply pagination
                const paginatedItems = filteredActivities.slice(skip, skip + limit);
                
                return {
                    items: paginatedItems,
                    totalCount: filteredActivities.length,
                    hasMore: skip + limit < filteredActivities.length
                };
                
            case 'class':
                // Only show activities from users in the same classes/subjects as the user
                const userInfo = await User.findById(userId).select('subjects').lean();
                if (!userInfo) {
                    throw new ErrorResponse('User not found', 404);
                }
                
                // Get subjects the user is following
                const subjects = userInfo.subjects?.map(s => s.name) || [];
                
                if (subjects.length === 0) {
                    return { items: [], totalCount: 0, hasMore: false };
                }
                
                // Get notes from these subjects
                const subjectNotes = await Note.find({ 
                    subject: { $in: subjects },
                    isPublic: true 
                })
                .select('_id user subject title createdAt')
                .populate({
                    path: 'user',
                    select: 'username name profileImage'
                })
                .sort({ createdAt: sortDirection })
                .skip(skip)
                .limit(limit)
                .lean();
                
                // Convert notes to activity feed items
                const classItems: ActivityFeedItem[] = subjectNotes.map(note => ({
                    itemType: 'note',
                    action: 'upload',
                    description: `Uploaded "${note.title}" in ${note.subject}`,
                    createdAt: note.createdAt,
                    user: note.user as any,
                    relatedData: { noteId: note._id, title: note.title, subject: note.subject }
                }));
                
                const totalClassCount = await Note.countDocuments({ 
                    subject: { $in: subjects },
                    isPublic: true 
                });
                
                return {
                    items: classItems,
                    totalCount: totalClassCount,
                    hasMore: skip + limit < totalClassCount
                };
                
            case 'global':
                // Show public activities from all users
                // Use MongoDB aggregation to get the most recent global activities
                const globalActivities = await User.aggregate([
                    // Unwind the activity array to work with individual activities
                    { $unwind: '$activity' },
                    // Only include activities that should be public
                    { $match: { 
                        'activity.action': { 
                            $in: ['upload', 'earn_badge', 'earn_xp', 'comment', 'rate', 'share'] 
                        } 
                    }},
                    // Sort by the activity creation date
                    { $sort: { 'activity.createdAt': sortDirection } },
                    // Skip and limit for pagination
                    { $skip: skip },
                    { $limit: limit },
                    // Project the needed fields
                    { $project: {
                        _id: 0,
                        userId: '$_id',
                        username: 1,
                        name: 1,
                        profileImage: 1,
                        action: '$activity.action',
                        description: '$activity.description',
                        xpEarned: '$activity.xpEarned',
                        createdAt: '$activity.createdAt'
                    }}
                ]);
                
                // Format the global activities
                const formattedGlobal = globalActivities.map(item => ({
                    itemType: this.getItemTypeFromAction(item.action),
                    action: item.action,
                    description: item.description,
                    xpEarned: item.xpEarned,
                    createdAt: item.createdAt,
                    user: {
                        _id: item.userId,
                        username: item.username,
                        name: item.name,
                        profileImage: item.profileImage
                    }
                }));
                
                // Count total global activities for pagination info
                const totalGlobalCount = await User.aggregate([
                    { $unwind: '$activity' },
                    { $match: { 
                        'activity.action': { 
                            $in: ['upload', 'earn_badge', 'earn_xp', 'comment', 'rate', 'share'] 
                        } 
                    }},
                    { $count: 'total' }
                ]).then(result => result[0]?.total || 0);
                
                return {
                    items: formattedGlobal,
                    totalCount: totalGlobalCount,
                    hasMore: skip + limit < totalGlobalCount
                };
                
            case 'ai':
                // Only show AI-related activities
                matchStage['activity.action'] = { $in: ['generate_summary', 'generate_flashcards'] };
                break;
                
            default:
                // Default to user's own activities if filter is invalid
                matchStage['_id'] = new mongoose.Types.ObjectId(userId);
                break;
        }
        
        if (type) {
            matchStage['activity.action'] = type;
        }
        
        // Process based on current filter
        if (filter === 'ai') {
            const aiActivities = await User.aggregate([
                // Unwind the activity array to work with individual activities
                { $unwind: '$activity' },
                // Match AI-specific actions
                { $match: { 'activity.action': { $in: ['generate_summary', 'generate_flashcards'] } }},
                // Sort by the activity creation date
                { $sort: { 'activity.createdAt': sortDirection } },
                // Skip and limit for pagination
                { $skip: skip },
                { $limit: limit },
                // Project the needed fields
                { $project: {
                    _id: 0,
                    userId: '$_id',
                    username: 1,
                    name: 1,
                    profileImage: 1,
                    action: '$activity.action',
                    description: '$activity.description',
                    xpEarned: '$activity.xpEarned',
                    createdAt: '$activity.createdAt'
                }}
            ]);
            
            // Format the AI activities
            const formattedAI = aiActivities.map(item => ({
                itemType: 'ai',
                action: item.action,
                description: item.description,
                xpEarned: item.xpEarned,
                createdAt: item.createdAt,
                user: {
                    _id: item.userId,
                    username: item.username,
                    name: item.name,
                    profileImage: item.profileImage
                }
            }));
            
            // Count total AI activities for pagination info
            const totalAICount = await User.aggregate([
                { $unwind: '$activity' },
                { $match: { 'activity.action': { $in: ['generate_summary', 'generate_flashcards'] } }},
                { $count: 'total' }
            ]).then(result => result[0]?.total || 0);
            
            return {
                items: formattedAI,
                totalCount: totalAICount,
                hasMore: skip + limit < totalAICount
            };
        }
        
        return {
            items: [],
            totalCount: 0,
            hasMore: false
        };
    }
    
    /**
     * Helper method to process a user's activities into ActivityFeedItems
     */
    private processUserActivities(user: any, currentUserId: string): ActivityFeedItem[] {
        const activities: ActivityFeedItem[] = [];
        
        // Process regular activities
        if (user.activity && Array.isArray(user.activity)) {
            user.activity.forEach((activity: any) => {
                activities.push({
                    ...activity,
                    itemType: this.getItemTypeFromAction(activity.action),
                    user: {
                        _id: user._id,
                        username: user.username || 'unknown',
                        name: user.name || 'Unknown User',
                        profileImage: user.profileImage
                    }
                });
            });
        }
        
        // Process badges as separate activity items
        if (user.badges && Array.isArray(user.badges)) {
            user.badges.forEach((badgeEntry: any) => {
                if (badgeEntry.badge) {
                    activities.push({
                        itemType: 'badge',
                        action: 'earn_badge',
                        description: `Earned badge: ${badgeEntry.badge.name}`,
                        xpEarned: badgeEntry.badge.xpReward || 0,
                        createdAt: badgeEntry.earnedAt,
                        user: {
                            _id: user._id,
                            username: user.username || 'unknown',
                            name: user.name || 'Unknown User',
                            profileImage: user.profileImage
                        },
                        relatedData: {
                            badge: badgeEntry.badge
                        }
                    });
                }
            });
        }
        
        // Sort all activities by date
        return activities.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    
    /**
     * Helper to determine item type from action
     */
    private getItemTypeFromAction(action: string): ActivityFeedItem['itemType'] {
        if (action.includes('generate') || action.includes('ai')) {
            return 'ai';
        }
        if (action.includes('badge')) {
            return 'badge';
        }
        if (action.includes('study') || action.includes('learn')) {
            return 'study';
        }
        if (action.includes('upload') || action.includes('note')) {
            return 'note';
        }
        return 'activity';
    }
}

export default new UserActivityFeedService(); 