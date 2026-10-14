'use client';

// The organizer page editor: the words, photo and links people see at pxispace.com/u/<username>, with a live
// preview beside it. Saving is AccountPage's own call (authService.updateProfile) with the same rules: a city is
// only ever one picked from the curated list, and a photo goes up the same way. Nothing here changes AccountPage.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { InstagramIcon } from '@hugeicons/core-free-icons';
import { Avatar, Button, EmptyState, Field, Notice, PageHeader, Panel, Skeleton, TextArea } from '@/components/dashboard/ui/kit';
import { usePageAction } from '@/components/dashboard/shell/usePageAction';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth';
import { api } from '@/services/api';
import { uploadImageToR2 } from '@/services/media';
import { canHostEvents } from '@/lib/accountTier';
import { countLabel, instagramHandle as cleanInstagram, parseOrganizer, statWord } from '@/lib/organizerPage';
import { errorText, useRequest } from '@/views/dashboard/audience/useRequest';

// What the API accepts today (backend src/utils/profileDisplay.ts: PROFILE_BIO_MAX_LENGTH and
// PROFILE_TEXT_FIELD_MAX_LENGTH). The app holds people to the same numbers. If the bio limit is raised on the API,
// raise BIO_MAX here and nothing else changes.
const BIO_MAX = 50;
const NAME_MAX = 30;
const INSTAGRAM_MAX = 30;

function useDebounced(value, ms) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(timer);
    }, [value, ms]);
    return debounced;
}

/** The name steps down with its length, as on the public page, so a long brand name does not fill the card. */
function nameSize(name) {
    if (name.length > 48) return 'text-[17px]';
    if (name.length > 24) return 'text-[20px]';
    return 'text-[24px]';
}

/** Nights, people, followers: the public page's three numbers, each with its one small word. */
function PreviewStats({ organizer }) {
    const items = [
        ['nights', organizer.totals.events, false],
        ['people', organizer.totals.attendees, organizer.totals.attendeesRounded],
        ['followers', organizer.followers, organizer.followersRounded],
    ];
    return (
        <ul className="mt-6 grid grid-cols-3 gap-2">
            {items.map(([kind, value, rounded]) => (
                <li key={kind} className="min-w-0">
                    <p className="text-[22px] font-extrabold leading-none tracking-[-0.03em] text-white tabular-nums">{countLabel(value, rounded)}</p>
                    <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">{statWord(kind, value, rounded)}</p>
                </li>
            ))}
        </ul>
    );
}

/** The page as people see it, in the public page's order: photo, name, @username, numbers, bio, Instagram. */
function PagePreview({ avatarUrl, name, username, city, bio, instagram, organizer }) {
    const shownName = name.trim() || (username ? `@${username}` : 'Your name');
    const handle = cleanInstagram(instagram);
    return (
        <div className="rounded-2xl bg-black px-5 py-7 text-center">
            <div className="flex justify-center">
                <Avatar person={{ avatarUrl, name: shownName }} size={72} />
            </div>
            <p className={`mt-4 font-bold normal-case leading-[1.1] tracking-[-0.02em] [overflow-wrap:anywhere] ${name.trim() ? 'text-white' : 'text-white/35'} ${nameSize(shownName)}`}>
                {shownName}
            </p>
            {username ? <p className="mt-1 text-[14px] font-medium text-white/50 [overflow-wrap:anywhere]">@{username}</p> : null}
            {city ? <p className="mt-0.5 text-[13px] text-white/40">{city}</p> : null}
            {organizer ? <PreviewStats organizer={organizer} /> : null}
            {bio.trim() ? (
                <p className="mx-auto mt-5 max-w-[22rem] whitespace-pre-line text-[14px] leading-[1.6] text-white/80 [overflow-wrap:anywhere]">{bio.trim()}</p>
            ) : null}
            {handle ? (
                <p className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-white/65">
                    <HugeiconsIcon icon={InstagramIcon} size={16} aria-hidden="true" />@{handle}
                </p>
            ) : null}
        </div>
    );
}

