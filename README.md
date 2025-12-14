# Video Downloader

A modern web application for downloading videos from multiple platforms in MP3 and MP4 formats.

## Features

- **Multi-Platform Support** - YouTube, Instagram, Facebook, TikTok, Twitter, Twitch, Vimeo, DailyMotion, Pinterest, Reddit
- **Format Options** - MP3 (audio) and MP4 (video)
- **Quality Selection** - Multiple quality options for MP4 downloads
- **Smart Validation** - Real-time URL validation with friendly error messages
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## Project Structure

```
video-downloader/
├── index.html          # Main HTML file
├── style.css           # Styling (embedded in HTML)
├── script.js           # Frontend logic (embedded in HTML)
├── backend/            # Backend server files
│   ├── app.py          # Flask/Express server
│   └── requirements.txt # Python dependencies
└── README.md           # This file
```

## Requirements

### Frontend
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation needed

### Backend
- Python 3.8+ (or Node.js 14+)
- pip (Python package manager)
- Internet connection
- ~500 MB disk space for dependencies

## Installation & Setup

### Step 1: Clone/Download Project
```bash
git clone https://github.com/yourusername/video-downloader.git
cd video-downloader
```

### Step 2: Install Backend Dependencies
```bash
# For Python backend
pip install -r backend/requirements.txt
```

Required packages typically include:
- `yt-dlp` - Core video downloading library
- `flask` - Web framework
- `requests` - HTTP requests

### Step 3: Run the Backend Server
```bash
# Python Flask
python backend/app.py
```

Server will run on `http://localhost:5000`

### Step 4: Open Frontend
1. Open `index.html` in your web browser
2. Or serve locally:
```bash
# Python
python -m http.server 8000

# Then visit: http://localhost:8000
```

## Usage

1. **Enter Video URL** - Paste the video link in the input field
2. **Select Format** - Choose MP3 or MP4
3. **Choose Quality** (MP4 only) - Select preferred resolution
4. **Download** - Click the Download button

## Configuration

### Backend Settings
Edit `backend/app.py` or `.env` file:
- Change server port (default: 5000)
- Set download directory
- Configure rate limiting
- Adjust timeout settings

### Supported Platforms
- YouTube
- Instagram
- Facebook
- TikTok
- Twitter/X
- Twitch
- Vimeo
- DailyMotion
- Pinterest
- Reddit

## Troubleshooting

**Download button disabled?**
- Check if URL is from a supported platform
- Ensure URL is complete and valid

**Quality options not loading?**
- Check if backend server is running on `http://localhost:5000`
- Verify video is publicly available
- Wait for server response

**Download fails?**
- Check backend server is running
- Verify video isn't restricted/private
- Try a different video
- Check browser console for errors (F12)

## Browser Support

- Chrome/Chromium ✓
- Firefox ✓
- Safari ✓
- Edge ✓
- Mobile browsers ✓

## Author

**Yash Tekade**

## License

**Copyright © 2025 Yash Tekade. All rights reserved.**

This is a proprietary project. The source code is provided for educational viewing purposes only.

**Permitted:**
- ✓ Educational viewing and learning
- ✓ Personal, non-commercial use

**Not Permitted:**
- ✗ Commercial use without written permission
- ✗ Redistribution or sharing
- ✗ Modification and republishing
- ✗ Creating derivative works

For licensing inquiries or commercial use, please contact the author.

## Disclaimer

Users are responsible for respecting copyright laws and platform terms of service when downloading content. This tool is for personal, non-commercial use only.

## Version

**v1.0.0** - December 2025

## Status

**Development Mode** - Currently running on localhost. Not yet deployed to production.

## Support

For issues and questions, please check the troubleshooting section or contact the author.

---

**Note:** This application requires a working backend server. Ensure the server is running on `http://localhost:5000` before using the frontend.
