from flask import Flask, render_template, request, send_file, jsonify
import yt_dlp
import os
import uuid
import tempfile
from pathlib import Path
import threading
import time
import re
from urllib.parse import unquote


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


def sanitize_filename(filename):
    """
    Remove or replace characters that are problematic in filenames
    """
    # Remove or replace special characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)  # Windows illegal chars
    filename = re.sub(r'[｜]', '-', filename)  # Replace special pipes
    filename = re.sub(r'[@#]', '', filename)  # Remove @ and #
    filename = re.sub(r'\s+', ' ', filename)  # Replace multiple spaces with single space
    filename = filename.strip()  # Remove leading/trailing spaces
    
    # Limit filename length (Windows has 255 char limit)
    if len(filename) > 200:
        filename = filename[:200]
    
    return filename


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
        
        # Get video title first to sanitize it
        try:
            ydl_temp = {
                'quiet': True,
                'no_warnings': True,
            }
            with yt_dlp.YoutubeDL(ydl_temp) as ydl:
                info_dict = ydl.extract_info(url, download=False)
                raw_title = info_dict.get('title', 'video')
        except:
            raw_title = 'video'
        
        # Sanitize the title
        video_title = sanitize_filename(raw_title)
        
        if format_choice == 'mp3':
            # Use sanitized filename in template
            output_file = f'{unique_id}_{video_title}.mp3'
            output_template = os.path.join(MEDIAVAULT_TEMP, output_file)
            
            ydl_opts = {
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': output_template.replace('.mp3', '.%(ext)s'),  # Let yt-dlp add extension
                'quiet': False,
                'no_warnings': False,
            }
        else:
            # Use sanitized filename in template
            output_file = f'{unique_id}_{video_title}.mp4'
            output_template = os.path.join(MEDIAVAULT_TEMP, output_file)
            
            height = int(quality)
            format_str = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[height<={height}][ext=mp4]/best[height<={height}]/best'
            
            ydl_opts = {
                'format': format_str,
                'outtmpl': output_template.replace('.mp4', '.%(ext)s'),  # Let yt-dlp add extension
                'quiet': False,
                'no_warnings': False,
                'merge_output_format': 'mp4',
            }
        
        print(f"Downloading to: {output_template}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # Find the actual downloaded file
            extension = 'mp3' if format_choice == 'mp3' else 'mp4'
            
            # Look for files matching the unique_id
            files = [f for f in os.listdir(MEDIAVAULT_TEMP) if f.startswith(unique_id)]
            
            if not files:
                print(f"Error: No files found with ID {unique_id}")
                print(f"Files in directory: {os.listdir(MEDIAVAULT_TEMP)}")
                return jsonify({'error': 'Download failed - file not created'}), 500
            
            # Get the actual filename
            actual_filename = files[0]
            filepath = os.path.join(MEDIAVAULT_TEMP, actual_filename)
            
            print(f"Found file: {actual_filename}")
            
            # Schedule cleanup after 5 minutes
            cleanup_file(filepath, delay=300)
            
            # Return the actual filename and a clean display name
            return jsonify({
                'success': True,
                'filename': f"{video_title}.{extension}",  # Display name
                'filepath': actual_filename,  # Actual file to fetch
                'title': video_title
            })
            
    except Exception as e:
        print(f"Download error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/get-file/<path:filename>')
def get_file(filename):
    try:
        # Decode URL-encoded filename
        decoded_filename = unquote(filename)
        print(f"Requesting file: {decoded_filename}")
        
        filepath = os.path.join(MEDIAVAULT_TEMP, decoded_filename)
        
        if os.path.exists(filepath):
            print(f"Sending file: {filepath}")
            
            # Extract just the title part without the unique ID
            if '_' in decoded_filename:
                clean_name = '_'.join(decoded_filename.split('_')[1:])  # Remove unique ID
            else:
                clean_name = decoded_filename
            
            return send_file(
                filepath,
                as_attachment=True,
                download_name=clean_name,  # Clean name for user's download
                mimetype='application/octet-stream'
            )
        else:
            print(f"File not found: {filepath}")
            print(f"Files in directory: {os.listdir(MEDIAVAULT_TEMP)}")
            return jsonify({'error': 'File not found'}), 404
            
    except Exception as e:
        print(f"Error serving file: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Cleanup old files on startup
    cleanup_old_files()
    
    print("Starting MediaVault server...")
    print("Open your browser at http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
