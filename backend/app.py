from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import threading
import time

app = Flask(__name__)

# CORS setup - Allow all origins for testing
CORS(app)

# Manual CORS headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# PythonAnywhere pe safe path
DOWNLOAD_FOLDER = '/home/ammad12/downloads'
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

download_status = {}

def detect_platform(url):
    if 'youtube.com' in url or 'youtu.be' in url:
        return 'YouTube'
    elif 'tiktok.com' in url:
        return 'TikTok'
    elif 'instagram.com' in url:
        return 'Instagram'
    elif 'facebook.com' in url or 'fb.watch' in url:
        return 'Facebook'
    else:
        return 'Unknown'

def download_video(url, download_id):
    try:
        import yt_dlp
        
        ydl_opts = {
            'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title).100s.%(ext)s'),
            'format': 'best[height<=720]',
            'quiet': True,
        }
        
        print(f"Downloading: {url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            download_status[download_id] = {
                'success': True,
                'filename': os.path.basename(filename),
                'title': info.get('title', 'video'),
                'platform': detect_platform(url)
            }
            print(f"Download completed: {filename}")
            
    except Exception as e:
        print(f"Download failed: {str(e)}")
        download_status[download_id] = {
            'success': False,
            'error': str(e)
        }

@app.route('/download', methods=['POST', 'OPTIONS'])
def download_video_route():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'})
        
        platform = detect_platform(url)
        if platform == 'Unknown':
            return jsonify({'success': False, 'error': 'Unsupported platform'})
        
        download_id = str(int(time.time() * 1000))
        download_status[download_id] = {'status': 'processing'}
        
        thread = threading.Thread(target=download_video, args=(url, download_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True, 
            'message': f'Download started for {platform}',
            'download_id': download_id
        })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/download_status/<download_id>', methods=['GET'])
def get_download_status(download_id):
    status = download_status.get(download_id, {'status': 'not_found'})
    return jsonify(status)

@app.route('/get_file/<filename>', methods=['GET'])
def get_file(filename):
    try:
        # Security check
        if '..' in filename or '/' in filename:
            return jsonify({'success': False, 'error': 'Invalid filename'})
            
        file_path = os.path.join(DOWNLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'success': False, 'error': 'File not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'Server is running on PythonAnywhere', 
        'version': '1.0',
        'hosting': 'PythonAnywhere',
        'cors_enabled': True
    })

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'CORS test successful!', 'status': 'working'})

if __name__ == '__main__':
    app.run(debug=True)
