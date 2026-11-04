"use strict";

function debounce(callback, delay) {
  let timer;

  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  }

  // 输入法组词时取消尚未执行的筛选。
  debounced.cancel = function () {
    clearTimeout(timer);
  };

  return debounced;
}

// 手机导航
function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#mobile-menu");
  toggle.hidden = false;

  function setMenuOpen(isOpen) {
    menu.classList.toggle("is-open", isOpen);
    menu.inert = !isOpen;
    menu.setAttribute("aria-hidden", String(!isOpen));
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "关闭页面导航" : "打开页面导航");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  toggle.addEventListener("click", function () {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", function (event) {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });

  // 横竖屏切换或回到桌面布局时收起菜单。
  const mobileQuery = window.matchMedia("(max-width: 734px)");
  mobileQuery.addEventListener("change", closeMenu);
}

// 跟随阅读位置更新导航。
function initActiveNavigation() {
  const header = document.querySelector(".site-header");
  const links = Array.from(header.querySelectorAll("nav a[href^='#']"));
  let observer;

  function setCurrentSection(id) {
    links.forEach(function (link) {
      const active = id !== "" && link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-current", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  header.addEventListener("click", function (event) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href^='#']");
    if (link) setCurrentSection(link.getAttribute("href").slice(1));
  });
  window.addEventListener("hashchange", function () {
    setCurrentSection(window.location.hash.slice(1));
  });

  function observeSections() {
    if (!("IntersectionObserver" in window)) return;
    if (observer) observer.disconnect();
    // 用导航栏下方 48px 的区域判断当前章节。
    const top = header.offsetHeight + 32;
    const bottom = Math.max(0, window.innerHeight - top - 48);
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrentSection(entry.target.id);
      });
    }, { rootMargin: "-" + top + "px 0px -" + bottom + "px 0px", threshold: 0 });
    document.querySelectorAll("main > section").forEach(function (section) {
      observer.observe(section);
    });
  }

  setCurrentSection(window.location.hash.slice(1));
  observeSections();
  window.addEventListener("resize", debounce(observeSections, 180));
}

// 首屏视频：使用轻量封面和压缩后的 H.264 视频，播放一次后自然停住。
function initHeroVideo() {
  const video = document.querySelector(".hero__video");
  if (!video) return;
  const playButton = document.querySelector(".hero__play");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stillPoster = video.dataset.stillPoster;
  let failed = false;

  function showStill() {
    if (failed) return;
    failed = true;
    video.pause();
    video.removeAttribute("src");
    video.poster = stillPoster;
    video.load();
    playButton.hidden = true;
  }

  function play() {
    if (failed || reducedMotion.matches) return;
    const playback = video.play();
    if (playback) playback.catch(function (error) {
      if (failed) return;
      if (error.name === "NotAllowedError") {
        playButton.hidden = false; // Safari 限制自动播放时，允许用户点击播放。
      } else {
        showStill();
      }
    });
  }

  if (reducedMotion.matches) {
    video.poster = stillPoster;
    return;
  }
  video.addEventListener("error", showStill, { once: true });
  video.addEventListener("playing", function () { playButton.hidden = true; });
  playButton.addEventListener("click", play);
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.src = video.dataset.videoSrc;
  play();
  reducedMotion.addEventListener("change", function (event) {
    if (event.matches) showStill();
  });
}

// 提前加载和轮播切换共用同一个解码结果，避免重复等待。
const imagePreparation = new WeakMap();
function prepareImage(image) {
  if (!image) return Promise.resolve();
  if (imagePreparation.has(image)) return imagePreparation.get(image);
  const prepared = new Promise(function (resolve) {
    function loaded() {
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", loaded);
      resolve();
    }
    image.addEventListener("load", loaded, { once: true });
    image.addEventListener("error", loaded, { once: true });
    image.fetchPriority = "low";
    image.loading = "eager";
    if (image.complete) loaded();
  }).then(function () {
    if (image.naturalWidth && image.decode) return image.decode().catch(function () {});
  }).then(function () {
    image.classList.remove("is-image-loading");
  });
  imagePreparation.set(image, prepared);
  return prepared;
}

// 图片距视口约 1200px 时提前准备，解码完成后再淡入，保留原生懒加载作为备用。
function initImageLoading() {
  if (!("IntersectionObserver" in window)) return;
  const images = document.querySelectorAll('img[loading="lazy"]');
  const groups = new Map();
  document.documentElement.classList.add("media-enhanced");

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      groups.get(entry.target).forEach(function (image) {
        prepareImage(image);
      });
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "1200px 0px", threshold: 0 });

  images.forEach(function (image) {
    if (image.complete && image.naturalWidth) return;
    image.classList.add("is-image-loading");
    image.addEventListener("load", function () { prepareImage(image); }, { once: true });
    image.addEventListener("error", function () { prepareImage(image); }, { once: true });
    const target = image.closest(".carousel") || image;
    if (!groups.has(target)) {
      groups.set(target, []);
      observer.observe(target);
    }
    groups.get(target).push(image);
  });
}

