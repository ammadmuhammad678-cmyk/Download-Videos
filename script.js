// Backend URL - Direct connection
const API_BASE = 'https://ammad12.pythonanywhere.com';

// Elements
const input = document.querySelector(".hero-input");
const button = document.getElementById("download-btn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const toast = document.getElementById("toast");
const downloadInfo = document.getElementById("downloadInfo");
const downloadMessage = document.getElementById("downloadMessage");

// Toast function
function showToast(message, type = "info") {
    toast.textContent = message;
    toast.className = "toast " + type;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}

// Progress bar
function startProgress() {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 5;
            progressBar.style.width = width + '%';
        }
    }, 100);
    
    return interval;
}

// Download function
async function downloadVideo() {
    const url = input.value.trim();
    
    if (!url) {
        showToast("⚠️ Please enter video URL", "error");
        return;
    }
    
    // URL validate karo
    try {
        new URL(url);
    } catch {
        showToast("❌ Invalid URL", "error");
        return;
    }
    
    // UI update
    button.disabled = true;
    input.placeholder = "🚀 Processing...";
    input.style.border = "2px solid #4CAF50";
    
    // Progress bar dikhao
    const progressInterval = startProgress();
    
    try {
        // Backend call karo
        const response = await fetch(API_BASE + '/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Success
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            
            showToast(`✅ ${data.platform} video ready!`, "success");
            
            downloadMessage.innerHTML = `
                <strong>🎥 ${data.title}</strong><br>
                <small>Platform: ${data.platform}</small><br>
                <small>Status: Successfully processed</small>
            `;
            downloadInfo.style.display = 'block';
            
            input.placeholder = "✅ Download complete!";
            
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        // Error handle karo
        clearInterval(progressInterval);
        showToast("❌ Download failed", "error");
        input.placeholder = "❌ Try again";
    }
    
    // Button enable karo
    setTimeout(() => {
        button.disabled = false;
    }, 2000);
}

// Backend check
async function checkBackend() {
    try {
        const response = await fetch(API_BASE + '/status');
        if (response.ok) {
            showToast("✅ Backend Connected", "success");
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

// Page load pe backend check karo
window.addEventListener('load', checkBackend);
