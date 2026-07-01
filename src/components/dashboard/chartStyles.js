export const DASHBOARD_CHART_SHADES = [
    '#f4f4f5',
    '#d4d4d8',
    '#a1a1aa',
    '#71717a',
    '#52525b',
    '#3f3f46',
    '#27272a',
];

export const DASHBOARD_DONUT_SEGMENT_PROPS = {
    stroke: 'none',
    strokeWidth: 0,
};

export const DASHBOARD_TIMEFRAMES = ['1D', '1W', '1M', '1Y', 'ALL'];

export const TIME_SERIES_KEYS = {
    current: 'current',
    previous: 'previous',
};

export const TIME_SERIES_STYLES = {
    current: {
        stroke: '#ffffff',
        fill: 'rgba(255,255,255,0.18)',
    },
    previous: {
        stroke: 'rgba(161,161,170,0.58)',
        fill: 'rgba(113,113,122,0.08)',
        strokeDasharray: '4 5',
    },
};

export function getDashboardChartShade(index = 0) {
    return DASHBOARD_CHART_SHADES[index % DASHBOARD_CHART_SHADES.length];
}

export function getSingleShadeDonutCellProps(index = 0) {
    return {
        ...DASHBOARD_DONUT_SEGMENT_PROPS,
        fill: getDashboardChartShade(index),
        cornerRadius: 8,
    };
}

export function getTimeSeriesProps(series = 'current') {
    const key = TIME_SERIES_KEYS[series] || TIME_SERIES_KEYS.current;
    const styles = TIME_SERIES_STYLES[series] || TIME_SERIES_STYLES.current;
    return {
        dataKey: key,
        ...styles,
    };
}
