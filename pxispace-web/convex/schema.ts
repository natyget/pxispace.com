import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    handle: v.optional(v.string()),
    bio: v.optional(v.string()),
    // Tracks whether the user has completed the onboarding flow
    onboarded: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    private: v.optional(v.boolean()),
    // Presence
    inApp: v.optional(v.boolean()),
    lastActiveAt: v.optional(v.number()),
    // Push notification preferences
    pushNotificationsEnabled: v.optional(v.boolean()),
    likesNotificationsEnabled: v.optional(v.boolean()),
    commentsNotificationsEnabled: v.optional(v.boolean()),
    friendRequestsNotificationsEnabled: v.optional(v.boolean()),
    dmsNotificationsEnabled: v.optional(v.boolean()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_handle", ["handle"]),
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.optional(v.id("users")),
  }).index("by_user", ["userId"]),
  // Albums: basic grouping for posts/media
  albums: defineTable({
    // optional client-provided id if needed in addition to _id
    externalId: v.optional(v.string()),
    name: v.string(),
    createdBy: v.id("users"),
    // Optional ticketing: if isTicketed is true, ticketType should be provided
    isTicketed: v.optional(v.boolean()),
    ticketType: v.optional(
      v.union(
        v.literal("vip"),
        v.literal("general")
      )
    ),
    location: v.optional(v.string()),
    time: v.optional(v.number()), // epoch ms for event time
    start_time: v.optional(v.number()), // epoch ms for start
    end_time: v.optional(v.number()), // epoch ms for end
    peopleCount: v.optional(v.number()),
    displayImageUrl: v.optional(v.string()),
    closed_at: v.optional(v.number()), // epoch ms
    maxPostsPerParticipant: v.optional(v.number()),
    feedAutoPublish: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    // Optional description
    description: v.optional(v.string()),
    // Music/song data
    musicId: v.optional(v.string()), // Apple Music song ID
    musicTitle: v.optional(v.string()),
    musicArtist: v.optional(v.string()),
    musicArtworkUrl: v.optional(v.string()),
    // Privacy setting
    isPublic: v.optional(v.boolean()), // true for public, false for private (defaults to private)
  })
    .index("by_externalId", ["externalId"]) 
    .index("by_creator", ["createdBy"]) 
    .index("by_created", ["created_at"]) ,

  // Posts: can optionally belong to an album; may have a primary media
  posts: defineTable({
    albumId: v.optional(v.id("albums")),
    userId: v.id("users"),
    primaryMediaId: v.optional(v.id("media")),
    likes: v.optional(v.number()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    archived_at: v.optional(v.number()),
  })
    .index("by_album", ["albumId"]) 
    .index("by_user", ["userId"]) 
    .index("by_created", ["created_at"]) ,

  // Media: individual photo/video items associated with a post
  media: defineTable({
    postId: v.id("posts"),
    url: v.string(),
    type: v.union(v.literal("photo"), v.literal("video")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()), // for videos
    sizeBytes: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    created_at: v.optional(v.number()),
  })
    .index("by_post", ["postId"]) 
    .index("by_created", ["created_at"]) ,

  // Album participants/collaborators membership
  albumParticipants: defineTable({
    albumId: v.id("albums"),
    userId: v.id("users"),
    joined_at: v.optional(v.number()),
    isCollaborator: v.optional(v.boolean()), // legacy flag
    role: v.optional(
      v.union(
        v.literal("owner"),
        v.literal("member"),
        v.literal("cohost"),
        v.literal("performer")
      )
    ),
    postLimit: v.optional(v.number()), // per-participant override
    postsUsed: v.optional(v.number()),
  })
    .index("by_album", ["albumId"]) 
    .index("by_user", ["userId"]) 
    .index("by_album_user", ["albumId", "userId"]) ,

  // Friend relationships (normalized pair: userId1 < userId2)
  friends: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("blocked")
    ),
    requestedBy: v.id("users"),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
    accepted_at: v.optional(v.number()),
    declined_at: v.optional(v.number()),
    blocked_at: v.optional(v.number()),
    blockedBy: v.optional(v.id("users")),
    isCloseFriend: v.optional(v.boolean()),
    muteUntil: v.optional(v.number()),
    lastInteractedAt: v.optional(v.number()),
    source: v.optional(
      v.union(
        v.literal("search"),
        v.literal("qrcode"),
        v.literal("contacts"),
        v.literal("invite"),
        v.literal("other")
      )
    ),
    note: v.optional(v.string()),
  })
    .index("by_user1", ["userId1"]) 
    .index("by_user2", ["userId2"]) 
    .index("by_user_pair", ["userId1", "userId2"]) 
    .index("by_requestedBy", ["requestedBy"]) 
    .index("by_status", ["status"]) 
    .index("by_updated", ["updated_at"]) ,

  // Album tickets: created when a participant joins an album
  albumTickets: defineTable({
    albumId: v.id("albums"),
    userId: v.id("users"),
    scanned_at: v.optional(v.number()),
    created_at: v.optional(v.number()),
    // Optional future payment fields
    priceCents: v.optional(v.number()),
    currency: v.optional(v.string()), // e.g., "USD"
    paymentStatus: v.optional(
      v.union(
        v.literal("unpaid"),
        v.literal("paid"),
        v.literal("refunded")
      )
    ),
  })
    .index("by_album", ["albumId"]) 
    .index("by_user", ["userId"]) 
    .index("by_album_user", ["albumId", "userId"]) 
    .index("by_created", ["created_at"]) 
    .index("by_scanned", ["scanned_at"]) ,

  // Album invite links / QR tokens
  albumInvites: defineTable({
    albumId: v.id("albums"),
    createdBy: v.id("users"),
    token: v.string(), // unique opaque token
    expires_at: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    usedCount: v.optional(v.number()),
    created_at: v.optional(v.number()),
  })
    .index("by_album", ["albumId"]) 
    .index("by_token", ["token"]) 
    .index("by_creator", ["createdBy"]) ,

  // Requests to post to a closed album
  albumPostRequests: defineTable({
    albumId: v.id("albums"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    created_at: v.optional(v.number()),
    reviewed_at: v.optional(v.number()),
    reviewerId: v.optional(v.id("users")), // usually album owner or cohost
  })
    .index("by_album", ["albumId"]) 
    .index("by_user", ["userId"]) 
    .index("by_status", ["status"]) ,

  // Direct message threads (1:1 only; ordered pair userId1 < userId2)
  dmThreads: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    lastText: v.optional(v.string()),
    lastSenderId: v.optional(v.id("users")),
    updated_at: v.optional(v.number()),
    archived_at: v.optional(v.number()),
  })
    .index("by_user1", ["userId1"]) 
    .index("by_user2", ["userId2"]) 
    .index("by_updated", ["updated_at"]) ,

  // Direct message entries
  dmMessages: defineTable({
    threadId: v.id("dmThreads"),
    senderId: v.id("users"),
    text: v.string(),
    gifUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    created_at: v.optional(v.number()),
  })
    .index("by_thread", ["threadId"]) 
    .index("by_created", ["created_at"]) ,

  // Per-user read watermark for a DM thread
  dmReads: defineTable({
    threadId: v.id("dmThreads"),
    userId: v.id("users"),
    read_at: v.optional(v.number()),
  })
    .index("by_thread_user", ["threadId", "userId"]) ,

  // In-app notifications for a user
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("friend"), v.literal("like"), v.literal("comment")),
    actorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.string()),
    text: v.optional(v.string()),
    created_at: v.optional(v.number()),
    read: v.optional(v.boolean()),
  })
    .index("by_user_created", ["userId", "created_at"]) 
    .index("by_user_read", ["userId", "read"]) 
    .index("like_unique", ["type", "postId", "actorId"]) ,

  // Push notification tokens per user/device
  pushTokens: defineTable({
    userId: v.id("users"),
    token: v.string(), // Expo push token
    platform: v.optional(v.union(v.literal("ios"), v.literal("android"), v.literal("web"))),
    updated_at: v.optional(v.number()),
    disabled: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"]) 
    .index("by_token", ["token"]) ,
  contentReports: defineTable({
    reporterId: v.id("users"),
    contentType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("albumActivity"),
      v.literal("albumContent"),
      v.literal("dmMessage"),
      v.literal("story")
    ),
    contentId: v.string(),
    contentOwnerId: v.id("users"),
    category: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("inappropriate"),
      v.literal("violence"),
      v.literal("hate_speech"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed"),
      v.literal("action_taken")
    ),
    created_at: v.number(),
    reviewed_at: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_reporter", ["reporterId"]) 
    .index("by_content_owner", ["contentOwnerId"]) 
    .index("by_status", ["status"]) 
    .index("by_content", ["contentType", "contentId"]) ,
  hiddenContent: defineTable({
    userId: v.id("users"),
    contentType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("albumActivity"),
      v.literal("albumContent"),
      v.literal("dmMessage"),
      v.literal("story")
    ),
    contentId: v.string(),
    created_at: v.number(),
  })
    .index("by_user", ["userId"]) 
    .index("by_user_content", ["userId", "contentType", "contentId"]) ,
  userReports: defineTable({
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    category: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("inappropriate"),
      v.literal("violence"),
      v.literal("hate_speech"),
      v.literal("fake_account"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed"),
      v.literal("action_taken")
    ),
    created_at: v.number(),
    reviewed_at: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_reporter", ["reporterId"]) 
    .index("by_reported_user", ["reportedUserId"]) 
    .index("by_status", ["status"]) 
    .index("by_reporter_reported", ["reporterId", "reportedUserId"]) ,
  // Comments on posts
  comments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    text: v.string(),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_created", ["created_at"]),

  // Likes on posts
  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    created_at: v.optional(v.number()),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_user", ["postId", "userId"]),

  // Mapping of album posts that were published to the global feed
  albumFeedPosts: defineTable({
    albumId: v.id("albums"),
    sourcePostId: v.id("posts"),
    feedPostId: v.id("posts"),
    created_at: v.optional(v.number()),
  })
    .index("by_album", ["albumId"]) 
    .index("by_source", ["sourcePostId"]) 
    .index("by_feed", ["feedPostId"]) ,

  // Mapping for feed posts created from albums (album cover posts)
  albumContentFeed: defineTable({
    albumId: v.id("albums"),
    contentId: v.optional(v.id("albumContent")), // Optional: null when posting album itself
    feedPostId: v.id("posts"),
    created_at: v.optional(v.number()),
  })
    .index("by_album", ["albumId"]) 
    .index("by_content", ["contentId"]) 
    .index("by_feed", ["feedPostId"]) ,

  // Album-level activity/discussion feed
  albumActivity: defineTable({
    albumId: v.id("albums"),
    userId: v.id("users"),
    text: v.string(),
    parentId: v.optional(v.id("albumActivity")), // for nested replies
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_album", ["albumId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId"])
    .index("by_created", ["created_at"])
    .index("by_album_created", ["albumId", "created_at"]),

  // Likes on activity comments
  activityLikes: defineTable({
    activityId: v.id("albumActivity"),
    userId: v.id("users"),
    created_at: v.optional(v.number()),
  })
    .index("by_activity", ["activityId"])
    .index("by_user", ["userId"])
    .index("by_activity_user", ["activityId", "userId"]),

  // Album content stream (text, gifs, archive attachments)
  albumContent: defineTable({
    albumId: v.id("albums"),
    userId: v.id("users"),
    type: v.union(v.literal("text"), v.literal("gif"), v.literal("archive")),
    // content fields
    text: v.optional(v.string()),
    gifUrl: v.optional(v.string()),
    archiveId: v.optional(v.id("archivedMedia")),
    parentId: v.optional(v.id("albumActivity")), // for GIF replies to comments
    created_at: v.optional(v.number()),
  })
    .index("by_album", ["albumId"]) 
    .index("by_user", ["userId"]) 
    .index("by_album_created", ["albumId", "created_at"]) ,

  // Likes on album content (for participants)
  contentLikes: defineTable({
    contentId: v.id("albumContent"),
    userId: v.id("users"),
    created_at: v.optional(v.number()),
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_content_user", ["contentId", "userId"]),

  // Emoji reactions on album content (for non-participants)
  albumContentReactions: defineTable({
    contentId: v.id("albumContent"),
    userId: v.id("users"),
    emoji: v.string(), // e.g., "heart", "laugh", "wow", "fire", "clap"
    created_at: v.optional(v.number()),
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_content_user", ["contentId", "userId"]),

  // Archived media (user's personal stash, not linked to album)
  archivedMedia: defineTable({
    userId: v.id("users"),
    url: v.string(),
    type: v.union(v.literal("photo"), v.literal("video"), v.literal("gif")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    created_at: v.optional(v.number()),
  })
    .index("by_user", ["userId"]) 
    .index("by_created", ["created_at"]) ,

  // Stories (24-hour temporary posts)
  stories: defineTable({
    userId: v.id("users"),
    mediaUrl: v.string(),
    type: v.union(v.literal("photo"), v.literal("video")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    created_at: v.optional(v.number()),
    expires_at: v.optional(v.number()), // 24 hours from creation
  })
    .index("by_user", ["userId"])
    .index("by_created", ["created_at"])
    .index("by_expires", ["expires_at"]),

  // Story views (who viewed which story)
  storyViews: defineTable({
    storyId: v.id("stories"),
    userId: v.id("users"),
    viewed_at: v.optional(v.number()),
  })
    .index("by_story", ["storyId"])
    .index("by_user", ["userId"])
    .index("by_story_user", ["storyId", "userId"]),

});

