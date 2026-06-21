// ===== CUSTOM POPUP SYSTEM =====
// Lightweight confirm/prompt/alert modal dialogs

window.PopupSystem = {
    overlay: null,
    modal: null,
    resolveCallback: null,

    init() {
        // Create popup elements if they don't exist
        if (!document.getElementById('custom-popup-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'custom-popup-overlay';
            this.overlay.className = 'custom-popup-overlay';
            this.overlay.hidden = true;
            this.overlay.innerHTML = `
                <div class="custom-popup-modal" id="custom-popup-modal">
                    <div class="custom-popup-header" id="custom-popup-header">
                        <span class="custom-popup-icon" id="custom-popup-icon">ℹ️</span>
                        <h3 class="custom-popup-title" id="custom-popup-title">Confirm</h3>
                    </div>
                    <p class="custom-popup-message" id="custom-popup-message"></p>
                    <input type="text" class="custom-popup-input" id="custom-popup-input" hidden>
                    <div class="custom-popup-actions" id="custom-popup-actions"></div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
        this.overlay = document.getElementById('custom-popup-overlay');
        this.modal = document.getElementById('custom-popup-modal');
    },

    show(options) {
        return new Promise((resolve) => {
            if (!this.overlay) this.init();

            const {
                title = 'Confirm',
                message = '',
                icon = 'ℹ️',
                showInput = false,
                inputPlaceholder = '',
                inputValue = '',
                buttons = [
                    { text: 'Cancel', action: 'cancel', variant: 'secondary' },
                    { text: 'OK', action: 'ok', variant: 'primary' }
                ],
                defaultAction = 'cancel',
                escapeCloses = true
            } = options;

            // Set content
            document.getElementById('custom-popup-icon').textContent = icon;
            document.getElementById('custom-popup-title').textContent = title;
            document.getElementById('custom-popup-message').textContent = message;

            // Handle input
            const input = document.getElementById('custom-popup-input');
            if (showInput) {
                input.hidden = false;
                input.placeholder = inputPlaceholder;
                input.value = inputValue;
                input.focus();
                setTimeout(() => input.select(), 10);
            } else {
                input.hidden = true;
            }

            // Create buttons
            const actionsContainer = document.getElementById('custom-popup-actions');
            actionsContainer.innerHTML = '';

            buttons.forEach((btn, index) => {
                const button = document.createElement('button');
                button.className = `custom-popup-btn custom-popup-btn-${btn.variant || 'secondary'}`;
                button.textContent = btn.text;
                if (btn.action === defaultAction) {
                    button.autofocus = true;
                }
                button.addEventListener('click', () => {
                    const inputValue = showInput ? input.value : null;
                    resolve({ action: btn.action, value: inputValue });
                    this.hide();
                });
                actionsContainer.appendChild(button);
            });

            // Store resolve callback
            this.resolveCallback = resolve;

            // Show overlay
            this.overlay.hidden = false;
            document.body.classList.add('no-scroll');

            // Focus default button after animation
            setTimeout(() => {
                const defaultBtn = actionsContainer.querySelector(`[autofocus]`) || actionsContainer.firstChild;
                if (defaultBtn) defaultBtn.focus();
            }, 50);

            // Handle escape key
            const escHandler = (e) => {
                if (e.key === 'Escape' && escapeCloses) {
                    document.removeEventListener('keydown', escHandler);
                    if (this.resolveCallback) {
                        resolve({ action: 'cancel', value: showInput ? input.value : null });
                        this.hide();
                    }
                }
            };
            document.addEventListener('keydown', escHandler, { once: true });
        });
    },

    hide() {
        if (this.overlay) {
            this.overlay.hidden = true;
            document.body.classList.remove('no-scroll');
            this.resolveCallback = null;
        }
    },

    // Convenience methods
    alert(message, title = 'Info') {
        return this.show({
            title,
            message,
            icon: 'ℹ️',
            buttons: [{ text: 'OK', action: 'ok', variant: 'primary' }],
            defaultAction: 'ok'
        });
    },

    confirm(message, title = 'Confirm') {
        return this.show({
            title,
            message,
            icon: '⚠️',
            buttons: [
                { text: 'Cancel', action: 'cancel', variant: 'secondary' },
                { text: 'OK', action: 'ok', variant: 'primary' }
            ],
            defaultAction: 'cancel'
        }).then(result => result.action === 'ok');
    },

    prompt(message, defaultValue = '', title = 'Input', placeholder = '') {
        return this.show({
            title,
            message,
            icon: '💬',
            showInput: true,
            inputPlaceholder: placeholder,
            inputValue: defaultValue,
            buttons: [
                { text: 'Cancel', action: 'cancel', variant: 'secondary' },
                { text: 'OK', action: 'ok', variant: 'primary' }
            ],
            defaultAction: 'cancel'
        }).then(result => result.action === 'ok' ? result.value : null);
    }
};


// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.PopupSystem.init();
});
