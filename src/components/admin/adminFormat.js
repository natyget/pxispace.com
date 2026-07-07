export function adminErrorMessage(error, fallback = 'Unable to load this admin view.') {
    const message = error?.data?.error || error?.message || '';
    if (error?.status === 404 || /not found/i.test(message)) {
        return 'This admin data source is not available in this environment yet.';
    }
    return message || fallback;
}
