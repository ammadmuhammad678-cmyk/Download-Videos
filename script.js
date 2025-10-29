   const BACKEND_URL = 'https://ammad12.pythonanywhere.com';
        
        // Check backend status on page load
        window.addEventListener('load', checkBackendStatus);
        
        async function checkBackendStatus() {
            const statusElement = document.getElementById('backendStatus');
            
            try {
                const response = await fetch(`${BACKEND_URL}/status`);
                const data = await response.json();
                
                statusElement.innerHTML = `✅ <strong>Backend Online:</strong> ${data.message}`;
                statusElement.style.background = '#d4edda';
                statusElement.style.color = '#155724';
                
            } catch (error) {
                statusElement.innerHTML = `❌ <strong>Backend Offline:</strong> Cannot connect to server`;
                statusElement.style.background = '#f8d7da';
                statusElement.style.color = '#721c24';
                console.error('Backend check failed:', error);
            }
        }
        
        async function getVideoInfo() {
            const videoUrl = document.getElementById('videoUrl').value.trim();
            
            if (!videoUrl) {
                showStatus('❌ Please enter a video URL', 'error');
                return;
            }
            
            showStatus('🔍 Getting video information...', 'loading');
            hideVideoInfo();
            
            try {
                const response = await fetch(`${BACKEND_URL}/video_info`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: videoUrl })
                });
                
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
            const videoUrl = document.getElementById('videoUrl').value.trim();
            
            if (!videoUrl) {
                showStatus('❌ Please enter a video URL', 'error');
                return;
            }
            
            showStatus('🚀 Starting download...', 'loading');
            showProgress(0);
            hideDownloadLink();
            
            try {
                const response = await fetch(`${BACKEND_URL}/download`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    'Accept': 'application/json'
                    },
                    body: JSON.stringify({ url: videoUrl })
                });
                
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
                
                // In real implementation, you would check actual progress from backend
                // try {
                //     const progressResponse = await fetch(`${BACKEND_URL}/progress/${filename}`);
                //     const progressData = await progressResponse.json();
                //     showProgress(progressData.progress);
                // } catch (e) {
                //     console.log('Progress check failed');
                // }
                
            }, 500);
        }
        
        function showVideoInfo(info) {
            const videoInfoDiv = document.getElementById('videoInfo');
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
            videoInfoDiv.style.display = 'block';
        }
        
        function hideVideoInfo() {
            document.getElementById('videoInfo').style.display = 'none';
        }
        
        function showProgress(percent) {
            const progressContainer = document.getElementById('progressContainer');
            const progressBar = document.getElementById('progress');
            const progressText = document.getElementById('progressText');
            
            progressContainer.style.display = 'block';
            progressBar.style.width = percent + '%';
            progressText.textContent = Math.round(percent) + '%';
            
            // Update download speed (simulated)
            const speedElement = document.getElementById('downloadSpeed');
            if (percent < 100) {
                const speed = Math.random() * 2 + 1; // Random speed between 1-3 MB/s
                speedElement.textContent = speed.toFixed(1) + ' MB/s';
            } else {
                speedElement.textContent = 'Completed';
            }
        }
        
        function hideProgress() {
            document.getElementById('progressContainer').style.display = 'none';
        }
        
        function showDownloadLink(data) {
            const downloadLinkDiv = document.getElementById('downloadLink');
            downloadLinkDiv.innerHTML = `
                <a href="${BACKEND_URL}${data.download_url}" class="download-btn" download>
                    📥 Download "${data.title}" 
                    ${data.file_size ? `(${(data.file_size / (1024*1024)).toFixed(1)} MB)` : ''}
                </a>
            `;
            downloadLinkDiv.style.display = 'block';
        }
        
        function hideDownloadLink() {
            document.getElementById('downloadLink').style.display = 'none';
        }
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = message;
            statusDiv.className = `status ${type}`;
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
        
        // Enter key support
        document.getElementById('videoUrl').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                downloadVideo();
            }
        });
