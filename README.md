# MediaVault

A modern web application for downloading videos from multiple platforms in MP3 and MP4 formats.

## Features

- **Multi-Platform Support** - YouTube, Instagram, Facebook, TikTok, Twitter, Twitch, Vimeo, DailyMotion, Pinterest, Reddit
- **Format Options** - MP3 (audio) and MP4 (video)
- **Quality Selection** - Multiple quality options for MP4 downloads
- **Smart Validation** - Real-time URL validation with friendly error messages
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## Project Structure

```
MediaVault/
├── app.py                      # Flask backend
├── requirements.txt            # Python dependencies
├── README.md                   # Documentation
├── LICENSE                     # Proprietary License
├── .gitignore                  # Git ignore rules
├── static/                     # Static files folder
│   ├── style.css              # Separated CSS styles
│   └── script.js              # Separated JavaScript
└── templates/                  # Flask templates folder
    └── index.html             # HTML template
```

## Requirements

### Frontend
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation needed

### Backend
- Python 3.8+
- pip (Python package manager)
- Internet connection
- ~500 MB disk space for dependencies

## Installation & Setup

### Step 1: Clone/Download Project
```bash
git clone https://github.com/yourusername/MediaVault.git
cd MediaVault
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Backend Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- `yt-dlp` - Core video downloading library
- `Flask` - Web framework
- `Flask-CORS` - Cross-origin resource sharing
- `requests` - HTTP requests

### Step 4: Run the Backend Server
```bash
python app.py
```

Server will run on `http://localhost:5000`

The Flask app will automatically serve the frontend from the `templates/` folder.

## Usage

1. Open your browser and go to `http://localhost:5000`
2. **Enter Video URL** - Paste the video link in the input field
3. **Select Format** - Choose MP3 or MP4
4. **Choose Quality** (MP4 only) - Select preferred resolution
5. **Download** - Click the Download button

## Configuration

### Backend Settings
Edit `app.py` or create `.env` file:
```
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
MAX_DOWNLOAD_SIZE=500
DOWNLOAD_TIMEOUT=300
```

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

## File Organization

### `app.py`
Main Flask application file containing:
- Route handlers for download and format endpoints
- Video validation logic
- File management

### `static/style.css`
Separated stylesheet with:
- Design system and color variables
- Component styling
- Responsive design

### `static/script.js`
Separated JavaScript file with:
- Form validation
- API calls to backend
- Error handling
- User interaction logic

### `templates/index.html`
Clean HTML template with:
- Semantic markup
- No inline CSS or JavaScript
- Form structure

## Troubleshooting

**Port already in use?**
- Change port in `app.py`: `app.run(port=5001)`

**Download button disabled?**
- Check if URL is from a supported platform
- Ensure URL is complete and valid

**Quality options not loading?**
- Check if backend server is running on `http://localhost:5000`
- Verify video is publicly available
- Check browser console for errors (F12)

**Download fails?**
- Check backend server is running
- Verify video isn't restricted/private
- Try a different video
- Check browser console for error details

**ModuleNotFoundError?**
- Ensure virtual environment is activated
- Run: `pip install -r requirements.txt`

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

**Note:** This application requires the Flask backend to be running. Start with `python app.py` and access via `http://localhost:5000`
