/** Dotted passport watermark text — matches mobile `DottedText` (Codystar). */
export function PassportDottedText({
    text,
    fontSize = 14,
    width,
    color = 'rgba(255,255,255,0.6)',
}) {
    const svgWidth = width ?? Math.max(80, text.length * fontSize * 0.8);

    return (
        <svg
            height={fontSize + 6}
            width={svgWidth}
            aria-hidden
            className="overflow-visible"
        >
            <text
                x="50%"
                y={fontSize}
                fontSize={fontSize}
                fontFamily="var(--font-passport-dotted, Codystar, monospace)"
                fill={color}
                letterSpacing={2}
                textAnchor="middle"
            >
                {text}
            </text>
        </svg>
    );
}
