// Elements select kar rahe hain
// Backend API URL - PythonAnywhere
const API_BASE = 'https://ammad12.pythonanywhere.com';

// Elements select kar rahe hain
const input = document.querySelector(".hero-input");
const button = document.getElementById("download-btn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const toast = document.getElementById("toast");
const downloadInfo = document.getElementById("downloadInfo");
const downloadMessage = document.getElementById("downloadMessage");
const downloadLink = document.getElementById("downloadLink");

// Rest of your code...

// Backend API URL - PythonAnywhere
const API_BASE = 'https://ammad12.pythonanywhere.com';

// Toast notification function
function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = "toast";
    
    if (type === "error") {
        toast.classList.add("error");
    } else if (type === "success") {
        toast.classList.add("success");
    }
    
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 5000);
}

// Progress bar animation
function animateProgress(duration = 3000) {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += Math.random() * 10;
            if (width > 90) width = 90;
            progressBar.style.width = width + '%';
        }
    }, 500);
    
    return interval;
}

// Check download status
async function checkDownloadStatus(downloadId) {
    try {
        const response = await fetch(`${API_BASE}/download_status/${downloadId}`);
        const data = await response.json();
        
        if (data.success) {
            // Download completed
            clearInterval(statusCheckInterval);
            progressBar.style.width = '100%';
            
            showToast(`✅ Download completed!`, "success");
            
            // Show download info
            downloadMessage.textContent = `Downloaded: ${data.title}`;
            downloadLink.href = `${API_BASE}/get_file/${encodeURIComponent(data.filename)}`;
            downloadLink.style.display = 'inline-block';
            downloadInfo.style.display = 'block';
            
            input.placeholder = "✅ Download complete! Paste another URL";
            input.style.border = "2px solid #4CAF50";
            button.disabled = false;
            
        } else if (data.error) {
            // Download failed
            clearInterval(statusCheckInterval);
            showToast(`❌ Download failed: ${data.error}`, "error");
            resetForm();
        }
        // Else still processing, continue checking
        
    } catch (error) {
        console.error('Status check error:', error);
    }
}

// Reset form
function resetForm() {
    input.style.border = "2px solid #ddd";
    input.style.color = "#333";
    input.placeholder = "Paste Video URL here";
    progressContainer.style.display = 'none';
    downloadInfo.style.display = 'none';
    downloadLink.style.display = 'none';
    button.disabled = false;
}

let statusCheckInterval = null;

// Download video function
async function downloadVideo() {
    const url = input.value.trim();

    // Agar input khaali hai
    if (url === "") {
        showToast("⚠️ Please paste a video URL!", "error");
        input.focus();
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (_) {
        showToast("❌ Please enter a valid URL", "error");
        return;
    }

    // First check if backend is reachable
    try {
        const statusResponse = await fetch(`${API_BASE}/status`);
        if (!statusResponse.ok) {
            throw new Error('Backend server not responding');
        }
    } catch (error) {
        showToast("🔴 Backend server not reachable. Please try again later.", "error");
        return;
    }

    // UI setup for download
    input.style.border = "2px solid #4CAF50";
    input.style.color = "#4CAF50";
    input.placeholder = "🚀 Starting download...";
    button.disabled = true;
    
    // Show progress
    const progressInterval = animateProgress();
    
    try {
        console.log("⚡ Starting download...");
        
        // Start download
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                url: url
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📨 Download started:", data);
        
        if (data.success) {
            showToast("🚀 Download started...", "success");
            
            // Start checking download status every 3 seconds
            statusCheckInterval = setInterval(() => {
                checkDownloadStatus(data.download_id);
            }, 3000);
            
            // Update UI
            input.placeholder = "⏳ Download in progress...";
            
        } else {
            throw new Error(data.error || 'Failed to start download');
        }
        
    } catch (error) {
        console.error('❌ Download error:', error);
        clearInterval(progressInterval);
        
        let errorMessage = 'Download failed: ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else {
            errorMessage += error.message;
        }
        
        showToast(errorMessage, "error");
        resetForm();
    }
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected:', data);
            showToast("🌐 Connected to online server!", "success");
        }
    } catch (error) {
        console.warn('❌ Backend not connected:', error);
        showToast("⚠️ Using online server - some features may be limited", "error");
    }
}

// Event listeners
button.addEventListener("click", downloadVideo);

input.addEventListener('focus', () => {
    input.style.border = "2px solid #4CAF50";
});

input.addEventListener('blur', () => {
    if (input.value === "" && !input.placeholder.includes("✅") && !input.placeholder.includes("❌")) {
        input.style.border = "2px solid #ddd";
    }
});

// Enter key support
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadVideo();
    }
});

// Initialize
window.addEventListener('load', () => {
    checkBackend();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
});

