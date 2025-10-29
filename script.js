// Elements select kar rahe hain
const input = document.querySelector(".hero-input");
const button = document.getElementById("download-btn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const toast = document.getElementById("toast");
const downloadInfo = document.getElementById("downloadInfo");
const downloadMessage = document.getElementById("downloadMessage");
const downloadLink = document.getElementById("downloadLink");

// Backend API URL
const API_BASE = 'http://localhost:5000';

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
    }, 5000); // 5 seconds for error messages
}

// Progress bar animation
function animateProgress(duration = 3000) {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 1;
            progressBar.style.width = width + '%';
        }
    }, duration / 100);
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

// Download video function - UPDATED
async function downloadVideo() {
    const url = input.value.trim();

    // Agar input khaali hai
    if (url === "") {
        input.value = "";
        input.placeholder = "⚠️ Please paste a video URL!";
        input.style.border = "2px solid red";
        input.style.color = "red";

        setTimeout(() => {
            resetForm();
        }, 2000);

        showToast("Please enter a video URL", "error");
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (_) {
        input.style.border = "2px solid red";
        input.style.color = "red";
        showToast("Please enter a valid URL", "error");
        return;
    }

    // Agar URL valid hai
    input.style.border = "2px solid #4CAF50";
    input.style.color = "#4CAF50";
    input.placeholder = "✅ Processing...";
    button.disabled = true;
    
    // Show progress
    animateProgress();
    
    try {
        console.log("🔄 Sending request to backend...");
        
        // Backend API call with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
        
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📨 Response received:", data);
        
        if (data.success) {
            showToast(`Successfully downloaded from ${data.platform}`, "success");
            
            // Show download info
            downloadMessage.textContent = `Downloaded: ${data.title}`;
            downloadLink.href = `${API_BASE}/get_file/${encodeURIComponent(data.filename)}`;
            downloadLink.style.display = 'inline-block';
            downloadInfo.style.display = 'block';
            
            input.placeholder = "✅ Download complete! Paste another URL";
            input.style.border = "2px solid #4CAF50";
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('❌ Download error:', error);
        
        let errorMessage = 'Download failed: ';
        
        if (error.name === 'AbortError') {
            errorMessage += 'Request timeout. The download is taking too long.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Cannot connect to server. Make sure backend is running on port 5000.';
        } else if (error.message.includes('Connection reset')) {
            errorMessage += 'Connection lost. Server might have crashed. Check backend terminal.';
        } else {
            errorMessage += error.message;
        }
        
        showToast(errorMessage, "error");
        input.placeholder = "❌ Download failed. Try again.";
        input.style.border = "2px solid red";
        input.style.color = "red";
        
        // Reset after 5 seconds
        setTimeout(() => {
            resetForm();
        }, 5000);
    }
}

// Test backend connection
async function testBackendConnection() {
    try {
        console.log("🔍 Testing backend connection...");
        const response = await fetch(`${API_BASE}/test`);
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Backend test successful:", data);
            return true;
        }
    } catch (error) {
        console.error("❌ Backend test failed:", error);
        return false;
    }
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is connected:', data);
            showToast("Backend server connected!", "success");
            return true;
        }
    } catch (error) {
        console.warn('❌ Backend is not running:', error);
        showToast("Backend server not found. Please start the Flask server on port 5000.", "error");
        return false;
    }
}

// Button click hone par ye chalega
button.addEventListener("click", downloadVideo);

// Input field focus effect
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

// Check backend status on page load
window.addEventListener('load', async () => {
    console.log("🚀 Frontend loaded, checking backend...");
    await checkBackend();
    await testBackendConnection();
});