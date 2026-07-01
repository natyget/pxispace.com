export const CAMPAIGN_DRAFTS_STORAGE_KEY = 'pxi_campaign_drafts_v1';

const DEFAULT_DRAFTS = [
  {
    id: 'draft-passport-returners',
    title: 'Passport returners reactivation',
    audience: 'Recent high-engagement guests',
    status: 'draft',
    stage: 'Mix review',
    schedule: 'Next best send window',
    updatedAt: '2026-01-15T12:00:00.000Z',
    mix: {
      sms: true,
      email: true,
      feedPosts: true,
      discoveryRanking: false,
      budget: 420,
    },
    insights: [
      'High-value Passport holders respond best to a direct reminder 90 minutes before doors.',
      'Use feed posts as social proof, then reserve SMS for confirmed high-intent segments.',
    ],
  },
  {
    id: 'draft-photo-drop',
    title: 'Post-event photo drop',
    audience: 'Recent attendees with gallery activity',
    status: 'draft',
    stage: 'Copy draft',
    schedule: 'After album curation',
    updatedAt: '2026-01-10T12:00:00.000Z',
    mix: {
      sms: false,
      email: true,
      feedPosts: true,
      discoveryRanking: false,
      budget: 180,
    },
    insights: [
      'Photo drops should favor email and feed surfaces so SMS stays reserved for urgent event conversion.',
    ],
  },
];

function nowIso() {
  return new Date().toISOString();
}

function cloneDrafts(drafts) {
  return drafts.map((draft) => ({
    ...draft,
    mix: { ...draft.mix },
    insights: [...(draft.insights || [])],
  }));
}

function readDrafts() {
  if (typeof window === 'undefined') return cloneDrafts(DEFAULT_DRAFTS);

  try {
    const raw = window.localStorage.getItem(CAMPAIGN_DRAFTS_STORAGE_KEY);
    if (!raw) {
      const seeded = cloneDrafts(DEFAULT_DRAFTS);
      window.localStorage.setItem(CAMPAIGN_DRAFTS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : cloneDrafts(DEFAULT_DRAFTS);
  } catch {
    return cloneDrafts(DEFAULT_DRAFTS);
  }
}

function writeDrafts(drafts) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CAMPAIGN_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  }
  return cloneDrafts(drafts);
}

function makeDraftId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `draft-${crypto.randomUUID()}`;
  }
  return `draft-${Date.now()}`;
}

export function listCampaignDrafts() {
  return Promise.resolve(readDrafts());
}

export function createCampaignDraftFromInsights(context = {}) {
  const drafts = readDrafts();
  const mix = {
    sms: Boolean(context.mix?.sms),
    email: context.mix?.email !== false,
    feedPosts: context.mix?.feedPosts !== false,
    discoveryRanking: Boolean(context.mix?.discoveryRanking),
    budget: Number(context.mix?.budget ?? 300),
  };
  const title = context.title || 'AI campaign draft';
  const nextDraft = {
    id: makeDraftId(),
    title,
    audience: context.audience || 'Best-fit audience segment',
    status: 'draft',
    stage: 'Generated draft',
    schedule: context.schedule || 'Review send window',
    updatedAt: nowIso(),
    mix,
    insights: context.insights || [],
  };

  writeDrafts([nextDraft, ...drafts]);
  return Promise.resolve(nextDraft);
}

export function updateCampaignDraft(id, patch = {}) {
  const drafts = readDrafts();
  const nextDrafts = drafts.map((draft) => {
    if (draft.id !== id) return draft;
    return {
      ...draft,
      ...patch,
      mix: { ...draft.mix, ...(patch.mix || {}) },
      updatedAt: nowIso(),
    };
  });

  writeDrafts(nextDrafts);
  return Promise.resolve(nextDrafts.find((draft) => draft.id === id) || null);
}

export function resumeCampaignDraft(id) {
  return updateCampaignDraft(id, { status: 'draft', stage: 'Resumed' });
}

export function archiveCampaignDraft(id) {
  return updateCampaignDraft(id, { status: 'archived', stage: 'Archived' });
}

export function deleteCampaignDraft(id) {
  const drafts = readDrafts();
  return Promise.resolve(writeDrafts(drafts.filter((draft) => draft.id !== id)));
}

export const campaignDraftsService = {
  listCampaignDrafts,
  createCampaignDraftFromInsights,
  updateCampaignDraft,
  resumeCampaignDraft,
  archiveCampaignDraft,
  deleteCampaignDraft,
};
