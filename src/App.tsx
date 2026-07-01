import { Canvas } from './Canvas';
import { BgPanel } from './BgPanel';

export function App() {
  return (
    <div className="flex flex-col h-full">
      <header className="studio-topbar relative z-20 flex-none flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="brand-display text-[30px] leading-none sm:text-[34px]">Freeform</span>
          <span className="hidden h-8 w-px rotate-12 bg-brdr/60 sm:block" />
        </div>
        <span className="max-w-[36rem] text-[12px] font-bold uppercase leading-snug text-muted">
          place anything, anywhere - drag a widget by its header
        </span>
        <div className="ml-auto">
          <BgPanel />
        </div>
      </header>
      <Canvas />
    </div>
  );
}
