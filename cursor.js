class Cursor
{
    constructor()
    {
        this.cursor = document.querySelector('.cursor');
        this.lastX = 0;
        this.lastY = 0;
        this.lastTime = Date.now();
        this.velocity = 0;
        this.isTouch = false;
        this.baseSize = 100;
        this.maxSize = 800;
        this.currentSize = this.baseSize;
        this.targetSize = this.baseSize;
        this.smoothing = 0.03;
        this.currentX = 0;
        this.currentY = 0;
        this.isInWindow = true;

        // Set transform origin to center
        this.cursor.style.transformOrigin = 'center center';

        this.init();
        this.animate();
    }

    init()
    {
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseover', () =>
        {
            this.handleMouseEnter();
        });
        window.addEventListener('mouseout', () =>
        {
            this.handleMouseLeave();
        });
        window.addEventListener('touchstart', this.handleTouchStart.bind(this));
        window.addEventListener('touchmove', this.handleTouchMove.bind(this));
        window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    animate()
    {
        // Decay velocity regardless of window state
        this.velocity *= 0.99;

        // Set target size based on window state
        if (this.isInWindow) {
            this.targetSize = this.baseSize + (this.velocity * 500);
            this.targetSize = Math.min(this.targetSize, this.maxSize);
        } else {
            this.targetSize = 0;
        }

        // Smooth size transition
        const sizeDiff = this.targetSize - this.currentSize;
        this.currentSize += sizeDiff * this.smoothing;

        if (Math.abs(sizeDiff) > 0.01) {
            this.cursor.style.width = `${this.currentSize}px`;
            this.cursor.style.height = `${this.currentSize}px`;
            // Update position to maintain center point
            const x = this.currentX - (this.currentSize / 2);
            const y = this.currentY - (this.currentSize / 2);
            this.cursor.style.transform = `translate(${x}px, ${y}px)`;
        }

        requestAnimationFrame(this.animate.bind(this));
    }

    handleMouseMove(e)
    {
        if (this.isTouch) return;

        const currentTime = Date.now();
        const deltaTime = Math.max(currentTime - this.lastTime, 16);
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;

        // Calculate velocity with smoothing
        const newVelocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
        this.velocity = this.velocity * 0.92 + newVelocity * 0.08;
        this.velocity = Math.max(0.1, Math.min(2, this.velocity));

        // Store current mouse position
        this.currentX = e.clientX;
        this.currentY = e.clientY;

        // Update position
        const x = this.currentX - (this.currentSize / 2);
        const y = this.currentY - (this.currentSize / 2);
        this.cursor.style.transform = `translate(${x}px, ${y}px)`;

        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.lastTime = currentTime;
    }

    handleTouchStart(e)
    {
        this.isTouch = true;
        this.cursor.style.opacity = '1';
        this.isInWindow = true;

        const touch = e.touches[0];
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
        this.lastTime = Date.now();

        this.currentX = touch.clientX;
        this.currentY = touch.clientY;

        const x = this.currentX - (this.currentSize / 2);
        const y = this.currentY - (this.currentSize / 2);
        this.cursor.style.transform = `translate(${x}px, ${y}px)`;
    }

    handleTouchMove(e)
    {
        const touch = e.touches[0];
        const currentTime = Date.now();
        const deltaTime = Math.max(currentTime - this.lastTime, 16);
        const deltaX = touch.clientX - this.lastX;
        const deltaY = touch.clientY - this.lastY;

        // Calculate velocity with smoothing
        const newVelocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
        this.velocity = this.velocity * 0.92 + newVelocity * 0.08;
        this.velocity = Math.max(0.1, Math.min(2, this.velocity));

        this.currentX = touch.clientX;
        this.currentY = touch.clientY;

        const x = this.currentX - (this.currentSize / 2);
        const y = this.currentY - (this.currentSize / 2);
        this.cursor.style.transform = `translate(${x}px, ${y}px)`;

        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
        this.lastTime = currentTime;
    }

    handleTouchEnd()
    {
        this.isTouch = false;
        this.cursor.style.opacity = '0';
        this.isInWindow = false;
    }

    handleMouseEnter()
    {
        this.cursor.style.opacity = '1';
        this.isInWindow = true;
        this.velocity = 0.1; // Reset velocity when entering
    }

    handleMouseLeave()
    {
        this.cursor.style.opacity = '0';
        this.isInWindow = false;
        this.velocity = 0; // Reset velocity when leaving
    }
}

// Initialize cursor
const cursor = new Cursor();