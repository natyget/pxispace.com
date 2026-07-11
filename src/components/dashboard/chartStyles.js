/** One brand purple across every dashboard chart (design law token). */
export const DASHBOARD_BRAND_COLOR = '#d84aff';

/** Secondary series / de-emphasized chart ink. */
export const DASHBOARD_MUTED_COLOR = '#a1a1aa';

/** Shared recharts <Tooltip contentStyle> so every chart pops the same panel. */
export const DASHBOARD_TOOLTIP_CONTENT_STYLE = {
    background: '#09090b',
    border: 0,
    borderRadius: 14,
    fontSize: 12,
    boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
    padding: '10px 12px',
};

export const DASHBOARD_TOOLTIP_LABEL_STYLE = {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: 700,
    fontSize: 11,
    marginBottom: 4,
};

export const DASHBOARD_TOOLTIP_ITEM_STYLE = {
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 12,
    padding: 0,
};

/** Shared axis tick styling for recharts XAxis/YAxis. */
export const DASHBOARD_AXIS_TICK = { fill: 'rgba(255,255,255,0.46)', fontSize: 11 };

/** Spread onto a recharts <Tooltip> for the shared dashboard look. */
export const DASHBOARD_TOOLTIP_PROPS = {
    contentStyle: DASHBOARD_TOOLTIP_CONTENT_STYLE,
    labelStyle: DASHBOARD_TOOLTIP_LABEL_STYLE,
    itemStyle: DASHBOARD_TOOLTIP_ITEM_STYLE,
    cursor: { stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1 },
};

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
