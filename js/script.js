document.addEventListener('DOMContentLoaded', () => {
    const photo = document.getElementById('photo');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const storyContent = document.getElementById('story-content');
    const increaseFontBtn = document.getElementById('increase-font-btn');
    const decreaseFontBtn = document.getElementById('decrease-font-btn');
    const lightModeBtn = document.getElementById('light-mode-btn');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const fitViewBtn = document.getElementById('fit-view-btn');
    const zoomStateBtn = document.getElementById('zoom-state-btn'); // New button
    const fontSelect = document.getElementById('font-select');
    const increaseLineSpacingBtn = document.getElementById('increase-line-spacing-btn');
    const decreaseLineSpacingBtn = document.getElementById('decrease-line-spacing-btn');

    let currentPhotoIndex = 0;
    let photos = [];
    let fontSize = parseInt(getComputedStyle(storyContent).fontSize);
    let lineHeight = parseFloat(getComputedStyle(storyContent).lineHeight);
    let zoomLevel = 1;
    let isDragging = false;
    let startX, startY, currentX, currentY, translateX = 0, translateY = 0;
    let isZoomStateEnabled = localStorage.getItem('isZoomStateEnabled') === 'true';
    let isFullScreen = false;

    function loadPhotos() {
        fetch('img-source/')
            .then(response => response.text())
            .then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const links = doc.querySelectorAll('a');
                photos = Array.from(links).map(link => link.href.split('/').pop()).filter(Boolean);
                if (photos.length > 0) {
                    updatePhoto();
                } else {
                    photo.src = ''; // Clear the src if no photos are available
                }
            })
            .catch(error => {
                console.error('Error loading photos:', error);
            });
    }

    function updatePhoto() {
        if (photos.length > 0) {
            photo.src = `img-source/${photos[currentPhotoIndex]}`;
            localStorage.setItem('currentPhotoIndex', currentPhotoIndex);
            if (isZoomStateEnabled) {
                restoreZoomState();
            } else {
                fitViewBtn.click(); // Reset to fit-to-view default
            }
        } else {
            photo.src = ''; // Clear the src if no photos are available
        }
    }

    prevBtn.addEventListener('click', () => {
        if (photos.length > 0) {
            currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            updatePhoto();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (photos.length > 0) {
            currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            updatePhoto();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' && photos.length > 0) {
            currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            updatePhoto();
        } else if (event.key === 'ArrowRight' && photos.length > 0) {
            currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            updatePhoto();
        } else if (event.key === 'ArrowUp') {
            storyContent.scrollBy(0, -20);
            saveScrollPosition();
        } else if (event.key === 'ArrowDown') {
            storyContent.scrollBy(0, 20);
            saveScrollPosition();
        }
    });

    function loadStory() {
        fetch('story-source/story.md')
            .then(response => response.text())
            .then(text => {
                storyContent.innerHTML = marked(text);
                addIntentions();
                restoreScrollPosition();
            })
            .catch(error => {
                console.error('Error loading story:', error);
            });
    }

    function addIntentions() {
        const paragraphs = storyContent.querySelectorAll('p');
        paragraphs.forEach(p => {
            const intention = document.createElement('span');
            intention.style.fontWeight = 'bold';
            p.insertBefore(intention, p.firstChild);
        });
    }

    increaseFontBtn.addEventListener('click', () => {
        fontSize += 2;
        storyContent.style.fontSize = `${fontSize}px`;
        localStorage.setItem('fontSize', fontSize);
    });

    decreaseFontBtn.addEventListener('click', () => {
        fontSize -= 2;
        storyContent.style.fontSize = `${fontSize}px`;
        localStorage.setItem('fontSize', fontSize);
    });

    increaseLineSpacingBtn.addEventListener('click', () => {
        lineHeight += 0.1;
        storyContent.style.lineHeight = lineHeight;
        localStorage.setItem('lineHeight', lineHeight);
    });

    decreaseLineSpacingBtn.addEventListener('click', () => {
        lineHeight -= 0.1;
        if (lineHeight < 1) lineHeight = 1; // Prevent line height from going below 1
        storyContent.style.lineHeight = lineHeight;
        localStorage.setItem('lineHeight', lineHeight);
    });

    lightModeBtn.addEventListener('click', () => {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    });

    darkModeBtn.addEventListener('click', () => {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    });

    function saveScrollPosition() {
        localStorage.setItem('scrollPosition', storyContent.scrollTop);
    }

    function restoreScrollPosition() {
        const scrollPosition = localStorage.getItem('scrollPosition');
        if (scrollPosition) {
            storyContent.scrollTop = parseInt(scrollPosition);
        }
    }

    // Initialize with the last state
    currentPhotoIndex = parseInt(localStorage.getItem('currentPhotoIndex')) || 0;
    loadPhotos();
    loadStory();

    fontSize = parseInt(localStorage.getItem('fontSize')) || 16;
    storyContent.style.fontSize = `${fontSize}px`;

    lineHeight = parseFloat(localStorage.getItem('lineHeight')) || 1.5;
    storyContent.style.lineHeight = lineHeight;

    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Ensure the photo is loaded correctly
    photo.onerror = () => {
        // If the photo fails to load, loop back to the first photo
        currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
        updatePhoto();
    };

    zoomInBtn.addEventListener('click', () => {
        zoomLevel += 0.1;
        updateTransform();
    });

    zoomOutBtn.addEventListener('click', () => {
        zoomLevel -= 0.1;
        if (zoomLevel < 0.1) zoomLevel = 0.1; // Prevent zooming out too much
        updateTransform();
    });

    fitViewBtn.addEventListener('click', () => {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    });

    photo.addEventListener('mousedown', (e) => {
        isDragging = true;
        photo.classList.add('dragging');
        startX = e.pageX - translateX;
        startY = e.pageY - translateY;
    });

    photo.addEventListener('mouseleave', () => {
        isDragging = false;
        photo.classList.remove('dragging');
    });

    photo.addEventListener('mouseup', () => {
        isDragging = false;
        photo.classList.remove('dragging');
        saveZoomState();
    });

    photo.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.pageX;
        currentY = e.pageY;
        translateX = currentX - startX;
        translateY = currentY - startY;
        updateTransform();
    });

    photo.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomLevel += delta;
        if (zoomLevel < 0.1) zoomLevel = 0.1; // Prevent zooming out too much
        updateTransform();
        saveZoomState(); // Save zoom state on scroll
    });

    // Prevent dragging the photo as a file
    photo.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    function updateTransform() {
        photo.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    }

    function saveZoomState() {
        localStorage.setItem('zoomLevel', zoomLevel);
        localStorage.setItem('translateX', translateX);
        localStorage.setItem('translateY', translateY);
    }

    function restoreZoomState() {
        zoomLevel = parseFloat(localStorage.getItem('zoomLevel')) || 1;
        translateX = parseFloat(localStorage.getItem('translateX')) || 0;
        translateY = parseFloat(localStorage.getItem('translateY')) || 0;
        updateTransform();
    }

    zoomStateBtn.addEventListener('click', () => {
        isZoomStateEnabled = !isZoomStateEnabled;
        localStorage.setItem('isZoomStateEnabled', isZoomStateEnabled);
        zoomStateBtn.innerHTML = isZoomStateEnabled ? '&#x1F512;' : '&#x1F513;'; // Lock and unlock icons
    });

    // Initialize zoom state button
    if (isZoomStateEnabled) {
        zoomStateBtn.innerHTML = '&#x1F512;'; // Lock icon
    } else {
        zoomStateBtn.innerHTML = '&#x1F513;'; // Unlock icon
    }

    // Populate font selection dropdown
    function populateFontSelect() {
        const fonts = [
            'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS',
            'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT'
        ];
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            fontSelect.appendChild(option);
        });
    }

    populateFontSelect();

    fontSelect.addEventListener('change', () => {
        const selectedFont = fontSelect.value;
        storyContent.style.fontFamily = selectedFont;
        localStorage.setItem('selectedFont', selectedFont);
    });

    // Restore selected font from localStorage
    const selectedFont = localStorage.getItem('selectedFont');
    if (selectedFont) {
        storyContent.style.fontFamily = selectedFont;
        fontSelect.value = selectedFont;
    }

    // Full-screen mode handling
    document.addEventListener('fullscreenchange', () => {
        isFullScreen = !!document.fullscreenElement;
        updateFullScreenMode();
    });

    function updateFullScreenMode() {
        if (isFullScreen) {
            document.body.classList.add('full-screen');
        } else {
            document.body.classList.remove('full-screen');
        }
    }

    // Add full-screen toggle button
    const fullScreenBtn = document.createElement('button');
    fullScreenBtn.innerHTML = '&#x1F5D6;'; // Full-screen icon
    fullScreenBtn.addEventListener('click', () => {
        if (!isFullScreen) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    document.querySelector('.controls').appendChild(fullScreenBtn);
});

// Simple Markdown parser
function marked(text) {
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    text = text.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
    text = text.replace(/\*(.*)\*/gim, '<i>$1</i>');
    text = text.replace(/`(.*?)`/gim, '<code>$1</code>');
    text = text.replace(/\n$/gim, '<br>');
    return text;
}
