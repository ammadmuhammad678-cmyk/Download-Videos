// CORS PROXY SOLUTION - IMMEDIATE FIX
const API_BASE = 'https://corsproxy.io/?' + encodeURIComponent('https://ammad12.pythonanywhere.com');

// Elements select kar rahe hain
const input = document.querySelector(".hero-input");
const button = document.getElementById("download-btn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const toast = document.getElementById("toast");
const downloadInfo = document.getElementById("downloadInfo");
const downloadMessage = document.getElementById("downloadMessage");
const downloadLink = document.getElementById("downloadLink");

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

// Download video function
async function downloadVideo() {
    const url = input.value.trim();

    if (url === "") {
        showToast("⚠️ Please paste a video URL!", "error");
        return;
    }

    try {
        new URL(url);
    } catch (_) {
        showToast("❌ Please enter a valid URL", "error");
        return;
    }

    input.style.border = "2px solid #4CAF50";
    input.style.color = "#4CAF50";
    input.placeholder = "🚀 Starting download...";
    button.disabled = true;
    
    animateProgress();
    
    try {
        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast("✅ Download started successfully!", "success");
            downloadMessage.textContent = `Downloading: ${data.title || 'video'}`;
            downloadInfo.style.display = 'block';
            input.placeholder = "✅ Download complete! Paste another URL";
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Download error:', error);
        showToast("❌ Download failed. Backend issue.", "error");
        input.placeholder = "❌ Download failed";
        input.style.border = "2px solid red";
        input.style.color = "red";
        
        setTimeout(() => {
            resetForm();
        }, 5000);
    }
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend connected:', data);
            showToast("🌐 Connected to server!", "success");
        }
    } catch (error) {
        console.warn('❌ Backend not connected:', error);
        showToast("⚠️ Server connection issue", "error");
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

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadVideo();
    }
});

// Initialize
window.addEventListener('load', checkBackend);