// 内容进入视口后播放一次入场动画。
function initRevealAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window) || reducedMotion.matches) return;

  const elements = document.querySelectorAll("[data-reveal]");
  document.documentElement.classList.add("reveal-enabled");

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.08) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

  elements.forEach(function (element) {
    observer.observe(element);
  });
}

// 场景轮播
function initCarousel() {
  const carousel = document.querySelector(".carousel");
  const track = document.querySelector("#experience-track");
  const slides = Array.from(track.querySelectorAll(".slide"));
  const dots = document.querySelector(".carousel-dots");
  const dotButtons = Array.from(dots.querySelectorAll("button"));
  const previous = document.querySelector("#slide-prev");
  const next = document.querySelector("#slide-next");
  const count = document.querySelector("#carousel-count");
  const toggle = document.querySelector("#carousel-toggle");
  const playIcon = toggle.querySelector(".play-icon");
  const pauseIcon = toggle.querySelector(".pause-icon");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let currentIndex = 0;
  let autoplayEnabled = !reducedMotion.matches;
  let inView = !("IntersectionObserver" in window);
  let hovered = false;
  let scrolling = false;
  let cycleFinished = false;
  const readySlides = new Set();
  let pendingIndex = null;
  let navigationRequest = 0;

  function prepareSlide(index) {
    return prepareImage(slides[index].querySelector("img")).then(function () {
      readySlides.add(index);
    });
  }

  function updatePlayback() {
    const waiting = pendingIndex !== null || !readySlides.has(currentIndex);
    const playing = autoplayEnabled && inView && !document.hidden && !hovered && !scrolling && !waiting;
    carousel.classList.toggle("is-paused", !playing);
    carousel.setAttribute("aria-busy", String(inView && waiting));
    toggle.setAttribute("aria-pressed", String(autoplayEnabled));
    toggle.setAttribute("aria-label", autoplayEnabled ? "暂停自动播放" : "播放轮播");
    playIcon.hidden = autoplayEnabled;
    pauseIcon.hidden = !autoplayEnabled;
    count.setAttribute("aria-live", autoplayEnabled ? "off" : "polite");
  }

  function updateControls(index) {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    if (nextIndex !== currentIndex) cycleFinished = false;
    currentIndex = nextIndex;
    previous.disabled = currentIndex === 0;
    next.disabled = currentIndex === slides.length - 1;
    count.textContent = String(currentIndex + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");

    dotButtons.forEach(function (button, buttonIndex) {
      button.setAttribute("aria-current", String(buttonIndex === currentIndex));
    });
    slides.forEach(function (slide, slideIndex) {
      slide.setAttribute("aria-hidden", String(slideIndex !== currentIndex));
    });
  }

  function goToSlide(index) {
    const targetIndex = Math.max(0, Math.min(index, slides.length - 1));
    const request = ++navigationRequest;
    pendingIndex = targetIndex;
    updatePlayback();
    function showSlide() {
      if (request !== navigationRequest) return;
      const wrapping = currentIndex === slides.length - 1 && targetIndex === 0;
      pendingIndex = null;
      updateControls(targetIndex);
      track.scrollTo({
        left: currentIndex * track.clientWidth,
        behavior: reducedMotion.matches || wrapping ? "auto" : "smooth"
      });
      updatePlayback();
    }
    if (readySlides.has(targetIndex)) showSlide();
    else prepareSlide(targetIndex).then(showSlide);
  }

  // 圆点长度跟着滑动位置连续变化：滑到两项中间时，两个圆点各拉长一半。
  function updateDotLengths() {
    if (track.clientWidth === 0) return;
    const position = track.scrollLeft / track.clientWidth;
    dotButtons.forEach(function (button, index) {
      button.style.setProperty("--active", Math.max(0, 1 - Math.abs(index - position)).toFixed(3));
    });
  }

  // 手动滑动后，同步页码和按钮状态。
  function syncAfterScroll() {
    if (track.clientWidth === 0) return;
    scrolling = false;
    if (pendingIndex !== null) return;
    updateControls(Math.round(track.scrollLeft / track.clientWidth));
    prepareSlide(currentIndex).then(updatePlayback);
    updatePlayback();
  }

  // 最后一项播放结束后回到开头。
  dots.addEventListener("animationend", function (event) {
    if (event.animationName !== "carousel-progress") return;
    cycleFinished = true;
    if (autoplayEnabled) goToSlide((currentIndex + 1) % slides.length);
  });

  toggle.hidden = false;
  toggle.addEventListener("click", function () {
    autoplayEnabled = !autoplayEnabled;
    if (!autoplayEnabled) {
      navigationRequest++;
      pendingIndex = null;
    }
    if (autoplayEnabled && cycleFinished) goToSlide((currentIndex + 1) % slides.length);
    updatePlayback();
  });

  // 鼠标停留时暂停；用户手动操作后，等待再次点击播放。
  track.addEventListener("pointerenter", function (event) {
    if (event.pointerType !== "mouse") return;
    hovered = true;
    updatePlayback();
  });
  track.addEventListener("pointerleave", function () {
    hovered = false;
    updatePlayback();
  });
  track.addEventListener("pointerdown", function () {
    autoplayEnabled = false;
    navigationRequest++;
    pendingIndex = null;
    updatePlayback();
  });
  carousel.addEventListener("focusin", function (event) {
    if (event.target === toggle) return;
    autoplayEnabled = false;
    updatePlayback();
  });
  document.addEventListener("visibilitychange", updatePlayback);
  reducedMotion.addEventListener("change", function () {
    if (reducedMotion.matches) autoplayEnabled = false;
    updatePlayback();
  });
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
      if (inView) prepareSlide(currentIndex).then(updatePlayback);
      updatePlayback();
    }, { threshold: [0, 0.25] });
    visibilityObserver.observe(carousel);
  }

  previous.addEventListener("click", function () {
    goToSlide(currentIndex - 1);
  });
  next.addEventListener("click", function () {
    goToSlide(currentIndex + 1);
  });

  dots.addEventListener("click", function (event) {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("button[data-slide]");
    if (button) goToSlide(Number(button.dataset.slide));
  });

  track.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(currentIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(currentIndex + 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  // 旧浏览器没有 scrollend 时，等滚动停下 140ms 再同步状态。
  const hasScrollEnd = "onscrollend" in track;
  const finishScroll = debounce(syncAfterScroll, 140);
  track.addEventListener("scroll", function () {
    scrolling = true;
    updateDotLengths();
    updatePlayback();
    if (!hasScrollEnd) finishScroll();
  }, { passive: true });
  if (hasScrollEnd) {
    track.addEventListener("scrollend", syncAfterScroll);
  }

  // 宽度改变后重新对齐，避免停在两项之间。
  window.addEventListener("resize", debounce(function () {
    track.scrollTo({ left: currentIndex * track.clientWidth, behavior: "auto" });
  }, 180));
  updateControls(0);
  updateDotLengths();
  if (inView) prepareSlide(0).then(updatePlayback);
  carousel.classList.add("has-autoplay");
  updatePlayback();
}

// 机身配色
function initFinishPicker() {
  const picker = document.querySelector(".finish-picker");
  const buttons = picker.querySelectorAll("button");
  const images = document.querySelectorAll("[data-finish-image]");
  const label = document.querySelector("#finish-label");

  picker.addEventListener("click", function (event) {
    if (!(event.target instanceof Element)) return;
    const selected = event.target.closest("button[data-finish]");
    if (!selected || !picker.contains(selected)) return;

    buttons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button === selected));
    });
    images.forEach(function (image) {
      const active = image.dataset.finishImage === selected.dataset.finish;
      image.classList.toggle("is-active", active);
      image.setAttribute("aria-hidden", String(!active));
    });
    label.textContent = selected.dataset.name;
  });
}

