from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp
import os
import uuid
import tempfile
from pathlib import Path
import threading
import time

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

# Use system temp directory instead of project folder
DOWNLOAD_FOLDER = tempfile.gettempdir()
MEDIAVAULT_TEMP = os.path.join(DOWNLOAD_FOLDER, 'MediaVault_Temp')
os.makedirs(MEDIAVAULT_TEMP, exist_ok=True)

print(f"Files will be stored in: {MEDIAVAULT_TEMP}")

def cleanup_file(filepath, delay=300):
    def delete():
        time.sleep(delay)
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Cleaned up: {os.path.basename(filepath)}")
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    thread = threading.Thread(target=delete)
    thread.daemon = True
    thread.start()

def cleanup_old_files():
    try:
        current_time = time.time()
        for filename in os.listdir(MEDIAVAULT_TEMP):
            filepath = os.path.join(MEDIAVAULT_TEMP, filename)
            if os.path.isfile(filepath):
                file_age = current_time - os.path.getctime(filepath)
                if file_age > 1800:  # 30 minutes
                    os.remove(filepath)
                    print(f"Cleaned old file: {filename}")
    except Exception as e:
        print(f"Startup cleanup error: {e}")

def get_video_formats(url):
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            # Extract video formats with resolution info
            video_formats = []
            seen_resolutions = set()
            
            for fmt in formats:
                height = fmt.get('height')
                width = fmt.get('width')
                ext = fmt.get('ext', 'mp4')
                
                if height and ext == 'mp4' and height not in seen_resolutions:
                    video_formats.append({
                        'height': height,
                        'width': width,
                        'resolution': f"{height}p",
                    })
                    seen_resolutions.add(height)
            
            # Sort by resolution (highest first)
            video_formats.sort(key=lambda x: x['height'], reverse=True)
            
            # Limit to top 6 quality options
            return video_formats[:6]
    
    except Exception as e:
        print(f"Error getting formats: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-formats', methods=['POST'])
def get_formats():
    try:
        data = request.json
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        formats = get_video_formats(url)
        return jsonify({'formats': formats})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['POST'])
def download():
    try:
        data = request.json
        url = data.get('url', '').strip()
        format_choice = data.get('format', 'mp4')
        quality = data.get('quality', '1080')
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        
        if format_choice == 'mp3':
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': os.path.join(MEDIAVAULT_TEMP, f'{unique_id}_%(title)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
            }
        else:
            height = int(quality)
            format_str = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[height<={height}][ext=mp4]/best[height<={height}]/best'
            
            ydl_opts = {
                'format': format_str,
                'outtmpl': os.path.join(MEDIAVAULT_TEMP, f'{unique_id}_%(title)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
                'merge_output_format': 'mp4',
            }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_title = info.get('title', 'video')
            
            # Find the downloaded file
            extension = 'mp3' if format_choice == 'mp3' else 'mp4'
            files = list(Path(MEDIAVAULT_TEMP).glob(f'{unique_id}_*'))
            
            if not files:
                return jsonify({'error': 'Download failed - file not created'}), 500
            
            filepath = str(files[0])
            filename = f"{video_title}.{extension}"
            
            # Schedule cleanup after 5 minutes
            cleanup_file(filepath, delay=300)
            
            print(f"Downloaded: {filename}")
            
            return jsonify({
                'success': True,
                'filename': filename,
                'filepath': os.path.basename(filepath),
                'title': video_title
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-file/<filename>')
def get_file(filename):
    try:
        filepath = os.path.join(MEDIAVAULT_TEMP, filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Cleanup old files on startup
    cleanup_old_files()
    
    print("Starting MediaVault server...")
    print("Open your browser at http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
