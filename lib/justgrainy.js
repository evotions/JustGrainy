class JustGrainy
{
    constructor(options = {})
    {
        this.animationFrameId = null;

        // (1) One reusable canvas + context for the entire lifetime of this instance
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.options = {
            blendMode: options.blendMode || 'screen',
            canvasSize: options.canvasSize || 128,
            grainPixelScale: options.grainPixelScale || 1,
            monochrome: options.monochrome !== undefined ? options.monochrome : false,
            animated: options.animated !== undefined ? options.animated : true,
            fps: options.fps || 2,
            smoothTransition: options.smoothTransition !== undefined ? options.smoothTransition : true,
            smoothTransitionDuration: options.smoothTransitionDuration || 400,
            flickerFree: options.flickerFree !== undefined ? options.flickerFree : false,
            performanceMode: options.performanceMode || false,
            colorTint: options.colorTint || 'rgb(0, 139, 231)',
            maxOpacity: options.maxOpacity !== undefined
                ? Math.max(0, Math.min(1, options.maxOpacity))
                : 1
        };

        this.isEnabled = true;
        this.setupOverlay();
        this.setupLayers();
        this.init();
    }

    setupOverlay()
    {
        this.overlay = document.querySelector('.grain-overlay');
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'grain-overlay';
            document.body.appendChild(this.overlay);
        }

        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 999999,
            mixBlendMode: this.options.blendMode
        });
    }

    setupLayers()
    {
        // Create three layers (2 for transitions, 1 persistent for flicker-free)
        this.backgroundLayers = [
            document.createElement('div'),  // Layer 0
            document.createElement('div'),  // Layer 1
            document.createElement('div')   // Layer 2 (persistent/flicker-free)
        ];

        this.backgroundLayers.forEach((layer, index) =>
        {
            layer.style.position = 'absolute';
            layer.style.top = '0';
            layer.style.left = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.transition = 'none';
            layer.style.imageRendering = 'pixelated';

            if (this.options.flickerFree && index === 2) {
                layer.style.opacity = (this.options.maxOpacity * 0.5).toString();
            } else {
                layer.style.opacity = (index === 0)
                    ? this.options.maxOpacity.toString()
                    : '0';
            }

            this.overlay.appendChild(layer);
        });

        this.currentLayerIndex = 0;
    }

    init()
    {
        // Initialize the single reusable canvas size
        this.canvas.width = this.options.canvasSize;
        this.canvas.height = this.options.canvasSize;

        // Generate the grain textures
        this.setupGrain();

        // Apply color tint if specified
        if (this.options.colorTint) {
            this.applyColorTint(this.options.colorTint);
        }

        // Start animation if enabled
        if (this.options.animated) {
            this.startAnimation();
        }
    }

    generateGrainTexture(ctx, width, height)
    {
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        if (this.options.monochrome) {
            for (let i = 0; i < data.length; i += 4) {
                const value = Math.random() * 255;
                data[i] = data[i + 1] = data[i + 2] = value;
                data[i + 3] = 255;
            }
        } else {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.random() * 255; // R
                data[i + 1] = Math.random() * 255; // G
                data[i + 2] = Math.random() * 255; // B
                data[i + 3] = 255;                 // A
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    startAnimation()
    {
        let lastFrame = performance.now();
        const frameInterval = 1000 / this.options.fps;

        const animate = (currentTime) =>
        {
            if (!this.isEnabled) {
                this.animationFrameId = null;
                return;
            }

            const elapsed = currentTime - lastFrame;
            if (elapsed > frameInterval) {
                this.renderFrame();
                lastFrame = currentTime - (elapsed % frameInterval);
            }

            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    renderFrame()
    {
        // (2) Reuse the same single canvas & context each frame.
        this.generateGrainTexture(this.ctx, this.canvas.width, this.canvas.height);

        const grainUrl = this.canvas.toDataURL('image/png');
        const scaledSize = this.options.canvasSize * this.options.grainPixelScale;

        if (this.options.flickerFree) {
            // Flicker-free mode: update only the persistent layer
            this.backgroundLayers[2].style.backgroundImage = `url(${grainUrl})`;
            this.backgroundLayers[2].style.backgroundSize = `${scaledSize}px ${scaledSize}px`;
        } else {
            // Transition mode: swap between layer 0 and 1
            const nextLayerIndex = (this.currentLayerIndex + 1) % 2;
            const currentLayer = this.backgroundLayers[this.currentLayerIndex];
            const nextLayer = this.backgroundLayers[nextLayerIndex];

            nextLayer.style.backgroundImage = `url(${grainUrl})`;
            nextLayer.style.backgroundSize = `${scaledSize}px ${scaledSize}px`;

            if (this.options.smoothTransition) {
                this.transitionOpacity(currentLayer, nextLayer);
            } else {
                currentLayer.style.opacity = '0';
                nextLayer.style.opacity = this.options.maxOpacity.toString();
            }

            this.currentLayerIndex = nextLayerIndex;
        }
    }

    transitionOpacity(fromElement, toElement)
    {
        const duration = this.options.smoothTransitionDuration;
        const startTime = performance.now();

        const startOpacityFrom = parseFloat(fromElement.style.opacity);
        const startOpacityTo = parseFloat(toElement.style.opacity);
        const targetOpacityFrom = 0;
        const targetOpacityTo = this.options.maxOpacity;

        const animate = (now) =>
        {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);

            const newOpacityFrom = startOpacityFrom + (targetOpacityFrom - startOpacityFrom) * t;
            const newOpacityTo = startOpacityTo + (targetOpacityTo - startOpacityTo) * t;

            fromElement.style.opacity = newOpacityFrom.toString();
            toElement.style.opacity = newOpacityTo.toString();

            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    applyColorTint(color)
    {
        if (!color) return;

        if (this.tintLayer) {
            this.overlay.removeChild(this.tintLayer);
        }

        this.tintLayer = document.createElement('div');
        Object.assign(this.tintLayer.style, {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: color,
            mixBlendMode: 'multiply',
            opacity: 0.5
        });

        this.overlay.appendChild(this.tintLayer);
    }

    setupGrain()
    {
        // Generate initial noise for each layer once at startup
        this.backgroundLayers.forEach((layer, index) =>
        {
            // Reuse the same single canvas for initial textures
            this.generateGrainTexture(this.ctx, this.canvas.width, this.canvas.height);
            const grainUrl = this.canvas.toDataURL('image/png');

            layer.style.backgroundImage = `url(${grainUrl})`;
            layer.style.backgroundRepeat = 'repeat';

            const scaledSize = this.options.canvasSize * this.options.grainPixelScale;
            layer.style.backgroundSize = `${scaledSize}px ${scaledSize}px`;
        });
    }

    setMaxOpacity(opacity)
    {
        this.options.maxOpacity = Math.max(0, Math.min(1, opacity));
        if (this.options.flickerFree) {
            this.backgroundLayers[2].style.opacity = (this.options.maxOpacity * 0.5).toString();
        } else {
            this.backgroundLayers[this.currentLayerIndex].style.opacity =
                this.options.maxOpacity.toString();
        }
    }

    toggle()
    {
        this.isEnabled = !this.isEnabled;

        if (this.isEnabled) {
            this.setupGrain();
            if (this.options.animated) {
                this.startAnimation();
            }
        } else {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.backgroundLayers.forEach(layer =>
            {
                layer.style.backgroundImage = 'none';
            });
        }
    }

    destroy()
    {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.isEnabled = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JustGrainy;
} else if (typeof define === 'function' && define.amd) {
    define([], function () { return JustGrainy; });
} else {
    window.JustGrainy = JustGrainy;
}
