import { video } from './video.js';
import { image } from './image.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { util } from '../../common/util.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { comment } from '../components/comment.js';
import * as confetti from '../../libs/confetti.js';
import { pool } from '../../connection/request.js';
import { galleryMore } from './gallery-more.js';
import { confirmInfo } from './comfirmInfor.js';

export const guest = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let information = null;

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let config = null;

    /**
     * @returns {void}
     */
    const countDownDate = () => {
        const count = (new Date(document.body.getAttribute('data-time').replace(' ', 'T'))).getTime();

        /**
         * @param {number} num 
         * @returns {string}
         */
        const pad = (num) => num < 10 ? `0${num}` : `${num}`;

        const day = document.getElementById('day');
        const hour = document.getElementById('hour');
        const minute = document.getElementById('minute');
        const second = document.getElementById('second');

        const updateCountdown = () => {
            const distance = Math.abs(count - Date.now());

            day.textContent = pad(Math.floor(distance / (1000 * 60 * 60 * 24)));
            hour.textContent = pad(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
            minute.textContent = pad(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
            second.textContent = pad(Math.floor((distance % (1000 * 60)) / 1000));

            util.timeOut(updateCountdown, 1000 - (Date.now() % 1000));
        };

        util.timeOut(updateCountdown);
    };

    /**
     * @returns {void}
     */
    const showGuestName = () => {
        /**
         * Make sure "to=" is the last query string.
         * Ex. ulems.my.id/?id=some-uuid-here&to=name
         */
        const raw = window.location.search.split('to=');
        let name = null;

        if (raw.length > 1 && raw[1].length >= 1) {
            name = window.decodeURIComponent(raw[1]);
        }

        if (name) {
            const guestName = document.getElementById('guest-name');
            const div = document.createElement('div');
            div.classList.add('m-2');

            const template = `<small class="mt-0 mb-1 mx-0 p-0">${util.escapeHtml(guestName?.getAttribute('data-message'))}</small><p class="m-0 p-0" style="font-size: 1.25rem">${util.escapeHtml(name)}</p>`;
            util.safeInnerHTML(div, template);

            guestName?.appendChild(div);
        }

        const form = document.getElementById('form-name');
        if (form) {
            form.value = information.get('name') ?? name;
        }
    };

    /**
     * @returns {Promise<void>}
     */
    const slide = async () => {
        const interval = 6000;
        const slides = document.querySelectorAll('.slide-desktop');

        if (!slides || slides.length === 0) {
            return;
        }

        const desktopEl = document.getElementById('root')?.querySelector('.d-sm-block');
        if (!desktopEl) {
            return;
        }
        
        // Đảm bảo observer không null trước khi sử dụng
        let observer = null;
        // Khởi tạo observer trước khi sử dụng
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

        desktopEl.dispatchEvent(new Event('undangan.slide.stop'));

        if (window.getComputedStyle(desktopEl).display === 'none') {
            return;
        }

        if (slides.length === 1) {
            await util.changeOpacity(slides[0], true);
            return;
        }

        let index = 0;
        for (const [i, s] of slides.entries()) {
            if (i === index) {
                s.classList.add('slide-desktop-active');
                await util.changeOpacity(s, true);
                break;
            }
        }

        let run = true;
        const nextSlide = async () => {
            await util.changeOpacity(slides[index], false);
            slides[index].classList.remove('slide-desktop-active');

            index = (index + 1) % slides.length;

            if (run) {
                slides[index].classList.add('slide-desktop-active');
                await util.changeOpacity(slides[index], true);
            }

            return run;
        };

        desktopEl.addEventListener('undangan.slide.stop', () => {
            run = false;
        });

        const loop = async () => {
            if (await nextSlide()) {
                util.timeOut(loop, interval);
            }
        };

        util.timeOut(loop, interval);
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const open = (button) => {
        button.disabled = true;
        document.body.scrollIntoView({ behavior: 'instant' });
        document.getElementById('root').classList.remove('opacity-0');

        if (theme.isAutoMode()) {
            document.getElementById('button-theme').classList.remove('d-none');
        }

        slide();
        theme.spyTop();

        confetti.basicAnimation();
        util.timeOut(confetti.openAnimation, 1500);

        document.dispatchEvent(new Event('undangan.open'));
        util.changeOpacity(document.getElementById('welcome'), false).then((el) => el.remove());
    };

    /**
     * @param {HTMLImageElement} img
     * @returns {void}
     */
    const modal = (img) => {
        document.getElementById('button-modal-click').setAttribute('href', img.src);
        document.getElementById('button-modal-download').setAttribute('data-src', img.src);

        const i = document.getElementById('show-modal-image');
        i.src = img.src;
        i.width = img.width;
        i.height = img.height;
        bs.modal('modal-image').show();
    };

    /**
     * @returns {void}
     */
    const modalImageClick = () => {
        document.getElementById('show-modal-image').addEventListener('click', (e) => {
            const abs = e.currentTarget.parentNode.querySelector('.position-absolute');

            abs.classList.contains('d-none')
                ? abs.classList.replace('d-none', 'd-flex')
                : abs.classList.replace('d-flex', 'd-none');
        });
    };

    /**
     * @param {HTMLDivElement} div 
     * @returns {void}
     */
    const showStory = (div) => {
        if (navigator.vibrate) {
            navigator.vibrate(500);
        }

        // Dispatch event khi mở story
        document.dispatchEvent(new Event('story.open'));
        
        // Remove bg-overlay-auto from video container
        const videoContainer = document.getElementById('video-love-stroy');
        const overlayElements = videoContainer.getElementsByClassName('bg-overlay-auto');
        Array.from(overlayElements).forEach(el => {
            el.classList.remove('bg-overlay-auto');
        });
        
        confetti.tapTapAnimation(div, 100);
        util.changeOpacity(div, false).then((e) => e.remove());
    };

    /**
     * @returns {void}
     */
    const closeInformation = () => information.set('info', true);

    /**
     * @returns {void}
     */
    const normalizeArabicFont = () => {
        document.querySelectorAll('.font-arabic').forEach((el) => {
            el.innerHTML = String(el.innerHTML).normalize('NFC');
        });
    };

    /**
     * @returns {void}
     */
    const animateSvg = () => {
        document.querySelectorAll('svg').forEach((el) => {
            if (el.hasAttribute('data-class')) {
                util.timeOut(() => el.classList.add(el.getAttribute('data-class')), parseInt(el.getAttribute('data-time')));
            }
        });
    };

    /**
     * @returns {void}
     */
    const buildGoogleCalendar = () => {
        /**
         * @param {string} d 
         * @returns {string}
         */
        // const formatDate = (d) => {
        //     // Chuyển đổi thành múi giờ Việt Nam (+7)
        //     const date = new Date(d.replace(' ', 'T') + '+07:00');
        //     return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        // };

        // const url = new URL('https://calendar.google.com/calendar/render');
        //  const data = new URLSearchParams({
        //     action: 'TEMPLATE',
        //     text: 'Lễ cưới Vũ Minh & Ngọc Ánh', 
        //     dates: `${formatDate('2025-11-03 09:00')}/${formatDate('2025-11-03 17:00')}`,
        //     details: 'Trân trọng kính mời bạn đến dự lễ cưới của chúng tôi. Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.',
        //     location: '83RV+FGV, Ngọc Thiện, Tân Yên, Bắc Giang, Việt Nam',
        //     ctz: 'Asia/Hanoi',
        //     sf: 'true',
        //     output: 'xml',
        // });

         const formatDate = (d) => {
            // Chuyển đổi thành múi giờ Việt Nam (+7)
            const date = new Date(d.replace(' ', 'T') + '+07:00');
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        const gcalURL = (p) => {
            const url = new URL('https://calendar.google.com/calendar/render');
            url.search = new URLSearchParams({
            action: 'TEMPLATE',
            text: p.title,
            dates: `${formatDate('2025-11-03 09:00')}/${formatDate('2025-11-03 17:00')}`,
            details: p.details,
            location: p.location,
            ctz: 'Asia/Ho_Chi_Minh',
            sf: 'true',
            output: 'xml',
            }).toString();
            return url.toString();
        };

          // 👉 Sửa lại địa chỉ & giờ cho đúng của bạn
            const groom = {
                btn: '#btn-gcal-groom',
                title: 'Lễ cưới – Nhà trai | Vũ Minh ❤️ Ngọc Ánh',
                location: '83RV+FGV, Ngọc Thiện, Tân Yên, Bắc Giang, Việt Nam',
                details: [
                'Vũ Minh ❤️ Ngọc Ánh',
                'Trân trọng kính mời bạn đến dự lễ cưới của chúng tôi. Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.',
                ].join('\n')
            };
            
            const bride = {
                btn: '#btn-gcal-bride',
                title: 'Lễ cưới – Nhà gái | Vũ Minh ❤️ Ngọc Ánh',
                location: '84WM+XHV Tân Yên, Bắc Giang, Việt Nam',
                details: [
                'Vũ Minh ❤️ Ngọc Ánh',
                'Trân trọng kính mời bạn đến dự lễ cưới của chúng tôi. Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.',
                ].join('\n')
            };
            [groom, bride].forEach(ev => {
                const btn = document.querySelector(ev.btn);
                if (btn) btn.addEventListener('click', () => window.open(gcalURL(ev), '_blank'));
            });

        // url.search = data.toString();
        // document.querySelector('#home button')?.addEventListener('click', () => window.open(url, '_blank'));
    };

    /**
     * @returns {object}
     */
    const loaderLibs = () => {
        progress.add();

        /**
         * @param {{aos: boolean, confetti: boolean}} opt
         * @returns {void}
         */
        const load = (opt) => {
            loader(opt)
                .then(() => progress.complete('libs'))
                .catch(() => progress.invalid('libs'));
        };

        return {
            load,
        };
    };


    /**
     * Render mini calendar theo data-time trên <body>.
     * - Bắt đầu tuần: Thứ 2
     * - Tô tròn ngày cưới
     */
    const buildMiniCalendar = () => {
        const mount = document.getElementById('mini-calendar');
        if (!mount) return;

        // Lấy ngày cưới từ body (đã cập nhật 2025-11-02T...)
        const raw = document.body.getAttribute('data-time') || '';
        const target = new Date(raw.replace(' ', 'T'));
        const year = target.getFullYear();
        const month = target.getMonth(); // 0..11
        const weddingDate = target.getDate();

        // Header
        const vnMonths = ['THÁNG 1','THÁNG 2','THÁNG 3','THÁNG 4','THÁNG 5','THÁNG 6','THÁNG 7','THÁNG 8','THÁNG 9','THÁNG 10','THÁNG 11','THÁNG 12'];
        const head = document.createElement('div');
        head.className = 'wm-cal__head text-center';
        head.textContent = `${vnMonths[month]} / ${year}`;

        // Weekdays (Thứ 2 .. CN)
        const wd = document.createElement('div');
        wd.className = 'wm-cal__weekdays';
        ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'].forEach(t=>{
            const s = document.createElement('div');
            s.className = 'wm-cal__weekday';
            s.textContent = t;
            wd.appendChild(s);
        });

        // Days grid
        const days = document.createElement('div');
        days.className = 'wm-cal__days';

        // Tính ô trống đầu tháng (tuần bắt đầu = Thứ 2)
        const first = new Date(year, month, 1);
        const last  = new Date(year, month + 1, 0);
        const firstWeekday = (first.getDay() + 6) % 7; // Mon=0..Sun=6
        const totalCells = firstWeekday + last.getDate();
        const padTail = (7 - (totalCells % 7)) % 7;

        // Ngày tháng trước (mờ)
        const prevLast = new Date(year, month, 0).getDate();
        for (let i = firstWeekday - 1; i >= 0; i--) {
            const d = document.createElement('div');
            d.className = 'wm-cal__day is-out';
            d.textContent = String(prevLast - i);
            days.appendChild(d);
        }

        // Ngày trong tháng
        for (let dNum = 1; dNum <= last.getDate(); dNum++) {
            const d = document.createElement('div');
            d.className = 'wm-cal__day';
            if (dNum === weddingDate) d.classList.add('is-wedding');
            d.textContent = String(dNum);
            days.appendChild(d);
        }

        // Ngày tháng sau (mờ)
        for (let i = 1; i <= padTail; i++) {
            const d = document.createElement('div');
            d.className = 'wm-cal__day is-out';
            d.textContent = String(i);
            days.appendChild(d);
        }

        mount.innerHTML = '';
        mount.appendChild(head);
        mount.appendChild(wd);
        mount.appendChild(days);
    };


    /**
     * @returns {Promise<void>}
     */
    const booting = async () => {
        animateSvg();
        countDownDate();
        showGuestName();
        modalImageClick();
        normalizeArabicFont();
        buildGoogleCalendar();
        buildMiniCalendar();

        if (information.has('presence')) {
            document.getElementById('form-presence').value = information.get('presence') ? '1' : '2';
        }

        if (information.get('info')) {
            document.getElementById('information')?.remove();
        }

        // wait until welcome screen is show.
        await util.changeOpacity(document.getElementById('welcome'), true);

        // remove loading screen and show welcome screen.
        await util.changeOpacity(document.getElementById('loading'), false).then((el) => el.remove());
    };

    /**
     * @returns {void}
     */
    const pageLoaded = () => {
        lang.init();
        offline.init();
        comment.init();
        progress.init();

        config = storage('config');
        information = storage('information');

        const vid = video.init();
        const img = image.init();
        const aud = audio.init();
        const lib = loaderLibs();
        const token = document.body.getAttribute('data-key');
        const params = new URLSearchParams(window.location.search);

        
        // Khởi tạo “Xem thêm ảnh”
          galleryMore.init({
            gridSelector: '.gallery-grid',
            buttonSelector: '#btn-more-photos',
            hintSelector: '#more-hint',
            manifestUrl: './assets/images/data_Images/gallery.json',
            batchSize: 10
        });
        // Khởi tạo form xác nhận tham dự
        confirmInfo.init();


        window.addEventListener('resize', util.debounce(slide));
        document.addEventListener('undangan.progress.done', () => booting());
        document.addEventListener('hide.bs.modal', () => document.activeElement?.blur());
        document.getElementById('button-modal-download').addEventListener('click', (e) => {
            img.download(e.currentTarget.getAttribute('data-src'));
        });

        if (!token || token.length <= 0) {
            document.getElementById('comment')?.remove();
            document.querySelector('a.nav-link[href="#comment"]')?.closest('li.nav-item')?.remove();

            vid.load();
            img.load();
            aud.load();
            lib.load({ confetti: document.body.getAttribute('data-confetti') === 'true' });
        }

        if (token && token.length > 0) {
            // add 2 progress for config and comment.
            // before img.load();
            progress.add();
            progress.add();

            // if don't have data-src.
            if (!img.hasDataSrc()) {
                img.load();
            }

            session.guest(params.get('k') ?? token).then(({ data }) => {
                document.dispatchEvent(new Event('undangan.session'));
                progress.complete('config');

                if (img.hasDataSrc()) {
                    img.load();
                }

                vid.load();
                aud.load();
                lib.load({ confetti: data.is_confetti_animation });

                comment.show()
                    .then(() => progress.complete('comment'))
                    .catch(() => progress.invalid('comment'));

            }).catch(() => progress.invalid('config'));
        }
      
    };

    /**
     * @returns {object}
     */
    const init = () => {
        theme.init();
        session.init();

        if (session.isAdmin()) {
            storage('user').clear();
            storage('owns').clear();
            storage('likes').clear();
            storage('session').clear();
            storage('comment').clear();
        }

        window.addEventListener('load', () => {
            pool.init(pageLoaded, [
                'image',
                'video',
                'audio',
                'libs',
                'gif',
            ]);
        });

        return {
            util,
            theme,
            comment,
            guest: {
                open,
                modal,
                showStory,
                closeInformation,
            },
        };
    };

    return {
        init,
    };
})();