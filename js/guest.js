import { guest } from './app/guest/guest.js';

((w) => {
    w.undangan = guest.init();
    (function flushQueuedMediaCalls(){
        try {
            if (!window._undangan_media_queue || !window.undangan || !window.undangan.media) return;
            window._undangan_media_queue.forEach(function(item){
            const cmd = item[0];
            const arg = item[1];
            if (cmd === 'play' && typeof window.undangan.media.playAudioIfPossible === 'function') {
                try { window.undangan.media.playAudioIfPossible(); } catch(e){}
            }
            if (cmd === 'video' && typeof window.undangan.media.loadVideoOnDemand === 'function') {
                try { window.undangan.media.loadVideoOnDemand(arg); } catch(e){}
            }
            });
            window._undangan_media_queue.length = 0;
        } catch(e){ console.warn('flushQueuedMediaCalls', e); }
    })();
})(window);