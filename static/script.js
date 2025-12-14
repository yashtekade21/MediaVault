const form = document.getElementById('downloadForm');
const statusDiv = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');
const videoUrlInput = document.getElementById('videoUrl');
const formatOptions = document.querySelectorAll('input[name="format"]');
const qualityGroup = document.getElementById('qualityGroup');
const qualityLoading = document.getElementById('qualityLoading');
const qualityError = document.getElementById('qualityError');
const qualityOptions = document.getElementById('qualityOptions');

const SUPPORTED_PLATFORMS = {
    youtube: {
        domains: ['youtube.com', 'youtu.be'],
        patterns: [/(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/],
        minIdLength: 11
    },
    instagram: {
        domains: ['instagram.com'],
        patterns: [/instagram\.com\/(p|reel|tv)\/[\w-]+/],
        minIdLength: 10
    },
    facebook: {
        domains: ['facebook.com'],
        patterns: [/facebook\.com\/.+\/videos?\//],
        minIdLength: 5
    },
    tiktok: {
        domains: ['tiktok.com'],
        patterns: [/tiktok\.com\/@.+\/video\/\d+/],
        minIdLength: 5
    },
    twitter: {
        domains: ['twitter.com', 'x.com'],
        patterns: [/(?:twitter\.com|x\.com)\/.+\/status\/\d+/],
        minIdLength: 5
    },
    twitch: {
        domains: ['twitch.tv'],
        patterns: [/twitch\.tv\/videos\/\d+|twitch\.tv\/.+\/clip\//],
        minIdLength: 5
    },
    vimeo: {
        domains: ['vimeo.com'],
        patterns: [/vimeo\.com\/\d+/],
        minIdLength: 5
    },
    dailymotion: {
        domains: ['dailymotion.com'],
        patterns: [/dailymotion\.com\/video\/[\w-]+/],
        minIdLength: 5
    },
    pinterest: {
        domains: ['pinterest.com'],
        patterns: [/pinterest\.com\/pin\/\d+/],
        minIdLength: 10
    },
    reddit: {
        domains: ['reddit.com'],
        patterns: [/reddit\.com\/r\/.+\/comments\//],
        minIdLength: 5
    }
};

function validateURLFormat(url) {
    try {
        if (!url || url.trim() === '') {
            return { valid: false, message: 'Please enter a valid URL' };
        }

        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        const fullUrl = urlObj.toString();

        for (const [platform, config] of Object.entries(SUPPORTED_PLATFORMS)) {
            const hasDomain = config.domains.some(domain => urlObj.hostname.includes(domain));
            
            if (hasDomain) {
                const hasValidPattern = config.patterns.some(pattern => pattern.test(fullUrl));
                
                if (hasValidPattern) {
                    const videoId = extractVideoId(fullUrl, platform);
                    if (videoId && videoId.length >= config.minIdLength) {
                        return { valid: true, message: 'Valid URL', platform };
                    } else {
                        return { 
                            valid: false, 
                            message: `Invalid video ID. The URL appears to be incomplete or corrupted.` 
                        };
                    }
                } else {
                    return { 
                        valid: false, 
                        message: `Invalid ${platform} URL. Make sure it's a direct link to the video.` 
                    };
                }
            }
        }

        return { 
            valid: false, 
            message: 'Unsupported platform. Supported: YouTube, Instagram, Facebook, TikTok, Twitter, Twitch, Vimeo, DailyMotion, Pinterest, Reddit' 
        };

    } catch (error) {
        return { 
            valid: false, 
            message: 'Invalid URL format. Please enter a valid video link' 
        };
    }
}

function extractVideoId(url, platform) {
    const patterns = {
        youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
        instagram: /instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/,
        tiktok: /tiktok\.com\/@.+\/video\/(\d+)/,
        twitter: /(?:twitter\.com|x\.com)\/.+\/status\/(\d+)/,
        vimeo: /vimeo\.com\/(\d+)/,
        pinterest: /pinterest\.com\/pin\/(\d+)/
    };

    const pattern = patterns[platform];
    const match = url.match(pattern);
    return match ? match[match.length - 1] : null;
}

function getUserFriendlyError(errorMessage) {
    const errorLower = errorMessage.toLowerCase();

    if (errorLower.includes('truncated') || errorLower.includes('incomplete')) {
        return 'The video URL appears to be incomplete or corrupted. Please check and try again.';
    }
    if (errorLower.includes('404') || errorLower.includes('not found')) {
        return 'Video not found. The video may have been deleted or the URL is incorrect.';
    }
    if (errorLower.includes('403') || errorLower.includes('forbidden')) {
        return 'Access denied. This video may be private or restricted.';
    }
    if (errorLower.includes('410') || errorLower.includes('deleted')) {
        return 'Video has been deleted.';
    }
    if (errorLower.includes('unavailable')) {
        return 'Video is currently unavailable.';
    }
    if (errorLower.includes('private')) {
        return 'This video is private and cannot be accessed.';
    }
    if (errorLower.includes('age')) {
        return 'This video may be age-restricted.';
    }
    if (errorLower.includes('geo') || errorLower.includes('region')) {
        return 'This video is not available in your region.';
    }
    if (errorLower.includes('copyright')) {
        return 'This video has copyright restrictions.';
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
        return 'Network error. Please check your connection and try again.';
    }

    return `Unable to process video: ${errorMessage}`;
}

async function validateURLExists(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors'
        });

        if (response.ok || response.status === 200 || response.status === 204) {
            return { valid: true, message: 'URL verified' };
        } else if (response.status === 404) {
            return { valid: false, message: 'Video not found (404)' };
        } else if (response.status === 403) {
            return { valid: false, message: 'Access denied to this video (403)' };
        } else if (response.status === 410) {
            return { valid: false, message: 'Video has been deleted (410)' };
        } else {
            return { valid: true, message: 'URL format valid' };
        }
    } catch (error) {
        return { valid: true, message: 'URL format valid' };
    }
}

function clearQualityOptions() {
    qualityLoading.classList.remove('show');
    qualityError.classList.remove('show');
    qualityOptions.innerHTML = '';
}

function updateButtonState() {
    const url = videoUrlInput.value.trim();
    const formatValidation = validateURLFormat(url);
    
    if (formatValidation.valid) {
        downloadBtn.disabled = false;
        statusDiv.className = '';
        statusDiv.innerHTML = '';
    } else {
        downloadBtn.disabled = true;
        if (url.length > 0) {
            showStatus(formatValidation.message, 'error');
        } else {
            statusDiv.className = '';
            statusDiv.innerHTML = '';
        }
    }
}

videoUrlInput.addEventListener('input', () => {
    const url = videoUrlInput.value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    
    updateButtonState();
    
    if (format === 'mp4' && url) {
        const formatValidation = validateURLFormat(url);
        if (formatValidation.valid) {
            clearQualityOptions();
            loadFormats(url);
        } else {
            clearQualityOptions();
        }
    }
});

videoUrlInput.addEventListener('blur', async () => {
    const url = videoUrlInput.value.trim();
    if (url.length > 0) {
        const formatValidation = validateURLFormat(url);
        if (!formatValidation.valid) {
            showStatus(formatValidation.message, 'error');
            return;
        }

        showStatus('Verifying URL...', 'loading');
        const existsValidation = await validateURLExists(url);
        
        if (!existsValidation.valid) {
            showStatus(existsValidation.message, 'error');
            downloadBtn.disabled = true;
        } else {
            statusDiv.className = '';
            statusDiv.innerHTML = '';
        }
    }
});

formatOptions.forEach(option => {
    option.addEventListener('change', (e) => {
        const url = videoUrlInput.value.trim();
        const formatValidation = validateURLFormat(url);
        
        if (e.target.value === 'mp4') {
            qualityGroup.classList.add('active');
            if (formatValidation.valid && url) {
                clearQualityOptions();
                loadFormats(url);
            }
        } else {
            qualityGroup.classList.remove('active');
            clearQualityOptions();
        }
    });
});

async function loadFormats(url) {
    qualityLoading.classList.add('show');
    qualityError.classList.remove('show');
    qualityOptions.innerHTML = '';

    try {
        const response = await fetch('/get-formats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (response.ok && data.formats && data.formats.length > 0) {
            data.formats.forEach(format => {
                const option = document.createElement('div');
                option.className = 'quality-option';
                option.innerHTML = `
                    <input type="radio" id="quality-${format.height}" name="quality" value="${format.height}">
                    <label for="quality-${format.height}">${format.resolution}</label>
                `;
                qualityOptions.appendChild(option);
            });

            document.querySelector('input[name="quality"]').checked = true;
        } else if (data.error) {
            const userFriendlyError = getUserFriendlyError(data.error);
            showQualityError(userFriendlyError);
        } else {
            showQualityError('No video formats found. Using default quality.');
        }

    } catch (error) {
        const userFriendlyError = getUserFriendlyError(error.message);
        showQualityError(userFriendlyError);
    } finally {
        qualityLoading.classList.remove('show');
    }
}

function showQualityError(message) {
    qualityError.textContent = message;
    qualityError.classList.add('show');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = videoUrlInput.value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = document.querySelector('input[name="quality"]:checked').value;

    const formatValidation = validateURLFormat(url);
    if (!formatValidation.valid) {
        showStatus(formatValidation.message, 'error');
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    showStatus('<div class="loader"></div>Downloading... Please wait', 'loading');

    try {
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, format, quality })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus(`Success! Downloading: ${data.title}`, 'success');
            
            const link = document.createElement('a');
            link.href = `/get-file/${data.filepath}`;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (data.error) {
            const userFriendlyError = getUserFriendlyError(data.error);
            showStatus(`Error: ${userFriendlyError}`, 'error');
        } else {
            showStatus('Error: Unable to process download. Please try again.', 'error');
        }
    } catch (error) {
        const userFriendlyError = getUserFriendlyError(error.message);
        showStatus(`Error: ${userFriendlyError}`, 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download';
    }
});

function showStatus(message, type) {
    statusDiv.innerHTML = message;
    statusDiv.className = `status ${type}`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('mp3').checked = true;
    qualityGroup.classList.remove('active');
    clearQualityOptions();
    downloadBtn.disabled = true;
});