function Editor({ user, updateUser }) {
    const [name, setName] = useState(user.name || '');
    const [bio, setBio] = useState(user.bio || '');
    const [instagram, setInstagram] = useState(user.instagramHandle || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    // Strict city picker, as in Settings: typed text is never saved, only a city picked from /api/meta/cities
    // (the canonical name and its code).
    const [cityPick, setCityPick] = useState(user.city ? { city: user.city, cityCode: user.cityCode || null } : null);
    const [cityInput, setCityInput] = useState(user.city ? (user.cityCode ? `${user.city} (${user.cityCode})` : user.city) : '');
    const [cityDirty, setCityDirty] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    // What is on the server now, so Save wakes up only when something changed.
    const [saved, setSaved] = useState({ name: user.name || '', bio: user.bio || '', instagram: user.instagramHandle || '', avatarUrl: user.avatarUrl || '' });
    const [justSaved, setJustSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const username = user.username || '';

    const cityQuery = useDebounced(cityInput.trim(), 300);
    const suggestionsReq = useRequest(cityDirty && !cityPick && cityQuery ? `cities:${cityQuery}` : null, () =>
        api.get(`/api/meta/cities?q=${encodeURIComponent(cityQuery)}`)
    );
    const suggestions = cityOpen && cityDirty && !cityPick && cityQuery ? suggestionsReq.data?.cities || [] : [];
    const cityUnpicked = cityDirty && Boolean(cityInput.trim()) && !cityPick;

    const statsReq = useRequest(username ? `organizer:${username}` : null, () => api.get(`/api/users/${encodeURIComponent(username)}/organizer`));
    const organizer = useMemo(() => (statsReq.error ? null : parseOrganizer(statsReq.data?.organizer)), [statsReq.data, statsReq.error]);

    const instagramClean = instagram.trim().replace(/^@/, '');
    const instagramBad = Boolean(instagramClean) && !cleanInstagram(instagramClean);
    const dirty =
        name.trim() !== saved.name ||
        bio.trim() !== saved.bio ||
        instagramClean !== saved.instagram.replace(/^@/, '') ||
        avatarUrl !== saved.avatarUrl ||
        cityDirty;

    function edit(setter) {
        return (value) => {
            setter(value);
            setJustSaved(false);
            setError('');
        };
    }

    function onCityChange(value) {
        setCityInput(value);
        setCityPick(null);
        setCityDirty(true);
        setCityOpen(true);
        setJustSaved(false);
        setError('');
    }

    function pickCity(c) {
        setCityPick({ city: c.city, cityCode: c.code });
        setCityInput(c.label);
        setCityDirty(true);
        setCityOpen(false);
        setJustSaved(false);
        setError('');
    }

    async function pickAvatar(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const publicUrl = await uploadImageToR2(file, {
                filename: `avatar_${Date.now()}.${(file.name?.split('.').pop() || 'jpg').toLowerCase()}`,
                contentType: file.type || 'image/jpeg',
            });
            setAvatarUrl(publicUrl);
            setJustSaved(false);
        } catch (err) {
            setError(err?.message || 'Could not upload the photo.');
        } finally {
            setUploading(false);
        }
    }

    async function save() {
        // Strict picker: typed-but-unpicked city text is never submitted.
        if (cityUnpicked) {
            setError('Pick a city from the list.');
            return;
        }
        setSaving(true);
        setError('');
        setJustSaved(false);
        try {
            const res = await authService.updateProfile(user.id, {
                name: name.trim() || null,
                bio: bio.trim() || null,
                // Only send the city when it was edited: a picked entry stores the canonical city and its code, a
                // cleared field wipes both.
                ...(cityDirty
                    ? {
                          city: cityPick ? cityPick.city : null,
                          cityCode: cityPick ? cityPick.cityCode : null,
                      }
                    : {}),
                instagramHandle: instagram.trim() || null,
                ...(avatarUrl && avatarUrl !== user.avatarUrl ? { avatarUrl } : {}),
            });
            if (res?.user) updateUser(res.user);
            setSaved({
                name: res?.user?.name ?? name.trim(),
                bio: res?.user?.bio ?? bio.trim(),
                instagram: res?.user?.instagramHandle ?? instagramClean,
                avatarUrl: res?.user?.avatarUrl ?? avatarUrl,
            });
            setCityDirty(false);
            setJustSaved(true);
        } catch (err) {
            setError(errorText(err, 'Could not save your page.'));
        } finally {
            setSaving(false);
        }
    }

    const previewCity = cityDirty ? cityPick?.city || '' : user.city || '';

    return (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Panel title="About you">
                <div className="flex items-center gap-4">
                    <Avatar person={{ avatarUrl, name }} size={72} />
                    <div className="min-w-0">
                        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Change photo'}
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" aria-label="Photo" />
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <Field label="Display name" value={name} onChange={(e) => edit(setName)(e.target.value)} maxLength={NAME_MAX} placeholder="Your name or your brand" />

                    <TextArea
                        label="Bio"
                        value={bio}
                        onChange={(e) => edit(setBio)(e.target.value)}
                        maxLength={BIO_MAX}
                        rows={3}
                        placeholder="Tell people what your nights are about"
                        hint={<span className="block text-right tabular-nums">{bio.length}/{BIO_MAX}</span>}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="relative">
                            <Field
                                label="City"
                                value={cityInput}
                                onChange={(e) => onCityChange(e.target.value)}
                                onFocus={() => setCityOpen(true)}
                                onBlur={() => setCityOpen(false)}
                                placeholder="Where you are based"
                                autoComplete="off"
                                hint={cityUnpicked && !cityOpen ? 'Pick a city from the list.' : null}
                            />
                            {suggestions.length ? (
                                <ul onMouseDown={(e) => e.preventDefault()} className="absolute left-0 right-0 top-[72px] z-20 max-h-52 overflow-y-auto rounded-2xl bg-[#3a3a3a] p-1.5">
                                    {suggestions.map((c) => (
                                        <li key={c.code || c.label}>
                                            <button type="button" onClick={() => pickCity(c)} className="flex w-full rounded-xl px-3 py-2.5 text-left text-[14px] text-white transition hover:bg-white/10">
                                                {c.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                        <Field
                            label="Instagram"
                            value={instagram}
                            onChange={(e) => edit(setInstagram)(e.target.value)}
                            maxLength={INSTAGRAM_MAX}
                            placeholder="@handle"
                            autoCapitalize="none"
                            hint={instagramBad ? 'Letters, numbers, dots and underscores only. It shows as a link on your page.' : null}
                        />
                    </div>

                    {username ? (
                        <div>
                            <p className="mb-1.5 text-[12px] font-medium text-white/50">Username</p>
                            <div className="flex items-center justify-between gap-4">
                                <p className="min-w-0 truncate text-[14px] text-white">@{username}</p>
                                <Link href="/dashboard/account?tab=profile" className="shrink-0 text-[13px] text-white/50 underline-offset-4 transition hover:text-white hover:underline">
                                    Change in Settings
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>

                {error ? (
                    <Notice tone="error" className="mt-5">
                        {error}
                    </Notice>
                ) : null}

                <div className="mt-6 flex items-center gap-4">
                    <Button variant="primary" size="lg" onClick={save} disabled={saving || uploading || !dirty} className="min-w-[120px]">
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    {justSaved ? <span className="text-[14px] font-semibold text-emerald-300">Saved</span> : null}
                </div>
            </Panel>

            <div className="xl:sticky xl:top-5">
                <Panel title="Preview">
                    <PagePreview avatarUrl={avatarUrl} name={name} username={username} city={previewCity} bio={bio} instagram={instagram} organizer={organizer} />
                </Panel>
            </div>
        </div>
    );
}

export default function OrganizerPageEditor() {
    const { user, updateUser, authReady, authRefreshing } = useAuth();
    const ready = authReady && !authRefreshing && Boolean(user?.id);
    const username = ready ? user.username : '';

    // The page's one action: open the public page in a new tab.
    const viewPage = useMemo(
        () =>
            username ? (
                <Button variant="secondary" onClick={() => window.open(`/u/${encodeURIComponent(username)}`, '_blank', 'noopener,noreferrer')}>
                    View page
                </Button>
            ) : null,
        [username]
    );
    usePageAction(viewPage);

    return (
        <div className="space-y-5 md:space-y-6">
            <PageHeader title="Organizer page" subtitle={username ? `What people see at pxispace.com/u/${username}.` : 'What people see on your public page.'} />
            {!ready ? (
                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-72" />
                </div>
            ) : !canHostEvents(user) ? (
                <EmptyState title="Hosts get an organizer page." line="Finish your account in the PXI app to start hosting nights." />
            ) : (
                <Editor key={user.id} user={user} updateUser={updateUser} />
            )}
        </div>
    );
}
