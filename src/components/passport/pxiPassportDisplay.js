/** Shared display fields for web PXI Passport (dashboard + public /u). */

export function getPassportAgeDisplay(user) {
    if (user?.showAge === false) return '—';
    if (typeof user?.age === 'number' && !Number.isNaN(user.age)) return user.age;
    if (!user?.birthdate) return '—';
    const birth = new Date(user.birthdate);
    if (Number.isNaN(birth.getTime())) return '—';
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a;
}

export function getPassportDisplayFields(user) {
    const fullName = user?.name ?? 'PXI CITIZEN';
    const username = user?.username ?? 'citizen';
    const city = user?.city ?? '—';
    const bio = user?.bio?.trim() ? user.bio.trim() : '—';
    const instagram = user?.instagramHandle
        ? user.instagramHandle.startsWith('@')
            ? user.instagramHandle
            : `@${user.instagramHandle}`
        : '—';
    const passportNumber = `P${String(user?.id || '').slice(0, 7).toUpperCase()}XI`;
    const passportType = user?.isVendor ? 'Diplomat' : user?.isPassportIssued ? 'Citizen' : 'Partial';

    return {
        fullName,
        username,
        city,
        bio,
        instagram,
        age: getPassportAgeDisplay(user),
        passportNumber,
        passportType,
    };
}
