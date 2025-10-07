import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { cache } from '../../connection/cache.js';
import { HTTP_GET, request, HTTP_STATUS_OK, HTTP_STATUS_PARTIAL_CONTENT } from '../../connection/request.js';

export const video = (() => {
    const audioEvents = new EventTarget();
    let observer = null;
    let c = null;
    let videoElement = null;

    const createObserver = (vid) => {
        try {
            if (!observer) {
                observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.play().catch(err => console.log('Video play failed:', err));
                        } else {
                            entry.target.pause();
                        }
                    });
                });
            }
            
            if (observer && vid) {
                observer.observe(vid);
                console.log('Video observation started');
            }
        } catch (error) {
            console.error('Error creating observer:', error);
        }
    };

    /**
     * @returns {Promise<void>}
     */
    const load = () => {
        const wrap = document.getElementById('video-love-stroy');
        if (!wrap || !wrap.hasAttribute('data-src')) {
            wrap?.remove();
            progress.complete('video', true);
            return Promise.resolve();
        }

        const src = wrap.getAttribute('data-src');
        if (!src) {
            progress.complete('video', true);
            return Promise.resolve();
        }

        videoElement = document.createElement('video');
        videoElement.className = wrap.getAttribute('data-vid-class');
        videoElement.loop = true;
        videoElement.muted = false; // Allow video sound
        videoElement.controls = false;
        videoElement.autoplay = false;
        videoElement.playsInline = true;
        videoElement.preload = 'metadata';

        videoElement.addEventListener('play', () => {
            audioEvents.dispatchEvent(new CustomEvent('video.play'));
        });

        videoElement.addEventListener('pause', () => {
            audioEvents.dispatchEvent(new CustomEvent('video.pause'));
        });

        // Listen for story.open event 
        document.addEventListener('story.open', () => {
            if (videoElement) {
                createObserver(videoElement);
            }
        }, { once: true });

        /**
         * @param {Response} res 
         * @returns {Promise<Response>}
         */
        const resToVideo = (res) => {
            if (!res.ok) {
                throw new Error('Failed to load video');
            }

            return res.clone().blob()
                .then(blob => {
                    videoElement.src = URL.createObjectURL(blob);
                    wrap.appendChild(videoElement);
                    progress.complete('video');
                    return res;
                });
        };

        return c.has(src)
            .then(cached => {
                if (!cached) {
                    return fetch(src)
                        .then(res => c.set(src, res))
                        .then(resToVideo);
                }
                return resToVideo(cached);
            })
            .catch(err => {
                console.error('Video load error:', err);
                progress.invalid('video');
            });
    };

    /**
     * @returns {object}
     */
    const init = () => {
        progress.add();
        c = cache('video').withForceCache();

        return {
            load,
        };
    };

    return {
        init,
        audioEvents
    };
})();