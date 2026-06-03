'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEventYear } from '@/utils/stampLayout';

/**
 * Season filter shared by all web passport stamp surfaces.
 * @param {Array<{ id: string, startDate: string }>} attendedEvents
 */
export function usePassportSeason(attendedEvents) {
    const [selectedSeason, setSelectedSeason] = useState(null);

    const availableYears = useMemo(() => {
        const years = [...new Set((attendedEvents ?? []).map((e) => getEventYear(e.startDate)))].sort(
            (a, b) => b - a,
        );
        return years;
    }, [attendedEvents]);

    useEffect(() => {
        if (
            availableYears.length > 0 &&
            (selectedSeason === null || !availableYears.includes(selectedSeason))
        ) {
            setSelectedSeason(availableYears[0]);
        }
    }, [availableYears, selectedSeason]);

    const filteredEvents = useMemo(() => {
        if (selectedSeason === null) return attendedEvents ?? [];
        return (attendedEvents ?? []).filter((e) => getEventYear(e.startDate) === selectedSeason);
    }, [attendedEvents, selectedSeason]);

    return {
        availableYears,
        selectedSeason,
        setSelectedSeason,
        filteredEvents,
    };
}
