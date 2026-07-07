'use client';

export default function AdminPagination({ page, totalPages, onPageChange, disabled }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-[13px] text-white/45">
                Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={disabled || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={disabled || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
