'use client';

import { useEffect, useMemo, useState } from 'react';
import GlowCard from '@/components/dashboard/GlowCard';
import SectionCard from '@/components/dashboard/SectionCard';
import SegmentedToggle from '@/components/dashboard/SegmentedToggle';
import { useEvents } from '@/lib/dashboardStore';
import {
    ROSTER_PERMISSION_OPTIONS,
    ROSTER_MEMBER_SUGGESTIONS,
    ROSTER_ROLE_OPTIONS,
    addRosterMember,
    assignRosterToEvent,
    createTeamRoster,
    listTeamRosters,
    removeRosterMember,
    updateRosterMember,
    updateRosterRolePermissions,
    updateTeamRoster,
} from '@/services/teamRosters';

const EMPTY_INVITE_FORM = {
    query: '',
    role: 'General Staff',
};

const EMPTY_ASSIGNMENT_FORM = {
    eventId: '',
    scope: 'team',
    memberIds: [],
};

function cx(...classes) {
    return classes.filter(Boolean).join(' ');
}

function fieldClassName(className = '') {
    return cx(
        'mt-2 w-full rounded-xl bg-white/[0.045] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:bg-white/[0.07]',
        className
    );
}

function FieldLabel({ children }) {
    return (
        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            {children}
        </label>
    );
}

function TextInput({ label, className = '', ...props }) {
    return (
        <div className={className}>
            <FieldLabel>{label}</FieldLabel>
            <input {...props} className={fieldClassName()} />
        </div>
    );
}

function SelectInput({ label, className = '', children, ...props }) {
    return (
        <div className={className}>
            <FieldLabel>{label}</FieldLabel>
            <select {...props} className={fieldClassName('bg-zinc-950')}>
                {children}
            </select>
        </div>
    );
}

function PrimaryButton({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={cx(
                'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-white px-4 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-45',
                className
            )}
        >
            {children}
        </button>
    );
}

function SoftButton({ children, active = false, className = '', ...props }) {
    return (
        <button
            {...props}
            className={cx(
                'inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full px-3 text-[11px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                active
                    ? 'bg-white/[0.12] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                    : 'bg-white/[0.045] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200',
                className
            )}
        >
            {children}
        </button>
    );
}

function eventLabel(event) {
    return event?.name?.trim() || 'Untitled event';
}

function memberLabel(member) {
    return member.name || member.handle || member.contact || 'Unnamed member';
}

function memberInitial(member) {
    return memberLabel(member).replace(/^@/, '').charAt(0).toUpperCase();
}

function rolePermissionKeys(roster, role) {
    return roster.rolePermissions?.[role] || [];
}

function buildMemberFromQuery(query, role) {
    const value = String(query || '').trim();
    const looksLikeHandle = value.startsWith('@') || (!value.includes(' ') && !value.includes('@'));
    const looksLikeEmail = value.includes('@') && !value.startsWith('@');

    return {
        name: looksLikeHandle || looksLikeEmail ? '' : value,
        handle: looksLikeHandle ? value : '',
        contact: looksLikeEmail ? value : '',
        role,
        inviteStatus: 'Invited',
    };
}

