import { query } from "./_generated/server";
import { v } from "convex/values";

// List all public albums
export const listPublicAlbums = query({
  args: {},
  handler: async (ctx) => {
    const albums = await ctx.db
      .query("albums")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
    
    const now = Date.now();
    const albumsWithData = await Promise.all(
      albums.map(async (album) => {
        const participants = await ctx.db
          .query("albumParticipants")
          .withIndex("by_album", (q) => q.eq("albumId", album._id))
          .collect();
        
        let status: 'live' | 'upcoming' | 'memory';
        if (album.closed_at || (album.end_time && now >= album.end_time)) {
          status = 'memory';
        } else if (album.start_time && now < album.start_time) {
          status = 'upcoming';
        } else {
          status = 'live';
        }
        
        return {
          ...album,
          participantsCount: participants.length + 1,
          status,
        };
      })
    );
    
    // Sort by created date descending
    albumsWithData.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
    return albumsWithData;
  },
});

// Get a single public album by ID
export const getPublicAlbumById = query({
  args: { albumId: v.id("albums") },
  handler: async (ctx, { albumId }) => {
    const album = await ctx.db.get(albumId);
    if (!album || !album.isPublic) return null;
    
    const participants = await ctx.db
      .query("albumParticipants")
      .withIndex("by_album", (q) => q.eq("albumId", albumId))
      .collect();
    
    const invite = await ctx.db
      .query("albumInvites")
      .withIndex("by_album", (q) => q.eq("albumId", albumId))
      .first();
    
    const now = Date.now();
    let status: 'live' | 'upcoming' | 'memory';
    if (album.closed_at || (album.end_time && now >= album.end_time)) {
      status = 'memory';
    } else if (album.start_time && now < album.start_time) {
      status = 'upcoming';
    } else {
      status = 'live';
    }
    
    return {
      ...album,
      participantsCount: participants.length + 1,
      inviteToken: invite?.token,
      status,
    };
  },
});

