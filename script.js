// Backend API URL with multiple fallback options
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

// Toast function
function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = "toast " + type;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}

// Check backend connection
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            const data = await response.json();
            showToast("✅ Backend connected successfully!", "success");
            console.log('Backend status:', data);
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        console.error('Backend error:', error);
        showToast("❌ Backend server not available", "error");
        
        // Show instructions
        setTimeout(() => {
            alert(`🚨 Backend Server Issue\n\nPlease check:\n1. PythonAnywhere backend is running\n2. URL: https://ammad12.pythonanywhere.com/status\n3. Contact support if issue continues`);
        }, 2000);
    }
}

// Download function (simplified)
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
    
    button.disabled = true;
    input.placeholder = "🔄 Checking backend...";
    
    try {
        // First check if backend is available
        const statusResponse = await fetch(`${API_BASE}/status`);
        if (!statusResponse.ok) {
            throw new Error('Backend not available');
        }
        
        // Show downloading state
        input.placeholder = "🚀 Downloading...";
        showToast("Download started...", "success");
        
        // Simulate download process
        setTimeout(() => {
            showToast("✅ Download feature ready!", "success");
            input.placeholder = "✅ Backend connected - Ready to download!";
            button.disabled = false;
        }, 2000);
        
    } catch (error) {
        showToast("❌ Backend server not available", "error");
        input.placeholder = "❌ Server offline - Try again later";
        button.disabled = false;
    }
}

// Event listeners
button.addEventListener("click", downloadVideo);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') downloadVideo();
});

// Initialize
window.addEventListener('load', checkBackend);
