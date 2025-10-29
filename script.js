// Backend API URL
const API_BASE = 'https://corsproxy.io/?' + encodeURIComponent('https://ammad12.pythonanywhere.com');

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
        const response = await fetch(`${API_BASE}/get_file/${filename}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast("📥 File download started!", "success");
        } else {
            showToast("❌ File download failed", "error");
        }
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

// Main download function
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
    input.placeholder = "🚀 Starting actual download...";
    
    // Show progress
    const progressInterval = startProgress();
    
    try {
        // Start actual download
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
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
        clearInterval(progressInterval);
        showToast("❌ Download failed to start", "error");
        resetForm();
    }
}

// Check backend
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            const data = await response.json();
            showToast("🌐 Real Download Backend Connected!", "success");
        }
    } catch (error) {
        showToast("❌ Backend not available", "error");
    }
}

// Event listeners
button.addEventListener("click", downloadVideo);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') downloadVideo();
});

// Make downloadFile function global
window.downloadFile = downloadFile;

// Initialize
window.addEventListener('load', checkBackend);
