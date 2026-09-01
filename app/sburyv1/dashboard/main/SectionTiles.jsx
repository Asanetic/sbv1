'use client';

function Trend({ pct, compareLabel }) {
  if (!pct) return null;
  const up = pct > 0;
  const title = `${Math.abs(pct)}% ${up ? 'higher' : 'lower'} than ${compareLabel || 'the previous period'} (same number of days)`;
  return (
    <span className="trend-wrap">
      <span className={`trend ${up ? 'up' : 'down'}`} title={title}>
        {up ? '↑' : '↓'} {Math.abs(pct)}%
      </span>
      <span className="trend-caption">vs {compareLabel || 'previous period'}</span>

      <style jsx>{`
        .trend-wrap {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }
        .trend {
          font-size: 0.78rem;
          font-weight: 600;
          cursor: default;
        }
        .trend.up { color: #16a34a; }
        .trend.down { color: #dc2626; }
        .trend-caption {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      `}</style>
    </span>
  );
}

export default function SectionTiles({ title, tiles = [], note, compareLabel }) {
  return (
    <div className="section-block">
      <h6 className="section-title">{title}</h6>
      {note && <div className="section-note">{note}</div>}
      <div className="tiles-row">
        {tiles.map((t) => (
          <div className="tile" key={t.key}>
            <div className="tile-label">{t.icon ? `${t.icon} ` : ''}{t.label}</div>
            <div className="tile-value">{t.value}</div>
            <div className="tile-sub">
              {t.trendPct !== undefined ? (
                <Trend pct={t.trendPct} compareLabel={compareLabel} />
              ) : (
                <span className="tile-note">{t.note}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .section-block {
          margin-bottom: 22px;
        }
        .section-title {
          margin: 0 0 10px;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #64748b;
        }
        .section-note {
          margin: -6px 0 10px;
          font-size: 0.76rem;
          color: #94a3b8;
        }
        .tiles-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
        }
        .tile {
          background: #fff;
          border: 1px solid #e6e8ec;
          border-radius: 12px;
          padding: 16px;
        }
        .tile-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .tile-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }
        .tile-sub {
          margin-top: 4px;
          min-height: 18px;
        }
        .tile-note {
          font-size: 0.78rem;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
