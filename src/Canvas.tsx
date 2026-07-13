import { useDashboard, filtersToCss } from './store';
import { WidgetFrame } from './Widget';
import { ShaderBg } from './ShaderBg';

export function Canvas() {
  const widgets = useDashboard((s) => s.widgets);
  const canvasBg = useDashboard((s) => s.canvasBg);
  const canvasBgKind = useDashboard((s) => s.canvasBgKind);
  const filters = useDashboard((s) => s.canvasFilters);

  return (
    <div className="flex-1 overflow-auto bg-canvas">
      <div
        className={`canvas-stage relative w-[4000px] h-[3000px] ${
          canvasBg ? '' : 'canvas-grid'
        }`}
      >
        <div className="canvas-squiggle" aria-hidden="true" />
        <div className="canvas-eye" aria-hidden="true" />
        {/* Background lives on its own layer so CSS filters (blur, B&W,
            color) apply to it alone and never touch the widgets above. */}
        {canvasBg && canvasBgKind === 'shader' ? (
          <ShaderBg
            className="absolute inset-0 h-full w-full pointer-events-none"
            style={{ zIndex: 0, filter: filtersToCss(filters) }}
          />
        ) : canvasBg && canvasBgKind === 'video' ? (
          <video
            key={canvasBg}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            style={{ zIndex: 0, filter: filtersToCss(filters) }}
            src={canvasBg}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : canvasBg ? (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 0,
              backgroundImage: `url(${canvasBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: filtersToCss(filters),
            }}
          />
        ) : null}
        {widgets.map((w) => (
          <WidgetFrame key={w.id} widget={w} />
        ))}
      </div>
    </div>
  );
}
