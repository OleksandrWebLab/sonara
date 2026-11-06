export const IMAGE_ZOOM_STYLES = `
.sides.zoomable { height: calc(100vh - 33px); min-height: 0; }
.sides.zoomable .side { min-height: 0; }
.sides.zoomable .side-body { overflow: auto; flex-direction: row; align-items: flex-start; justify-content: flex-start; padding: 12px; min-height: 0; }
.sides.zoomable .side-body img { margin: auto; max-width: none; max-height: none; flex: none; }
.zoom-bar { display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 12px; border-bottom: 1px solid var(--vscode-editorGroup-border); background: var(--vscode-editor-background); }
.zoom-bar button { background: none; border: 1px solid transparent; border-radius: 3px; color: var(--vscode-foreground); cursor: pointer; padding: 2px 8px; font: inherit; }
.zoom-bar button:hover { background: var(--vscode-toolbar-hoverBackground); }
.zoom-bar button.active { border-color: var(--vscode-focusBorder); }
.zoom-level { min-width: 48px; text-align: center; color: var(--vscode-descriptionForeground); }
`;

export const IMAGE_ZOOM_BAR = `<div class="zoom-bar">
<button type="button" data-zoom="out" title="Zoom Out">-</button>
<span class="zoom-level"></span>
<button type="button" data-zoom="in" title="Zoom In">+</button>
<button type="button" data-zoom="fit" title="Fit to Window">Fit</button>
<button type="button" data-zoom="actual" title="Actual Size">100%</button>
</div>`;

export const IMAGE_ZOOM_SCRIPT = `
(() => {
    const STEP = 1.25;
    const MIN_SCALE = 0.05;
    const MAX_SCALE = 32;
    const bodies = Array.from(document.querySelectorAll('.side-body'));
    const images = bodies.map(body => body.querySelector('img'));
    const level = document.querySelector('.zoom-level');
    const fitButton = document.querySelector('[data-zoom="fit"]');
    let scale = 1;
    let isFit = true;
    let isSyncing = false;

    const loaded = () => images.filter(image => image && image.naturalWidth > 0);

    const fitScale = () => {
        const scales = bodies.flatMap((body, index) => {
            const image = images[index];
            if (!image || image.naturalWidth === 0) {
                return [];
            }
            const width = body.clientWidth - 24;
            const height = body.clientHeight - 24;
            return [Math.min(width / image.naturalWidth, height / image.naturalHeight, 1)];
        });
        return scales.length > 0 ? Math.max(Math.min(...scales), MIN_SCALE) : 1;
    };

    const apply = () => {
        for (const image of loaded()) {
            image.style.width = image.naturalWidth * scale + 'px';
            image.style.height = image.naturalHeight * scale + 'px';
        }
        level.textContent = Math.round(scale * 100) + '%';
        fitButton.classList.toggle('active', isFit);
    };

    const zoomAt = (next, body, x, y) => {
        const clamped = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
        const contentX = (body.scrollLeft + x) / scale;
        const contentY = (body.scrollTop + y) / scale;
        scale = clamped;
        isFit = false;
        apply();
        body.scrollLeft = contentX * scale - x;
        body.scrollTop = contentY * scale - y;
    };

    const zoomCentered = next => {
        const body = bodies[0];
        zoomAt(next, body, body.clientWidth / 2, body.clientHeight / 2);
    };

    const fit = () => {
        isFit = true;
        scale = fitScale();
        apply();
    };

    document.querySelector('.zoom-bar').addEventListener('click', event => {
        const action = event.target.closest('button')?.dataset.zoom;
        if (action === 'in') {
            zoomCentered(scale * STEP);
        } else if (action === 'out') {
            zoomCentered(scale / STEP);
        } else if (action === 'fit') {
            fit();
        } else if (action === 'actual') {
            zoomCentered(1);
        }
    });

    for (const body of bodies) {
        body.addEventListener('wheel', event => {
            if (!event.ctrlKey) {
                return;
            }
            event.preventDefault();
            const box = body.getBoundingClientRect();
            zoomAt(event.deltaY < 0 ? scale * STEP : scale / STEP, body, event.clientX - box.left, event.clientY - box.top);
        }, { passive: false });
        body.addEventListener('scroll', () => {
            if (isSyncing) {
                return;
            }
            isSyncing = true;
            for (const other of bodies) {
                if (other !== body) {
                    other.scrollLeft = body.scrollLeft;
                    other.scrollTop = body.scrollTop;
                }
            }
            requestAnimationFrame(() => { isSyncing = false; });
        });
    }

    for (const image of images) {
        image?.addEventListener('load', () => (isFit ? fit() : apply()));
    }
    window.addEventListener('resize', () => {
        if (isFit) {
            fit();
        }
    });
    fit();
})();
`;