function TeamList({ rosters, selectedRosterId, createName, busy, onCreateNameChange, onCreate, onSelect }) {
    return (
        <SectionCard title="Teams" dense>
            <div className="flex gap-2">
                <input
                    value={createName}
                    placeholder="Summer 2025 Crew"
                    onChange={(event) => onCreateNameChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onCreate();
                    }}
                    className="min-w-0 flex-1 rounded-xl bg-white/[0.045] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:bg-white/[0.07]"
                />
                <PrimaryButton type="button" onClick={onCreate} disabled={busy || !createName.trim()} className="px-3">
                    Create
                </PrimaryButton>
            </div>

            <div className="mt-5 space-y-3">
                {rosters.map((roster) => {
                    const selected = roster.id === selectedRosterId;
                    return (
                        <button
                            type="button"
                            key={roster.id}
                            onClick={() => onSelect(roster.id)}
                            className={cx(
                                'w-full rounded-2xl px-4 py-4 text-left transition-colors',
                                selected
                                    ? 'bg-white/[0.09] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                                    : 'bg-white/[0.035] shadow-[0_0_0_1px_rgba(255,255,255,0.055)] hover:bg-white/[0.055]'
                            )}
                        >
                            <p className="truncate text-sm font-bold text-white">{roster.name}</p>
                            <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none text-[11px] text-zinc-400">
                                <span className="whitespace-nowrap rounded-full bg-black/25 px-2.5 py-1">
                                    {roster.members.length} member{roster.members.length === 1 ? '' : 's'}
                                </span>
                                <span className="whitespace-nowrap rounded-full bg-black/25 px-2.5 py-1">
                                    {roster.eventAssignments.length} event{roster.eventAssignments.length === 1 ? '' : 's'}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </SectionCard>
    );
}

function TeamSettings({ form, busy, onChange, onSave }) {
    return (
        <SectionCard
            title="Team"
            actions={
                <PrimaryButton type="button" onClick={onSave} disabled={busy || !form.name.trim()}>
                    Save
                </PrimaryButton>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <TextInput
                    label="Team name"
                    value={form.name}
                    placeholder="Summer 2025 Crew"
                    onChange={(event) => onChange({ ...form, name: event.target.value })}
                />
                <SelectInput
                    label="Default role"
                    value={form.defaultRole}
                    onChange={(event) => onChange({ ...form, defaultRole: event.target.value })}
                >
                    {ROSTER_ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                            {role.label}
                        </option>
                    ))}
                </SelectInput>
            </div>
        </SectionCard>
    );
}

function AddMemberPanel({ form, suggestions, busy, onChange, onAddSuggestion, onInvite }) {
    return (
        <div className="rounded-2xl bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto] md:items-end">
                <TextInput
                    label="Search or invite"
                    value={form.query}
                    placeholder="Name, @handle, or email"
                    onChange={(event) => onChange({ ...form, query: event.target.value })}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onInvite();
                    }}
                />
                <SelectInput
                    label="Role"
                    value={form.role}
                    onChange={(event) => onChange({ ...form, role: event.target.value })}
                >
                    {ROSTER_ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                            {role.label}
                        </option>
                    ))}
                </SelectInput>
                <PrimaryButton type="button" onClick={onInvite} disabled={busy || !form.query.trim()}>
                    Invite
                </PrimaryButton>
            </div>

            {suggestions.length ? (
                <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none">
                    {suggestions.map((person) => (
                        <SoftButton
                            key={person.id}
                            type="button"
                            onClick={() => onAddSuggestion(person)}
                            className="normal-case tracking-normal"
                        >
                            {person.name} · {person.role}
                        </SoftButton>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function MemberPermissionPills({ member, inheritedPermissions, onChange }) {
    return (
        <div className="flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none">
            {ROSTER_PERMISSION_OPTIONS.map((permission) => {
                const direct = member.permissions.includes(permission.key);
                const inherited = inheritedPermissions.includes(permission.key);
                return (
                    <SoftButton
                        key={permission.key}
                        type="button"
                        active={direct}
                        onClick={() => {
                            const permissions = direct
                                ? member.permissions.filter((key) => key !== permission.key)
                                : [...member.permissions, permission.key];
                            onChange({ permissions });
                        }}
                        className={cx(!direct && inherited ? 'text-zinc-200 shadow-[0_0_0_1px_rgba(255,255,255,0.09)]' : '')}
                    >
                        {permission.label}
                    </SoftButton>
                );
            })}
        </div>
    );
}

function MemberRow({ roster, member, onChange, onRemove }) {
    const inheritedPermissions = rolePermissionKeys(roster, member.role);

    return (
        <div className="rounded-2xl bg-white/[0.035] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.055)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-sm font-black text-zinc-300">
                        {memberInitial(member)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{memberLabel(member)}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                            {[member.handle, member.contact].filter(Boolean).join(' · ') || 'No handle yet'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none">
                    <SelectInput
                        label="Role"
                        className="min-w-44"
                        value={member.role}
                        onChange={(event) => onChange({ role: event.target.value })}
                    >
                        {ROSTER_ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </SelectInput>
                    <SelectInput
                        label="Status"
                        className="min-w-36"
                        value={member.inviteStatus}
                        onChange={(event) => onChange({ inviteStatus: event.target.value })}
                    >
                        <option value="Invited">Invited</option>
                        <option value="Ready">Ready</option>
                    </SelectInput>
                    <div className="pt-5">
                        <SoftButton type="button" onClick={onRemove} className="rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-200">
                            Remove
                        </SoftButton>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <FieldLabel>Member permissions</FieldLabel>
                <MemberPermissionPills member={member} inheritedPermissions={inheritedPermissions} onChange={onChange} />
            </div>
        </div>
    );
}

function MembersWorkspace({
    roster,
    inviteForm,
    suggestions,
    busy,
    onInviteFormChange,
    onAddSuggestion,
    onInvite,
    onUpdateMember,
    onRemoveMember,
}) {
    return (
        <SectionCard title="Members">
            <AddMemberPanel
                form={inviteForm}
                suggestions={suggestions}
                busy={busy}
                onChange={onInviteFormChange}
                onAddSuggestion={onAddSuggestion}
                onInvite={onInvite}
            />

            <div className="mt-5 space-y-3">
                {roster.members.length ? (
                    roster.members.map((member) => (
                        <MemberRow
                            key={member.id}
                            roster={roster}
                            member={member}
                            onChange={(updates) => onUpdateMember(member.id, updates)}
                            onRemove={() => onRemoveMember(member.id)}
                        />
                    ))
                ) : (
                    <div className="rounded-2xl bg-white/[0.025] px-4 py-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                        <p className="text-sm font-semibold text-white">No members yet.</p>
                    </div>
                )}
            </div>
        </SectionCard>
    );
}

function RolePermissionsPanel({ roster, selectedRole, onSelectedRoleChange, onTogglePermission }) {
    const permissions = rolePermissionKeys(roster, selectedRole);

    return (
        <SectionCard title="Role Permissions" dense>
            <SegmentedToggle
                items={ROSTER_ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label }))}
                value={selectedRole}
                onChange={onSelectedRoleChange}
                ariaLabel="Roster role permissions"
                className="w-full"
            />

            <div className="mt-5 space-y-2">
                {ROSTER_PERMISSION_OPTIONS.map((permission) => {
                    const active = permissions.includes(permission.key);
                    return (
                        <button
                            key={permission.key}
                            type="button"
                            onClick={() => onTogglePermission(permission.key)}
                            className={cx(
                                'w-full rounded-2xl px-4 py-3 text-left transition-colors',
                                active
                                    ? 'bg-white/[0.09] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                                    : 'bg-white/[0.035] shadow-[0_0_0_1px_rgba(255,255,255,0.055)] hover:bg-white/[0.055]'
                            )}
                        >
                            <span className="block text-sm font-semibold text-white">{permission.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-zinc-500">{permission.description}</span>
                        </button>
                    );
                })}
            </div>
        </SectionCard>
    );
}

function AssignedEvents({ roster, events }) {
    const eventsById = useMemo(() => new Map(events.map((event) => [String(event.id), event])), [events]);

    if (!roster.eventAssignments.length) {
        return (
            <div className="rounded-2xl bg-white/[0.025] px-4 py-5 text-sm text-zinc-500 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
                No events assigned.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {roster.eventAssignments.map((assignment) => {
                const assignedMembers = assignment.memberIds.length
                    ? roster.members.filter((member) => assignment.memberIds.includes(member.id)).map(memberLabel).join(', ')
                    : 'Whole team';

                return (
                    <div key={assignment.id} className="rounded-2xl bg-white/[0.035] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.055)]">
                        <p className="text-sm font-semibold text-white">
                            {eventLabel(eventsById.get(String(assignment.eventId)))}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">{assignedMembers}</p>
                    </div>
                );
            })}
        </div>
    );
}

function AssignmentPanel({ roster, events, form, onChange, onAssign }) {
    const memberMode = form.scope === 'members';

    return (
        <SectionCard
            title="Event Assignment"
            dense
            actions={
                <PrimaryButton type="button" onClick={onAssign} disabled={!form.eventId || (memberMode && !form.memberIds.length)}>
                    Assign
                </PrimaryButton>
            }
        >
            <div className="space-y-4">
                <SelectInput
                    label="Event"
                    value={form.eventId}
                    onChange={(event) => onChange({ ...form, eventId: event.target.value })}
                >
                    <option value="">Choose event</option>
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>
                            {eventLabel(event)}
                        </option>
                    ))}
                </SelectInput>

                <SegmentedToggle
                    items={[
                        { value: 'team', label: 'Whole team' },
                        { value: 'members', label: 'Members' },
                    ]}
                    value={form.scope}
                    onChange={(scope) => onChange({ ...form, scope, memberIds: scope === 'team' ? [] : form.memberIds })}
                    ariaLabel="Assignment scope"
                    className="w-full"
                />

                {memberMode ? (
                    <div className="flex flex-nowrap gap-2 overflow-x-auto dashboard-scrollbar-none">
                        {roster.members.map((member) => {
                            const active = form.memberIds.includes(member.id);
                            return (
                                <SoftButton
                                    key={member.id}
                                    type="button"
                                    active={active}
                                    onClick={() => {
                                        const memberIds = active
                                            ? form.memberIds.filter((memberId) => memberId !== member.id)
                                            : [...form.memberIds, member.id];
                                        onChange({ ...form, memberIds });
                                    }}
                                >
                                    {memberLabel(member)}
                                </SoftButton>
                            );
                        })}
                    </div>
                ) : null}

                <AssignedEvents roster={roster} events={events} />
            </div>
        </SectionCard>
    );
}

export default function TeamSecurityPage() {
    const { events } = useEvents({ limit: 100, offset: 0 });
    const [rosters, setRosters] = useState([]);
    const [selectedRosterId, setSelectedRosterId] = useState(null);
    const [createName, setCreateName] = useState('');
    const [teamForm, setTeamForm] = useState({ name: '', defaultRole: 'General Staff' });
    const [inviteForm, setInviteForm] = useState(EMPTY_INVITE_FORM);
    const [selectedRole, setSelectedRole] = useState('Co-host');
    const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM);
    const [statusMessage, setStatusMessage] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        listTeamRosters().then((nextRosters) => {
            if (!alive) return;
            const firstRoster = nextRosters[0] || null;
            setRosters(nextRosters);
            setSelectedRosterId(firstRoster?.id || null);
            if (firstRoster) {
                setTeamForm({ name: firstRoster.name, defaultRole: firstRoster.defaultRole });
                setSelectedRole(firstRoster.defaultRole || 'Co-host');
            }
        });
        return () => {
            alive = false;
        };
    }, []);

    const selectedRoster = useMemo(
        () => rosters.find((roster) => roster.id === selectedRosterId) || rosters[0] || null,
        [rosters, selectedRosterId]
    );

    const memberSuggestions = useMemo(() => {
        const query = inviteForm.query.trim().toLowerCase();
        if (!selectedRoster || !query) return [];

        const existing = new Set(
            selectedRoster.members.flatMap((member) => [member.handle, member.contact]).filter(Boolean)
        );

        return ROSTER_MEMBER_SUGGESTIONS.filter((person) => {
            if (existing.has(person.handle) || existing.has(person.contact)) return false;
            return [person.name, person.handle, person.contact, person.role].some((value) =>
                String(value || '').toLowerCase().includes(query)
            );
        });
    }, [inviteForm.query, selectedRoster]);

    const replaceRoster = (updatedRoster) => {
        if (!updatedRoster) return;
        setRosters((current) => current.map((roster) => (roster.id === updatedRoster.id ? updatedRoster : roster)));
    };

    const handleSelectRoster = (rosterId) => {
        const roster = rosters.find((candidate) => candidate.id === rosterId);
        if (!roster) return;
        setSelectedRosterId(roster.id);
        setTeamForm({ name: roster.name, defaultRole: roster.defaultRole });
        setInviteForm(EMPTY_INVITE_FORM);
        setAssignmentForm(EMPTY_ASSIGNMENT_FORM);
        setSelectedRole(roster.defaultRole || 'Co-host');
        setStatusMessage('');
    };

    const handleCreateTeam = async () => {
        const name = createName.trim();
        if (!name) return;

        setBusy(true);
        const roster = await createTeamRoster({ name, defaultRole: 'General Staff' });
        setRosters((current) => [roster, ...current]);
        setSelectedRosterId(roster.id);
        setTeamForm({ name: roster.name, defaultRole: roster.defaultRole });
        setInviteForm(EMPTY_INVITE_FORM);
        setAssignmentForm(EMPTY_ASSIGNMENT_FORM);
        setCreateName('');
        setStatusMessage('Team created.');
        setBusy(false);
    };

    const handleSaveTeam = async () => {
        if (!selectedRoster) return;

        setBusy(true);
        const updatedRoster = await updateTeamRoster(selectedRoster.id, teamForm);
        replaceRoster(updatedRoster);
        setStatusMessage('Team saved.');
        setBusy(false);
    };

    const handleAddMember = async (memberInput) => {
        if (!selectedRoster) return;

        setBusy(true);
        const updatedRoster = await addRosterMember(selectedRoster.id, memberInput);
        replaceRoster(updatedRoster);
        setInviteForm(EMPTY_INVITE_FORM);
        setStatusMessage('Member added.');
        setBusy(false);
    };

    const handleAddSuggestion = (person) => {
        void handleAddMember({
            name: person.name,
            handle: person.handle,
            contact: person.contact,
            role: person.role || inviteForm.role,
            inviteStatus: 'Invited',
        });
    };

    const handleInviteMember = () => {
        if (!inviteForm.query.trim()) return;
        void handleAddMember(buildMemberFromQuery(inviteForm.query, inviteForm.role));
    };

    const handleUpdateMember = async (memberId, updates) => {
        if (!selectedRoster) return;
        const updatedRoster = await updateRosterMember(selectedRoster.id, memberId, updates);
        replaceRoster(updatedRoster);
        setStatusMessage('Member updated.');
    };

    const handleRemoveMember = async (memberId) => {
        if (!selectedRoster) return;
        const updatedRoster = await removeRosterMember(selectedRoster.id, memberId);
        replaceRoster(updatedRoster);
        setStatusMessage('Member removed.');
    };

    const handleToggleRolePermission = async (permissionKey) => {
        if (!selectedRoster) return;
        const currentPermissions = rolePermissionKeys(selectedRoster, selectedRole);
        const permissions = currentPermissions.includes(permissionKey)
            ? currentPermissions.filter((key) => key !== permissionKey)
            : [...currentPermissions, permissionKey];
        const updatedRoster = await updateRosterRolePermissions(selectedRoster.id, selectedRole, permissions);
        replaceRoster(updatedRoster);
        setStatusMessage('Role permissions saved.');
    };

    const handleAssignRoster = async () => {
        if (!selectedRoster) return;
        const result = await assignRosterToEvent(selectedRoster.id, assignmentForm.eventId, {
            memberIds: assignmentForm.scope === 'members' ? assignmentForm.memberIds : [],
        });
        replaceRoster(result.roster);
        setStatusMessage(result.message);
    };

    if (!selectedRoster) {
        return (
            <div className="mx-auto max-w-6xl space-y-8">
                <GlowCard className="p-6">
                    <p className="text-sm text-zinc-500">Loading teams...</p>
                </GlowCard>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">Teams &amp; Security</h1>

            {statusMessage ? (
                <GlowCard className="p-4 text-sm text-zinc-300">
                    {statusMessage}
                </GlowCard>
            ) : null}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
                <TeamList
                    rosters={rosters}
                    selectedRosterId={selectedRoster.id}
                    createName={createName}
                    busy={busy}
                    onCreateNameChange={setCreateName}
                    onCreate={() => void handleCreateTeam()}
                    onSelect={handleSelectRoster}
                />

                <div className="space-y-6">
                    <TeamSettings
                        form={teamForm}
                        busy={busy}
                        onChange={setTeamForm}
                        onSave={() => void handleSaveTeam()}
                    />
                    <MembersWorkspace
                        roster={selectedRoster}
                        inviteForm={inviteForm}
                        suggestions={memberSuggestions}
                        busy={busy}
                        onInviteFormChange={setInviteForm}
                        onAddSuggestion={handleAddSuggestion}
                        onInvite={handleInviteMember}
                        onUpdateMember={(memberId, updates) => void handleUpdateMember(memberId, updates)}
                        onRemoveMember={(memberId) => void handleRemoveMember(memberId)}
                    />
                </div>

                <div className="space-y-6">
                    <RolePermissionsPanel
                        roster={selectedRoster}
                        selectedRole={selectedRole}
                        onSelectedRoleChange={setSelectedRole}
                        onTogglePermission={(permissionKey) => void handleToggleRolePermission(permissionKey)}
                    />
                    <AssignmentPanel
                        roster={selectedRoster}
                        events={events}
                        form={assignmentForm}
                        onChange={setAssignmentForm}
                        onAssign={() => void handleAssignRoster()}
                    />
                </div>
            </div>
        </div>
    );
}
