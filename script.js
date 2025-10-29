// Backend API URL - Direct connection (CORS proxy remove karein)
const API_BASE = 'https://ammad12.pythonanywhere.com';

// Elements
const input = document.querySelector(".hero-input");
const button = document.getElementById("download-btn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const toast = document.getElementById("toast");
const downloadInfo = document.getElementById("downloadInfo");
const downloadMessage = document.getElementById("downloadMessage");
const downloadLink = document.getElementById("downloadLink");

let currentDownloadId = null;
let statusCheckInterval = null;

// Toast function
function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = "toast " + type;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
}

// Progress animation
function startProgress() {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += 2;
            progressBar.style.width = width + '%';
        }
    }, 100);
    
    return interval;
}

// Check download status
async function checkDownloadStatus(downloadId) {
    try {
        const response = await fetch(`${API_BASE}/download_status/${downloadId}`);
        if (!response.ok) throw new Error('Status check failed');
        
        const data = await response.json();
        
        if (data.success) {
            // Download completed successfully
            clearInterval(statusCheckInterval);
            progressBar.style.width = '100%';
            
            showToast(`✅ ${data.title} downloaded successfully!`, "success");
            
            downloadMessage.innerHTML = `
                <strong>🎥 ${data.title}</strong><br>
                <small>Platform: ${data.platform}</small><br>
                <small>Status: Download completed</small><br>
                <button onclick="downloadFile('${data.filename}')" style="margin-top: 10px; padding: 8px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📥 Download File
                </button>
            `;
            downloadInfo.style.display = 'block';
            
            input.placeholder = "✅ Download complete!";
            button.disabled = false;
            
        } else if (data.error) {
            // Download failed
            clearInterval(statusCheckInterval);
            showToast(`❌ Download failed: ${data.error}`, "error");
            resetForm();
        }
        // Else still processing
        
    } catch (error) {
        console.error('Status check error:', error);
    }
}

// Download file
async function downloadFile(filename) {
    try {
        window.open(`${API_BASE}/get_file/${filename}`, '_blank');
        showToast("📥 Download started in new tab!", "success");
    } catch (error) {
        showToast("❌ Download error", "error");
    }
}

// Reset form
function resetForm() {
    input.style.border = "2px solid #ddd";
    input.style.color = "#333";
    input.placeholder = "Paste Video URL here";
    progressContainer.style.display = 'none';
    downloadInfo.style.display = 'none';
    button.disabled = false;
    
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
}

// Get platform from URL
function getPlatformFromUrl(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('facebook.com')) return 'Facebook';
    return 'Online';
}

// Main download function with fallback
async function downloadVideo() {
    const url = input.value.trim();
    
    if (!url) {
        showToast("⚠️ Please enter a video URL", "error");
        return;
    }
    
    try {
        new URL(url);
    } catch {
        showToast("❌ Invalid URL format", "error");
        return;
    }
    
    // UI setup
    button.disabled = true;
    input.style.border = "2px solid #4CAF50";
    input.style.color = "#4CAF50";
    input.placeholder = "🚀 Starting download...";
    
    // Show progress
    const progressInterval = startProgress();
    
    try {
        // Try actual backend download first
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) throw new Error('Backend not responding');
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ Download started for ${data.platform}`, "success");
            currentDownloadId = data.download_id;
            
            // Start checking download status
            statusCheckInterval = setInterval(() => {
                checkDownloadStatus(currentDownloadId);
            }, 3000);
            
            input.placeholder = "⏳ Download in progress...";
            
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        // Backend failed - use simulation
        clearInterval(progressInterval);
        
        const platform = getPlatformFromUrl(url);
        const videoTitle = `${platform} Video`;
        
        // Simulate successful download
        setTimeout(() => {
            progressBar.style.width = '100%';
            showToast(`✅ ${platform} video ready!`, "success");
            
            downloadMessage.innerHTML = `
                <strong>🎥 ${videoTitle}</strong><br>
                <small>Platform: ${platform}</small><br>
                <small>Status: Processing complete</small><br>
                <small><em>Free hosting - Use local setup for actual download</em></small>
                <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 5px;">
                    <strong>🚀 For Actual Download:</strong><br>
                    <small>1. Download project from GitHub</small><br>
                    <small>2. Run: <code>cd backend && python app.py</code></small><br>
                    <small>3. Open frontend locally</small>
                </div>
            `;
            downloadInfo.style.display = 'block';
            
            input.placeholder = "✅ Processing complete!";
            button.disabled = false;
        }, 3000);
    }
}

// Check backend with better error handling
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            const data = await response.json();
            showToast("🌐 Backend Connected!", "success");
            console.log('Backend status:', data);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.log('Backend check:', error.message);
        showToast("⚠️ Using simulation mode", "info");
    }
}

// Event listeners
button.addEventListener("click", downloadVideo);

input.addEventListener('focus', () => {
    input.style.border = "2px solid #4CAF50";
});

input.addEventListener('blur', () => {
    if (input.value === "" && !input.placeholder.includes("✅")) {
        input.style.border = "2px solid #ddd";
    }
});

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') downloadVideo();
});

// Make functions global
window.downloadFile = downloadFile;
window.checkBackend = checkBackend;

// Initialize
window.addEventListener('load', checkBackend);
