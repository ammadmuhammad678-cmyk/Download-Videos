    // CORS Proxy for backup
        const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
        const BACKEND_URL = 'https://ammad12.pythonanywhere.com';
        
        // Safe element selector - null check included
        function getElement(id) {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element with id '${id}' not found`);
            }
            return element;
        }
        
        // Check backend status on page load
        document.addEventListener('DOMContentLoaded', function() {
            checkBackendStatus();
            setupEventListeners();
        });
        
        function setupEventListeners() {
            const videoUrlInput = getElement('videoUrl');
            if (videoUrlInput) {
                videoUrlInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        downloadVideo();
                    }
                });
            }
        }
        
        async function checkBackendStatus() {
            const statusElement = getElement('backendStatus');
            if (!statusElement) return;
            
            try {
                // Try direct connection first
                let response = await fetch(`${BACKEND_URL}/status`);
                let data = await response.json();
                
                statusElement.innerHTML = `✅ <strong>Backend Online:</strong> ${data.message}`;
                statusElement.style.background = '#d4edda';
                statusElement.style.color = '#155724';
                
            } catch (error) {
                console.log('Direct connection failed, trying CORS proxy...');
                
                // Try with CORS proxy
                try {
                    const response = await fetch(CORS_PROXY + BACKEND_URL + '/status');
                    const data = await response.json();
                    
                    statusElement.innerHTML = `✅ <strong>Backend Online (via proxy):</strong> ${data.message}`;
                    statusElement.style.background = '#d4edda';
                    statusElement.style.color = '#155724';
                    
                } catch (proxyError) {
                    statusElement.innerHTML = `❌ <strong>Backend Offline:</strong> Cannot connect to server`;
                    statusElement.style.background = '#f8d7da';
                    statusElement.style.color = '#721c24';
                    console.error('Both direct and proxy connections failed:', proxyError);
                }
            }
        }
        
        async function getVideoInfo() {
            const videoUrl = getElement('videoUrl').value.trim();
            
            if (!videoUrl) {
                showStatus('❌ Please enter a video URL', 'error');
                return;
            }
            
            showStatus('🔍 Getting video information...', 'loading');
            hideVideoInfo();
            
            try {
                let response;
                
                // Try direct connection first
                try {
                    response = await fetch(`${BACKEND_URL}/video_info`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: videoUrl })
                    });
                } catch (directError) {
                    // If direct fails, use proxy
                    console.log('Direct connection failed, using proxy...');
                    response = await fetch(CORS_PROXY + BACKEND_URL + '/video_info', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: videoUrl })
                    });
                }
                
                const data = await response.json();
                
                if (data.success) {
                    showVideoInfo(data);
                    showStatus('✅ Video information loaded successfully!', 'success');
                } else {
                    showStatus(`❌ Error: ${data.error}`, 'error');
                }
                
            } catch (error) {
                showStatus('❌ Failed to get video information', 'error');
                console.error('Video info error:', error);
            }
        }
        
        async function downloadVideo() {
            const videoUrlInput = getElement('videoUrl');
            if (!videoUrlInput) return;
            
            const videoUrl = videoUrlInput.value.trim();
            
            if (!videoUrl) {
                showStatus('❌ Please enter a video URL', 'error');
                return;
            }
            
            showStatus('🚀 Starting download...', 'loading');
            showProgress(0);
            hideDownloadLink();
            
            try {
                let response;
                
                // Try direct connection first
                try {
                    response = await fetch(`${BACKEND_URL}/download`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ url: videoUrl })
                    });
                } catch (directError) {
                    // If direct fails, use proxy
                    console.log('Direct connection failed, using proxy...');
                    response = await fetch(CORS_PROXY + BACKEND_URL + '/download', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ url: videoUrl })
                    });
                }
                
                const data = await response.json();
                
                if (data.success) {
                    // Simulate progress updates
                    simulateProgress(data.filename);
                    
                    setTimeout(() => {
                        showDownloadLink(data);
                        showStatus('✅ Video downloaded successfully!', 'success');
                    }, 3000);
                    
                } else {
                    showStatus(`❌ Download failed: ${data.error}`, 'error');
                    hideProgress();
                }
                
            } catch (error) {
                showStatus('❌ Download failed: Network error', 'error');
                hideProgress();
                console.error('Download error:', error);
            }
        }
        
        function simulateProgress(filename) {
            let progress = 0;
            const interval = setInterval(async () => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                showProgress(progress);
            }, 500);
        }
        
        function showVideoInfo(info) {
            const videoInfoDiv = getElement('videoInfo');
            if (!videoInfoDiv) return;
            
            const duration = formatDuration(info.duration);
            
            videoInfoDiv.innerHTML = `
                <h3>${info.title}</h3>
                ${info.thumbnail ? `<img src="${info.thumbnail}" alt="Thumbnail" />` : ''}
                <p><strong>Uploader:</strong> ${info.uploader}</p>
                <p><strong>Duration:</strong> ${duration}</p>
                <p><strong>Views:</strong> ${info.view_count?.toLocaleString() || 'N/A'}</p>
                <p><strong>Available Formats:</strong> ${info.formats}</p>
                ${info.description ? `<p><strong>Description:</strong> ${info.description}</p>` : ''}
            `;
            videoInfoDiv.classList.remove('hidden');
        }
        
        function hideVideoInfo() {
            const videoInfoDiv = getElement('videoInfo');
            if (videoInfoDiv) {
                videoInfoDiv.classList.add('hidden');
            }
        }
        
        function showProgress(percent) {
            const progressContainer = getElement('progressContainer');
            const progressBar = getElement('progress');
            const progressText = getElement('progressText');
            
            if (!progressContainer || !progressBar || !progressText) return;
            
            progressContainer.classList.remove('hidden');
            progressBar.style.width = percent + '%';
            progressText.textContent = Math.round(percent) + '%';
            
            const speedElement = getElement('downloadSpeed');
            if (speedElement) {
                if (percent < 100) {
                    const speed = Math.random() * 2 + 1;
                    speedElement.textContent = speed.toFixed(1) + ' MB/s';
                } else {
                    speedElement.textContent = 'Completed';
                }
            }
        }
        
        function hideProgress() {
            const progressContainer = getElement('progressContainer');
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }
        }
        
        function showDownloadLink(data) {
            const downloadLinkDiv = getElement('downloadLink');
            if (!downloadLinkDiv) return;
            
            downloadLinkDiv.innerHTML = `
                <a href="${BACKEND_URL}${data.download_url}" class="download-btn" download>
                    📥 Download "${data.title}" 
                    ${data.file_size ? `(${(data.file_size / (1024*1024)).toFixed(1)} MB)` : ''}
                </a>
            `;
            downloadLinkDiv.classList.remove('hidden');
        }
        
        function hideDownloadLink() {
            const downloadLinkDiv = getElement('downloadLink');
            if (downloadLinkDiv) {
                downloadLinkDiv.classList.add('hidden');
            }
        }
        
        function showStatus(message, type) {
            const statusDiv = getElement('status');
            if (!statusDiv) return;
            
            statusDiv.textContent = message;
            statusDiv.className = `status ${type}`;
            statusDiv.classList.remove('hidden');
        }
        
        function formatDuration(seconds) {
            if (!seconds) return 'N/A';
            
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } else {
                return `${minutes}:${secs.toString().padStart(2, '0')}`;
            }
        }
