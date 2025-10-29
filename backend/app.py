from flask import Flask, request, jsonify, send_file
import os
import sys

app = Flask(__name__)

# CORS headers manually add karein
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Create downloads directory if it doesn't exist
DOWNLOAD_FOLDER = 'downloads'
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

def detect_platform(url):
    """Detect which platform the URL belongs to"""
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

def download_video(url):
    """Download video using yt-dlp"""
    try:
        import yt_dlp
        
        ydl_opts = {
            'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
            'format': 'best',
            'quiet': False,  # Debug ke liye
        }
        
        print(f"📥 Downloading video from: {url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            print(f"✅ Download successful: {filename}")
            return {
                'success': True,
                'filename': os.path.basename(filename),
                'title': info.get('title', 'video'),
                'platform': detect_platform(url)
            }
    except Exception as e:
        print(f"❌ Download error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/download', methods=['POST', 'OPTIONS'])
def download_video_route():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Debug info
        print(f"📨 Received request from: {request.remote_addr}")
        print(f"📦 Headers: {dict(request.headers)}")
        
        data = request.get_json()
        if not data:
            print("❌ No JSON data received")
            return jsonify({'success': False, 'error': 'No JSON data received'})
            
        url = data.get('url', '').strip()
        print(f"🔗 URL received: {url}")
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'})
        
        # Detect platform
        platform = detect_platform(url)
        if platform == 'Unknown':
            return jsonify({'success': False, 'error': 'Unsupported platform. Supported: YouTube, TikTok, Instagram, Facebook'})
        
        print(f"🔄 Processing {platform} video...")
        
        # Download video
        result = download_video(url)
        return jsonify(result)
            
    except Exception as e:
        print(f"💥 Server error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

@app.route('/get_file/<filename>', methods=['GET'])
def get_file(filename):
    """Serve the downloaded file"""
    try:
        # Security check
        if '..' in filename or filename.startswith('/'):
            return jsonify({'success': False, 'error': 'Invalid filename'})
            
        file_path = os.path.join(DOWNLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            print(f"📤 Serving file: {filename}")
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'success': False, 'error': 'File not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'Server is running', 
        'version': '1.0',
        'downloads_folder': DOWNLOAD_FOLDER
    })

@app.route('/test', methods=['GET'])
def test():
    """Simple test endpoint"""
    return jsonify({'message': 'Test successful!', 'status': 'working'})

if __name__ == '__main__':
    print("🚀 Starting Video Downloader Server...")
    print("📍 Server running on: http://localhost:5000")
    print("📋 API Endpoints:")
    print("   GET  /status - Check server status")
    print("   GET  /test - Test connection")
    print("   POST /download - Download video")
    print("   GET  /get_file/<filename> - Download file")
    print("=" * 50)
    
    try:
        app.run(debug=True, host='127.0.0.1', port=5000, threaded=True)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        input("Press Enter to exit...")
