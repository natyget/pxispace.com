/**
 * Dashboard chart tokens. Colors are validated (lightness band, chroma floor,
 * adjacent-pair CVD separation, 3:1 contrast) against the effective dark chart
 * surface (the app's flat #1C1C1C card) — don't eyeball replacements, re-validate.
 */

/** Brand accent (the app purple): single-series emphasis, sparklines, selected states. */
export const DASHBOARD_BRAND_COLOR = '#A523EF';

/** Second series: the app's orange. */
export const DASHBOARD_MUTED_COLOR = '#FF5A1F';

/**
 * Categorical series slots, fixed order (identity — a series keeps its slot even
 * when others are filtered out). Never cycle past the set; fold extras into "Other".
 */
export const DASHBOARD_SERIES_COLORS = [
    '#A523EF', // purple (brand)
    '#FF5A1F', // orange (second accent)
    '#0d9488', // teal
    '#3b82f6', // blue
    '#9A9A9A', // grey
];

/**
 * Ordinal ramp for ordered stages (funnel, tiers): one hue, light→dark, so the
 * order reads as a scale instead of unrelated colors.
 */
export const DASHBOARD_ORDINAL_RAMP = [
    '#EDD3FC',
    '#DBA7F9',
    '#C470F5',
    '#A523EF',
    '#7318A7',
];

/**
 * Ordinal step for stage `index` out of `total` stages — spreads the ramp so a
 * 3-stage funnel uses light / mid / dark instead of three near-identical lights.
 */
export function getOrdinalStageColor(index = 0, total = DASHBOARD_ORDINAL_RAMP.length) {
    const last = DASHBOARD_ORDINAL_RAMP.length - 1;
    if (total <= 1) return DASHBOARD_ORDINAL_RAMP[Math.round(last / 2)];
    const position = Math.round((Math.min(index, total - 1) / (total - 1)) * last);
    return DASHBOARD_ORDINAL_RAMP[position];
}

/** Shared recharts <Tooltip contentStyle> so every chart pops the same panel. */
export const DASHBOARD_TOOLTIP_CONTENT_STYLE = {
    background: '#2E2E2E',
    border: 'none',
    borderRadius: 16,
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
export const DASHBOARD_AXIS_TICK = { fill: '#9A9A9A', fontSize: 11 };

/** Hairline solid gridline — never dashed (dashing reads as projection/threshold). */
export const DASHBOARD_GRID_STROKE = 'rgba(255,255,255,0.06)';

/** Spread onto a recharts <Tooltip> for the shared dashboard look. */
export const DASHBOARD_TOOLTIP_PROPS = {
    contentStyle: DASHBOARD_TOOLTIP_CONTENT_STYLE,
    labelStyle: DASHBOARD_TOOLTIP_LABEL_STYLE,
    itemStyle: DASHBOARD_TOOLTIP_ITEM_STYLE,
    cursor: { stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1 },
};

/** @deprecated grayscale ramp kept as an alias — new code uses DASHBOARD_SERIES_COLORS. */
export const DASHBOARD_CHART_SHADES = DASHBOARD_SERIES_COLORS;

export const DASHBOARD_DONUT_SEGMENT_PROPS = {
    stroke: '#1c1c1c',
    strokeWidth: 2,
};

export const DASHBOARD_TIMEFRAMES = ['1D', '1W', '1M', '1Y', 'ALL'];

export const TIME_SERIES_KEYS = {
    current: 'current',
    previous: 'previous',
};

export const TIME_SERIES_STYLES = {
    current: {
        stroke: DASHBOARD_BRAND_COLOR,
        fill: 'rgba(165,35,239,0.14)',
    },
    previous: {
        stroke: 'rgba(255,90,31,0.7)',
        fill: 'rgba(255,90,31,0.07)',
        strokeDasharray: '4 5',
    },
};

/** Categorical slot for series `index` — clamps at the last slot instead of cycling hues. */
export function getDashboardChartShade(index = 0) {
    return DASHBOARD_SERIES_COLORS[Math.min(Math.max(index, 0), DASHBOARD_SERIES_COLORS.length - 1)];
}

export function getSingleShadeDonutCellProps(index = 0) {
    return {
        ...DASHBOARD_DONUT_SEGMENT_PROPS,
        fill: getDashboardChartShade(index),
        cornerRadius: 6,
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