// 常见问题搜索
function initFaqSearch() {
  const input = document.querySelector("#faq-search");
  const questions = Array.from(document.querySelectorAll(".faq-list details"));
  const status = document.querySelector("#faq-status");
  const empty = document.querySelector("#faq-empty");
  let composing = false;

  function filterQuestions(keyword) {
    const text = keyword.trim().toLowerCase();
    let visibleCount = 0;
    questions.forEach(function (question) {
      const matched = question.textContent.toLowerCase().includes(text);
      question.hidden = !matched;
      if (matched) visibleCount += 1;
    });
    empty.hidden = visibleCount !== 0;
    status.textContent = text ? "找到 " + visibleCount + " 个问题" : "共 " + questions.length + " 个问题";
  }

  // 停止输入 250ms 后筛选；组词期间不处理拼音。
  const delayedFilter = debounce(filterQuestions, 250);

  input.addEventListener("compositionstart", function () {
    composing = true;
    delayedFilter.cancel();
  });
  input.addEventListener("compositionend", function () {
    composing = false;
    delayedFilter(input.value);
  });
  input.addEventListener("input", function (event) {
    if (composing || event.isComposing) return;
    delayedFilter(input.value);
  });
}

initHeroVideo();
initImageLoading();
initMobileMenu();
initActiveNavigation();
initRevealAnimations();
initCarousel();
initFinishPicker();
initFaqSearch();
