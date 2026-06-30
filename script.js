// ==UserScript==
// @name         arena.ai Floating Code Copy & Minimize Enhancer
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Floating copy button for code blocks, minimize buttons for messages and user inputs, all chat copy/download, and tooltip for truncated labels in lmarena.ai / arena.ai
// @author       Mohammad Yamini
// @match        https://lmarena.ai/*
// @match        https://arena.ai/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/mohammad021/arena-ai-floating-code-copy-minimize-enhancer/main/script.js
// @downloadURL  https://raw.githubusercontent.com/mohammad021/arena-ai-floating-code-copy-minimize-enhancer/main/script.js
// ==/UserScript==

(function() {
    'use strict';

    // تشخیص زبان و direction
    let lang = document.documentElement.lang || 'fa'; // پیش‌فرض فارسی
    let dir = (lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr';

    // استایل دکمه کپی کد (fixed, سمت چپ، شفاف)
    const codeBtnStyle = `
        position: fixed;
        background: rgba(255, 251, 231, 0.7);
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 2px 10px;
        cursor: pointer;
        font-size: 13px;
        font-family: Tahoma, Arial, sans-serif;
        z-index: 9999;
        opacity: 0.95;
        box-shadow: 0 2px 8px #0001;
        transition: opacity 0.2s;
        display: none;
    `;

    let floatingBtn = null;
    let currentBlock = null;

    function createFloatingBtn() {
        if (floatingBtn) return;
        floatingBtn = document.createElement('button');
        floatingBtn.textContent = (lang === 'en' ? 'Copy Code' : (lang === 'ar' ? 'نسخ الكود' : 'کپی کد'));
        floatingBtn.className = 'floating-bounded-copy-code-btn';
        floatingBtn.setAttribute('dir', dir);
        floatingBtn.style.cssText = codeBtnStyle;
        document.body.appendChild(floatingBtn);

        floatingBtn.onclick = function(e) {
            e.stopPropagation();
            if (currentBlock) {
                let code = currentBlock.querySelector('pre > code');
                let text = code ? code.innerText.trim() : '';
                navigator.clipboard.writeText(text);
                floatingBtn.textContent = (lang === 'en' ? 'Copied!' : (lang === 'ar' ? 'تم النسخ!' : 'کپی شد!'));
                setTimeout(() => floatingBtn.textContent = (lang === 'en' ? 'Copy Code' : (lang === 'ar' ? 'نسخ الكود' : 'کپی کد')), 1200);
            }
        };
    }

    function updateFloatingBtnPosition() {
        // همه باکس‌های کد
        let codeBlocks = Array.from(document.querySelectorAll('div.code-block_container__lbMX4'));
        let found = false;
        for (let block of codeBlocks) {
            let rect = block.getBoundingClientRect();
            // اگر باکس کد در viewport دیده می‌شود
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
                // محاسبه موقعیت دکمه: سمت چپ باکس کد، وسط ارتفاع دیده‌شده باکس
                let btnHeight = floatingBtn.offsetHeight || 30;
                let visibleTop = Math.max(rect.top, 0);
                let visibleBottom = Math.min(rect.bottom, window.innerHeight);
                let visibleHeight = visibleBottom - visibleTop;

                // موقعیت وسط بخش دیده‌شده
                let topPos = visibleTop + visibleHeight / 2 - btnHeight / 2;

                floatingBtn.style.top = topPos + 'px';
                floatingBtn.style.left = (rect.left - floatingBtn.offsetWidth - 10 > 0
                    ? rect.left - floatingBtn.offsetWidth - 10
                    : rect.right + 10) + 'px';
                floatingBtn.style.display = 'block';
                currentBlock = block;
                found = true;
                break; // فقط اولین باکس کد که در دید است
            }
        }
        if (!found) {
            floatingBtn.style.display = 'none';
            currentBlock = null;
        }
    }

    // تابع برای اضافه کردن دکمه مینیمایز به بالای هر باکس پیام مدل
    function addMinimizeButtonToModelMessages() {
        let messages = document.querySelectorAll('div.bg-surface-primary.relative.flex.w-full');
        messages.forEach(box => {
            // بررسی اگر قبلا اضافه شده، دوباره اضافه نکن
            if (box.querySelector('.minimize-btn')) return;

            // پیدا کردن هدر باکس
            let header = box.querySelector('div.sticky.top-0');
            if (!header) return;

            // ساخت دکمه مینیمایز
            let btn = document.createElement('button');
            btn.innerHTML = '➖'; // آیکون مینیمایز
            btn.title = (lang === 'en' ? 'Minimize/Maximize' : (lang === 'ar' ? 'تصغير/تكبير' : 'مینیمایز/ماکسیمایز'));
            btn.className = 'minimize-btn';
            btn.style.cssText = 'margin-left: 8px; background: #eee; border: 1px solid #ccc; border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 6px; font-family: Tahoma, Arial, sans-serif;';

            // رویداد مینیمایز/ماکسیمایز
            let content = box.querySelector('.no-scrollbar');
            btn.onclick = function() {
                if (content.style.display === 'none') {
                    content.style.display = '';
                    btn.innerHTML = '➖';
                } else {
                    content.style.display = 'none';
                    btn.innerHTML = '➕';
                }
            };

            // اضافه کردن دکمه به ابتدای هدر
            header.insertBefore(btn, header.firstChild);
        });
    }

    // تابع برای اضافه کردن دکمه مینیمایز به هر پیام کاربر (خارج از border بالا)
    function addMinimizeButtonToUserMessages() {
        let userMessages = document.querySelectorAll('div.bg-surface-secondary.w-fit.min-w-0.max-w-prose.flex-1.rounded-3xl.px-3.py-2');
        userMessages.forEach(box => {
            // بررسی اگر قبلا اضافه شده، دوباره اضافه نکن
            if (box.querySelector('.user-minimize-btn')) return;

            // ساخت دکمه مینیمایز
            let btn = document.createElement('button');
            btn.innerHTML = '➖'; // آیکون مینیمایز
            btn.title = (lang === 'en' ? 'Minimize/Maximize' : (lang === 'ar' ? 'تصغير/تكبير' : 'مینیمایز/ماکسیمایز'));
            btn.className = 'user-minimize-btn';
            btn.style.cssText = 'background: #eee; border: 1px solid #ccc; border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 6px; font-family: Tahoma, Arial, sans-serif; position: absolute; top: -24px; right: 4px; z-index: 10;';

            // رویداد مینیمایز/ماکسیمایز
            let content = box.querySelector('div.prose');
            btn.onclick = function() {
                if (content.style.display === 'none') {
                    content.style.display = '';
                    btn.innerHTML = '➖';
                } else {
                    content.style.display = 'none';
                    btn.innerHTML = '➕';
                }
            };

            // اضافه کردن دکمه به باکس پیام کاربر (باکس باید relative باشد)
            if (getComputedStyle(box).position === 'static') {
                box.style.position = 'relative';
            }
            box.appendChild(btn);
        });
    }

    let isAllModelMinimized = false;
    let isAllUserMinimized = false;

    function addGlobalMinimizeButtons() {
        // پیدا کردن div footer
        let footerDiv = document.querySelector('div[data-sidebar="footer"].p-2.flex.flex-col.gap-2');
        if (!footerDiv) return;

        // چک اگر قبلاً اضافه شده، خارج شو
        if (document.getElementById('custom-buttons-div')) return;

        // ساخت div جدید برای دکمه‌ها (با gap 3px و border زیبا)
        let customButtonsDiv = document.createElement('div');
        customButtonsDiv.id = 'custom-buttons-div';
        customButtonsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 3px; margin-bottom: 3px; border: 1px solid #ccc; border-radius: 8px; padding: 4px; background: #f9f9f9;';

        // دکمه مینیمایز/ماکزیمایز همه چت‌ها (پیام‌های مدل)
        let minAllModelBtn = document.createElement('button');
        minAllModelBtn.id = 'min-all-model-btn';
        minAllModelBtn.innerHTML = (lang === 'en' ? '➖ Minimize All Chats' : (lang === 'ar' ? '➖ تصغير جميع الدردشات' : '➖ مینیمایز همه چت‌ها'));
        minAllModelBtn.setAttribute('dir', dir);
        minAllModelBtn.className = 'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>span]:group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm text-text-primary data-[active=true]:bg-sidebar-accent';
        minAllModelBtn.setAttribute('data-sidebar', 'menu-button');
        minAllModelBtn.setAttribute('data-size', 'default');
        minAllModelBtn.setAttribute('data-active', 'false');
        minAllModelBtn.setAttribute('data-state', 'closed');

        minAllModelBtn.onclick = function() {
            let messages = document.querySelectorAll('div.bg-surface-primary.relative.flex.w-full');
            if (isAllModelMinimized) {
                // ماکزیمایز
                messages.forEach(box => {
                    let content = box.querySelector('.no-scrollbar');
                    if (content) content.style.display = '';
                    let btn = box.querySelector('.minimize-btn');
                    if (btn) btn.innerHTML = '➖';
                });
                minAllModelBtn.innerHTML = (lang === 'en' ? '➖ Minimize All Chats' : (lang === 'ar' ? '➖ تصغير جميع الدردشات' : '➖ مینیمایز همه چت‌ها'));
                isAllModelMinimized = false;
            } else {
                // مینیمایز
                messages.forEach(box => {
                    let content = box.querySelector('.no-scrollbar');
                    if (content) content.style.display = 'none';
                    let btn = box.querySelector('.minimize-btn');
                    if (btn) btn.innerHTML = '➕';
                });
                minAllModelBtn.innerHTML = (lang === 'en' ? '➕ Maximize All Chats' : (lang === 'ar' ? '➕ تكبير جميع الدردشات' : '➕ باز کردن همه چت‌ها'));
                isAllModelMinimized = true;
            }
        };

        customButtonsDiv.appendChild(minAllModelBtn);

        // دکمه مینیمایز/ماکزیمایز همه پیام‌های کاربر
        let minAllUserBtn = document.createElement('button');
        minAllUserBtn.id = 'min-all-user-btn';
        minAllUserBtn.innerHTML = (lang === 'en' ? '➖ Minimize My Messages' : (lang === 'ar' ? '➖ تصغير رسائلي' : '➖ مینیمایز پیام‌های من'));
        minAllUserBtn.setAttribute('dir', dir);
        minAllUserBtn.className = 'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>span]:group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm text-text-primary data-[active=true]:bg-sidebar-accent';
        minAllUserBtn.setAttribute('data-sidebar', 'menu-button');
        minAllUserBtn.setAttribute('data-size', 'default');
        minAllUserBtn.setAttribute('data-active', 'false');
        minAllUserBtn.setAttribute('data-state', 'closed');

        minAllUserBtn.onclick = function() {
            let userMessages = document.querySelectorAll('div.bg-surface-secondary.w-fit.min-w-0.max-w-prose.flex-1.rounded-3xl.px-3.py-2');
            if (isAllUserMinimized) {
                // ماکزیمایز
                userMessages.forEach(box => {
                    let content = box.querySelector('div.prose');
                    if (content) content.style.display = '';
                    let btn = box.querySelector('.user-minimize-btn');
                    if (btn) btn.innerHTML = '➖';
                });
                minAllUserBtn.innerHTML = (lang === 'en' ? '➖ Minimize My Messages' : (lang === 'ar' ? '➖ تصغير رسائلي' : '➖ مینیمایز پیام‌های من'));
                isAllUserMinimized = false;
            } else {
                // مینیمایز
                userMessages.forEach(box => {
                    let content = box.querySelector('div.prose');
                    if (content) content.style.display = 'none';
                    let btn = box.querySelector('.user-minimize-btn');
                    if (btn) btn.innerHTML = '➕';
                });
                minAllUserBtn.innerHTML = (lang === 'en' ? '➕ Maximize My Messages' : (lang === 'ar' ? '➕ تكبير رسائلي' : '➕ باز کردن پیام‌های من'));
                isAllUserMinimized = true;
            }
        };

        customButtonsDiv.appendChild(minAllUserBtn);

        // دکمه کپی چت‌های بارگذاری شده
        let copyLoadedChatBtn = document.createElement('button');
        copyLoadedChatBtn.id = 'copy-loaded-chat-btn';
        copyLoadedChatBtn.textContent = (lang === 'en' ? 'Copy Loaded Chats' : (lang === 'ar' ? 'نسخ الدردشات المحملة' : 'کپی چت‌های بارگذاری شده'));
        copyLoadedChatBtn.setAttribute('dir', dir);
        copyLoadedChatBtn.className = 'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>span]:group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm text-text-primary data-[active=true]:bg-sidebar-accent';
        copyLoadedChatBtn.setAttribute('data-sidebar', 'menu-button');
        copyLoadedChatBtn.setAttribute('data-size', 'default');
        copyLoadedChatBtn.setAttribute('data-active', 'false');
        copyLoadedChatBtn.setAttribute('data-state', 'closed');

        copyLoadedChatBtn.onclick = function() {
            // همه پیام‌های چت (هم تو، هم مدل)
            let messages = Array.from(document.querySelectorAll('div.bg-surface-primary.relative.flex.w-full'));
            let allText = messages.map(msg => msg.innerText.trim()).join('\n\n---\n\n');
            navigator.clipboard.writeText(allText);
            copyLoadedChatBtn.textContent = (lang === 'en' ? 'Copied!' : (lang === 'ar' ? 'تم النسخ!' : 'کپی شد!'));
            setTimeout(() => copyLoadedChatBtn.textContent = (lang === 'en' ? 'Copy Loaded Chats' : (lang === 'ar' ? 'نسخ الدردشات المحملة' : 'کپی چت‌های بارگذاری شده')), 1500);
        };

        customButtonsDiv.appendChild(copyLoadedChatBtn);

        // دکمه دانلود کل چت
        let downloadAllChatBtn = document.createElement('button');
        downloadAllChatBtn.id = 'download-all-chat-btn';
        downloadAllChatBtn.textContent = (lang === 'en' ? 'Download All Chat' : (lang === 'ar' ? 'تحميل الدردشة الكاملة' : 'دانلود کل چت'));
        downloadAllChatBtn.setAttribute('dir', dir);
        downloadAllChatBtn.className = 'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>span]:group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm text-text-primary data-[active=true]:bg-sidebar-accent';
        downloadAllChatBtn.setAttribute('data-sidebar', 'menu-button');
        downloadAllChatBtn.setAttribute('data-size', 'default');
        downloadAllChatBtn.setAttribute('data-active', 'false');
        downloadAllChatBtn.setAttribute('data-state', 'closed');

        downloadAllChatBtn.onclick = function() {
            // جمع‌آوری همه پیام‌ها (مدل + کاربر) و مرتب کردن از بالا به پایین
            let modelMessages = Array.from(document.querySelectorAll('div.bg-surface-primary.relative.flex.w-full'));
            let userMessages = Array.from(document.querySelectorAll('div.bg-surface-secondary.w-fit.min-w-0.max-w-prose.flex-1.rounded-3xl.px-3.py-2'));
            let allMessages = [...modelMessages, ...userMessages];

            // مرتب کردن بر اساس موقعیت در صفحه (offsetTop)
            allMessages.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

            let allText = allMessages.map(msg => msg.innerText.trim()).join('\n\n---\n\n');

            // ایجاد فایل txt
            let blob = new Blob([allText], { type: 'text/plain' });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = 'chat.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            downloadAllChatBtn.textContent = (lang === 'en' ? 'Downloaded!' : (lang === 'ar' ? 'تم التحميل!' : 'دانلود شد!'));
            setTimeout(() => downloadAllChatBtn.textContent = (lang === 'en' ? 'Download All Chat' : (lang === 'ar' ? 'تحميل الدردشة الكاملة' : 'دانلود کل چت')), 1500);
        };

        customButtonsDiv.appendChild(downloadAllChatBtn);

        // اضافه کردن customButtonsDiv به بالای ul در footer
        let menuUl = footerDiv.querySelector('ul[data-sidebar="menu"]');
        if (menuUl) {
            footerDiv.insertBefore(customButtonsDiv, menuUl);
        }
    }

    // تابع برای اضافه کردن tooltip به لیبل‌های truncated
    function addTooltipsToTruncatedLabels() {
        let labels = document.querySelectorAll('span.truncate.text-sm');
        let currentTooltip = null;
        let timer = null;

        labels.forEach(label => {
            // بررسی اگر قبلاً tooltip اضافه شده، رد شو
            if (label.dataset.tooltipAdded) return;
            label.dataset.tooltipAdded = 'true';

            label.addEventListener('mouseenter', function() {
                // بستن بالن قبلی اگر وجود داشته باشد
                if (currentTooltip) {
                    currentTooltip.remove();
                    currentTooltip = null;
                }
                clearTimeout(timer);

                let rect = label.getBoundingClientRect();
                let tooltip = document.createElement('div');
                tooltip.textContent = label.innerText; // متن کامل
                tooltip.style.cssText = `
                    position: fixed;
                    top: ${rect.top}px;
                    left: ${rect.right + 10}px;  /* سمت راست لینک، خارج از محدوده */
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 4px 8px;
                    z-index: 10000;
                    white-space: normal;
                    max-width: 300px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    direction: rtl;
                    font-family: Tahoma, Arial, sans-serif;
                    font-size: 13px;
                `;
                document.body.appendChild(tooltip);
                currentTooltip = tooltip;

                // اگر موس روی بالن برود، تایمر را کنسل کن
                tooltip.addEventListener('mouseenter', function() {
                    clearTimeout(timer);
                });

                // وقتی موس از بالن خارج می‌شود، تایمر کوتاه برای بستن شروع شود (مثلاً 300ms)
                tooltip.addEventListener('mouseleave', function() {
                    timer = setTimeout(() => {
                        if (currentTooltip) {
                            currentTooltip.remove();
                            currentTooltip = null;
                        }
                    }, 300);
                });
            });

            label.addEventListener('mouseleave', function() {
                timer = setTimeout(() => {
                    if (currentTooltip) {
                        currentTooltip.remove();
                        currentTooltip = null;
                    }
                }, 300);
            });
        });
    }

    // اجرای اولیه با تأخیر بیشتر برای لود کامل صفحه
    setTimeout(() => {
        createFloatingBtn();
        addMinimizeButtonToModelMessages();
        addMinimizeButtonToUserMessages();
        addGlobalMinimizeButtons();
        addTooltipsToTruncatedLabels();
        updateFloatingBtnPosition();
    }, 3000); // افزایش تأخیر به 3 ثانیه

    // هر بار اسکرول یا resize، موقعیت دکمه را آپدیت کن
    window.addEventListener('scroll', updateFloatingBtnPosition);
    window.addEventListener('resize', updateFloatingBtnPosition);

    // اگر سایت داینامیک است، هر چند ثانیه یکبار دوباره اجرا کن
    setInterval(() => {
        createFloatingBtn();
        addMinimizeButtonToModelMessages();
        addMinimizeButtonToUserMessages();
        addGlobalMinimizeButtons();
        addTooltipsToTruncatedLabels();
        updateFloatingBtnPosition();
    }, 2000);

})();
