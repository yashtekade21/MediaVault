const form = document.getElementById('downloadForm');
const statusDiv = document.getElementById('status');
const downloadBtn = document.getElementById('downloadBtn');
const videoUrlInput = document.getElementById('videoUrl');
const formatOptions = document.querySelectorAll('input[name="format"]');
const qualityGroup = document.getElementById('qualityGroup');
const qualityLoading = document.getElementById('qualityLoading');
const qualityError = document.getElementById('qualityError');
const qualityOptions = document.getElementById('qualityOptions');


let isDownloading = false;
let lastValidatedURL = '';

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
    if (errorLower.includes('ffmpeg')) {
        return 'FFmpeg is required for MP3 downloads. Please ensure FFmpeg is installed.';
    }

    return `Unable to process video: ${errorMessage}`;
}

function clearQualityOptions() {
    qualityLoading.classList.remove('show');
    qualityError.classList.remove('show');
    qualityOptions.innerHTML = '';
}

function updateButtonState() {
    const url = videoUrlInput.value.trim();
    const formatValidation = validateURLFormat(url);
    
    if (formatValidation.valid && !isDownloading) {
        downloadBtn.disabled = false;
        if (statusDiv.classList.contains('error')) {
            statusDiv.className = '';
            statusDiv.innerHTML = '';
        }
    } else {
        downloadBtn.disabled = true;
        if (url.length > 0 && !isDownloading) {
            showStatus(formatValidation.message, 'error');
        } else if (url.length === 0 && !isDownloading) {
            statusDiv.className = '';
            statusDiv.innerHTML = '';
        }
    }
}

// Debounce function for real-time validation
let validationTimeout;
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(validationTimeout);
        validationTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

videoUrlInput.addEventListener('input', debounce(() => {
    // Skip validation during download
    if (isDownloading) {
        return;
    }
    
    const url = videoUrlInput.value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    
    // Real-time validation
    if (url.length > 0) {
        const formatValidation = validateURLFormat(url);
        
        if (formatValidation.valid) {
            lastValidatedURL = url;
            
            // Show success message
            showStatus(`Valid ${formatValidation.platform} URL detected`, 'success');
            downloadBtn.disabled = false;
            
            // Load quality options if MP4 is selected
            if (format === 'mp4') {
                clearQualityOptions();
                loadFormats(url);
            }
        } else {
            // Show error message
            showStatus(formatValidation.message, 'error');
            downloadBtn.disabled = true;
            clearQualityOptions();
        }
    } else {
        // Clear status when input is empty
        statusDiv.className = '';
        statusDiv.innerHTML = '';
        downloadBtn.disabled = true;
        clearQualityOptions();
    }
}, 500)); // 500ms delay for debouncing

formatOptions.forEach(option => {
    option.addEventListener('change', (e) => {
        // Prevent format change during download
        if (isDownloading) {
            e.preventDefault();
            // Revert to previous selection
            const previousFormat = e.target.value === 'mp3' ? 'mp4' : 'mp3';
            document.getElementById(previousFormat).checked = true;
            showStatus('Please wait for current download to finish before changing format', 'error');
            return;
        }
        
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
                    <input type="radio" id="quality-${format.height}" name="quality" value="${format.height}" ${isDownloading ? 'disabled' : ''}>
                    <label for="quality-${format.height}">${format.resolution}</label>
                `;
                qualityOptions.appendChild(option);
            });

            if (!isDownloading) {
                document.querySelector('input[name="quality"]').checked = true;
            }
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

    // Prevent multiple simultaneous downloads
    if (isDownloading) {
        showStatus('Please wait for the current download to finish', 'error');
        return;
    }

    const url = videoUrlInput.value.trim();
    const format = document.querySelector('input[name="format"]:checked').value;
    
    // Handle missing quality for MP3 format
    const qualityElement = document.querySelector('input[name="quality"]:checked');
    const quality = qualityElement ? qualityElement.value : '1080';

    console.log('=== Download Started ===');
    console.log('URL:', url);
    console.log('Format:', format);
    console.log('Quality:', quality);

    const formatValidation = validateURLFormat(url);
    if (!formatValidation.valid) {
        showStatus(formatValidation.message, 'error');
        return;
    }

    isDownloading = true;
    lastValidatedURL = url;
    
    // Disable all inputs
    videoUrlInput.disabled = true;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Processing...';
    
    // Disable format radio buttons
    formatOptions.forEach(option => option.disabled = true);
    
    // Disable quality radio buttons
    const qualityRadios = document.querySelectorAll('input[name="quality"]');
    qualityRadios.forEach(radio => radio.disabled = true);
    
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
        console.log('Server response:', data);

        if (response.ok && data.success) {
            showStatus(`Success! Downloading: ${data.title}`, 'success');
            
            // Create and trigger download
            const link = document.createElement('a');
            link.href = `/get-file/${data.filepath}`;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Reset after successful download
            setTimeout(() => {
                resetDownloadState();
                showStatus('Download complete! Ready for next download.', 'success');
            }, 2000);
            
        } else if (data.error) {
            const userFriendlyError = getUserFriendlyError(data.error);
            showStatus(`Error: ${userFriendlyError}`, 'error');
            resetDownloadState();
        } else {
            showStatus('Error: Unable to process download. Please try again.', 'error');
            resetDownloadState();
        }
    } catch (error) {
        console.error('Download error:', error);
        const userFriendlyError = getUserFriendlyError(error.message);
        showStatus(`Error: ${userFriendlyError}`, 'error');
        resetDownloadState();
    }
});


function resetDownloadState() {
    isDownloading = false;
    
    // Re-enable all inputs
    videoUrlInput.disabled = false;
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download';
    
    // Re-enable format radio buttons
    formatOptions.forEach(option => option.disabled = false);
    
    // Re-enable quality radio buttons
    const qualityRadios = document.querySelectorAll('input[name="quality"]');
    qualityRadios.forEach(radio => radio.disabled = false);
    
    // Re-validate current URL
    updateButtonState();
}

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
