// ==UserScript==
// @name                Play with MPV
// @name:en-US          Play with MPV
// @name:zh-CN          使用 MPV 播放
// @name:zh-TW          使用 MPV 播放
// @description         Play videos and songs on the website via mpv-handler
// @description:en-US   Play videos and songs on the website via mpv-handler
// @description:zh-CN   通过 mpv-handler 播放网页上的视频和歌曲
// @description:zh-TW   通過 mpv-handler 播放網頁上的視頻和歌曲
// @namespace           play-with-mpv-handler
// @version             2026.03.24
// @author              Akatsuki Rui
// @license             MIT License
// @require             https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@06f2015c04db3aaab9717298394ca4f025802873/gm_config.js
// @grant               GM_info
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_notification
// @run-at              document-idle
// @noframes
// @match               *://*.youtube.com/*
// @match               *://*.twitch.tv/*
// @match               *://*.crunchyroll.com/*
// @match               *://*.bilibili.com/*
// @match               *://*.kick.com/*
// ==/UserScript==

"use strict";

const MPV_HANDLER_VERSION = "v0.4.0";

const allow = true;
const block = false;

const SITE_YOUTUBE       = { mode: allow, list: ["/watch", "/playlist", "/shorts"] };
const SITE_TWITCH        = { mode: block, list: ["/directory", "/downloads", "/jobs", "/p", "/turbo"] };
const SITE_CRUNCHYROLL   = { mode: allow, list: ["/watch"] };
const SITE_BILIBILI      = { mode: allow, list: ["/bangumi/play", "/video"] };
const SITE_BILIBILI_LIVE = { mode: block, list: ["/p"] };
const SITE_KICK          = { mode: block, list: ["/browse", "/category"] };

const MATCHERS = {
  "www.youtube.com":     SITE_YOUTUBE,
  "m.youtube.com":       SITE_YOUTUBE,
  "www.twitch.tv":       SITE_TWITCH,
  "www.crunchyroll.com": SITE_CRUNCHYROLL,
  "www.bilibili.com":    SITE_BILIBILI,
  "live.bilibili.com":   SITE_BILIBILI_LIVE,
  "kick.com":            SITE_KICK,
};

// 内置 MPV 图标（base64 SVG），作为默认值和图标加载失败时的兜底
const ICON_MPV_B64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0\
PSI2NCIgdmVyc2lvbj0iMSI+CiA8Y2lyY2xlIHN0eWxlPSJvcGFjaXR5Oi4yIiBjeD0iMzIiIGN5\
PSIzMyIgcj0iMjgiLz4KIDxjaXJjbGUgc3R5bGU9ImZpbGw6IzhkMzQ4ZSIgY3g9IjMyIiBjeT0i\
MzIiIHI9IjI4Ii8+CiA8Y2lyY2xlIHN0eWxlPSJvcGFjaXR5Oi4zIiBjeD0iMzQuNSIgY3k9IjI5\
LjUiIHI9IjIwLjUiLz4KIDxjaXJjbGUgc3R5bGU9Im9wYWNpdHk6LjIiIGN4PSIzMiIgY3k9IjMz\
IiByPSIxNCIvPgogPGNpcmNsZSBzdHlsZT0iZmlsbDojZmZmZmZmIiBjeD0iMzIiIGN5PSIzMiIg\
cj0iMTQiLz4KIDxwYXRoIHN0eWxlPSJmaWxsOiM2OTFmNjkiIHRyYW5zZm9ybT0ibWF0cml4KDEu\
NTE1NTQ0NSwwLDAsMS41LC0zLjY1Mzg3OSwtNC45ODczODQ4KSIgZD0ibTI3LjE1NDUxNyAyNC42\
NTgyNTctMy40NjQxMDEgMi0zLjQ2NDEwMiAxLjk5OTk5OXYtNC0zLjk5OTk5OWwzLjQ2NDEwMiAy\
eiIvPgogPHBhdGggc3R5bGU9ImZpbGw6I2ZmZmZmZjtvcGFjaXR5Oi4xIiBkPSJNIDMyIDQgQSAy\
OCAyOCAwIDAgMCA0IDMyIEEgMjggMjggMCAwIDAgNC4wMjE0ODQ0IDMyLjU4NTkzOCBBIDI4IDI4\
IDAgMCAxIDMyIDUgQSAyOCAyOCAwIDAgMSA1OS45Nzg1MTYgMzIuNDE0MDYyIEEgMjggMjggMCAw\
IDAgNjAgMzIgQSAyOCAyOCAwIDAgMCAzMiA0IHoiLz4KPC9zdmc+Cg==";

const ICON_MPV_URL = `data:image/svg+xml;base64,${ICON_MPV_B64}`;

const ICON_SETTINGS_B64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0\
PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KIDxkZWZzPgogIDxzdHlsZSBpZD0iY3VycmVudC1j\
b2xvci1zY2hlbWUiIHR5cGU9InRleHQvY3NzIj4KICAgLkNvbG9yU2NoZW1lLVRleHQgeyBjb2xv\
cjojNDQ0NDQ0OyB9IC5Db2xvclNjaGVtZS1IaWdobGlnaHQgeyBjb2xvcjojNDI4NWY0OyB9CiAg\
PC9zdHlsZT4KIDwvZGVmcz4KIDxwYXRoIHN0eWxlPSJmaWxsOmN1cnJlbnRDb2xvciIgY2xhc3M9\
IkNvbG9yU2NoZW1lLVRleHQiIGQ9Ik0gNi4yNSAxIEwgNi4wOTU3MDMxIDIuODQzNzUgQSA1LjUg\
NS41IDAgMCAwIDQuNDg4MjgxMiAzLjc3MzQzNzUgTCAyLjgxMjUgMi45ODQzNzUgTCAxLjA2MjUg\
Ni4wMTU2MjUgTCAyLjU4Mzk4NDQgNy4wNzIyNjU2IEEgNS41IDUuNSAwIDAgMCAyLjUgOCBBIDUu\
NSA1LjUgMCAwIDAgMi41ODAwNzgxIDguOTMxNjQwNiBMIDEuMDYyNSA5Ljk4NDM3NSBMIDIuODEy\
NSAxMy4wMTU2MjUgTCA0LjQ4NDM3NSAxMi4yMjg1MTYgQSA1LjUgNS41IDAgMCAwIDYuMDk1NzAz\
MSAxMy4xNTIzNDQgTCA2LjI0NjA5MzggMTUuMDAxOTUzIEwgOS43NDYwOTM4IDE1LjAwMTk1MyBM\
IDkuOTAwMzkwNiAxMy4xNTgyMDMgQSA1LjUgNS41IDAgMCAwIDExLjUwNzgxMiAxMi4yMjg1MTYg\
TCAxMy4xODM1OTQgMTMuMDE3NTc4IEwgMTQuOTMzNTk0IDkuOTg2MzI4MSBMIDEzLjQxMjEwOSA4\
LjkyOTY4NzUgQSA1LjUgNS41IDAgMCAwIDEzLjQ5NjA5NCA4LjAwMTk1MzEgQSA1LjUgNS41IDAg\
MCAwIDEzLjQxNjAxNiA3LjA3MDMxMjUgTCAxNC45MzM1OTQgNi4wMTc1NzgxIEwgMTMuMTgzNTk0\
IDIuOTg2MzI4MSBMIDExLjUxMTcxOSAzLjc3MzQzNzUgQSA1LjUgNS41IDAgMCAwIDkuOTAwMzkw\
NiAyLjg0OTYwOTQgTCA5Ljc1IDEgTCA2LjI1IDEgeiBNIDggNiBBIDIgMiAwIDAgMSAxMCA4IEEg\
MiAyIDAgMCAxIDggMTAgQSAyIDIgMCAwIDEgNiA4IEEgMiAyIDAgMCAxIDggNiB6IiB0cmFuc2Zv\
cm09InRyYW5zbGF0ZSg0IDQpIi8+Cjwvc3ZnPgo=";

const css = String.raw;

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function btoaUrl(url) {
  return btoa(url).replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}

function loadPosition() {
  return { x: GM_getValue("buttonX", 8), y: GM_getValue("buttonY", 8) };
}

function savePosition(x, y) {
  GM_setValue("buttonX", x);
  GM_setValue("buttonY", y);
}

function getCurrentTime() {
  for (const video of document.getElementsByTagName("video")) {
    if (!Number.isNaN(video.currentTime) && video.currentTime > 0) return video.currentTime;
  }
  const first = document.getElementsByTagName("video")[0];
  if (first && !Number.isNaN(first.currentTime) && first.currentTime > 0) return first.currentTime;
  return null;
}

function pauseAllVideos() {
  for (const video of document.getElementsByTagName("video")) video.pause();
}

// ─── 配置面板 ────────────────────────────────────────────────────────────────

const CONFIG_ID = "play-with-mpv";

const CONFIG_CSS = css`
  body {
    display: flex;
    justify-content: center;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  #${CONFIG_ID}_wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  #${CONFIG_ID} .config_header {
    display: flex;
    align-items: center;
    padding: 12px;
  }
  #${CONFIG_ID} .config_var {
    margin: 0 0 12px 0;
  }
  #${CONFIG_ID} .field_label {
    display: inline-block;
    width: 155px;
    font-size: 14px;
  }
  #${CONFIG_ID}_field_cookies,
  #${CONFIG_ID}_field_profile,
  #${CONFIG_ID}_field_quality,
  #${CONFIG_ID}_field_v_codec,
  #${CONFIG_ID}_field_sync_time,
  #${CONFIG_ID}_field_console,
  #${CONFIG_ID}_field_icon_size,
  #${CONFIG_ID}_field_icon_scale {
    width: 80px;
    height: 24px;
    font-size: 14px;
    text-align: center;
  }
  #${CONFIG_ID}_field_icon_url {
    width: 200px;
    height: 24px;
    font-size: 12px;
  }
  #${CONFIG_ID}_buttons_holder {
    display: flex;
    flex-direction: column;
  }
  #${CONFIG_ID} .saveclose_buttons {
    margin: 1px;
    padding: 4px 0;
  }
  #${CONFIG_ID} .reset_holder {
    padding-top: 4px;
  }
`;

const CONFIG_IFRAME_CSS = css`
  position: fixed;
  z-index: 99999;
  width: 370px;
  height: 560px;
  border: 1px solid;
  border-radius: 10px;
`;

GM_config.init({
  id: CONFIG_ID,
  title: "使用 MPV 播放 — 设置",
  fields: {
    cookies: {
      label: "传递 Cookies",
      type: "select",
      options: ["yes", "no"],
      default: "no",
    },
    profile: {
      label: "MPV 配置文件",
      type: "text",
      default: "default",
    },
    quality: {
      label: "首选画质",
      type: "select",
      options: ["default", "2160p", "1440p", "1080p", "720p", "480p", "360p"],
      default: "default",
    },
    v_codec: {
      label: "首选视频编码",
      type: "select",
      options: ["default", "av01", "vp9", "h265", "h264"],
      default: "default",
    },
    sync_time: {
      label: "同步播放进度",
      type: "select",
      options: ["yes", "no"],
      default: "yes",
    },
    console: {
      label: "显示调试控制台",
      type: "select",
      options: ["yes", "no"],
      default: "yes",
    },
    icon_url: {
      label: "自定义图标",
      title: "留空则使用内置 MPV 图标；支持 http/https 或 data: URL",
      type: "text",
      default: "",
    },
    icon_size: {
      label: "图标基础大小 (px)",
      title: "最终大小 = 基础大小 × 缩放比例",
      type: "int",
      min: 16,
      max: 256,
      default: 48,
    },
    icon_scale: {
      label: "图标缩放比例",
      title: "1.0 = 原始大小，1.5 = 放大 1.5 倍",
      type: "float",
      min: 0.2,
      max: 5.0,
      default: 1.0,
    },
  },
  events: {
    init: () => {
      const quality = GM_config.get("quality").toLowerCase();
      const v_codec = GM_config.get("v_codec").toLowerCase();
      const validQ  = ["default","2160p","1440p","1080p","720p","480p","360p"];
      const validV  = ["default","av01","vp9","h265","h264"];
      if (!validQ.includes(quality)) GM_config.set("quality", "default");
      if (!validV.includes(v_codec)) GM_config.set("v_codec", "default");
      // 配置就绪后再应用图标外观（此处才是安全时机）
      applyButtonAppearance();
      updateButton();
    },
    save: () => {
      const profile = GM_config.get("profile").trim();
      GM_config.set("profile", profile === "" ? "default" : profile);
      applyButtonAppearance();
      updateButton();
      GM_config.close();
    },
    reset: () => {
      GM_config.save();
    },
  },
  css: CONFIG_CSS.trim(),
});

// ─── 协议生成 ────────────────────────────────────────────────────────────────

function generateProto(url, startTime) {
  const cookies      = GM_config.get("cookies").toLowerCase();
  const profile      = GM_config.get("profile").trim();
  const quality      = GM_config.get("quality").toLowerCase();
  const v_codec      = GM_config.get("v_codec").toLowerCase();
  const console_mode = GM_config.get("console").toLowerCase();
  const options = [];

  let proto = (console_mode === "yes" ? "mpv-handler-debug" : "mpv-handler")
    + "://play/" + btoaUrl(url);

  if (cookies === "yes")
    options.push("cookies=" + document.location.hostname + ".txt");
  if (profile !== "default" && profile !== "")
    options.push("profile=" + profile);
  if (quality !== "default")
    options.push("quality=" + quality);
  if (v_codec !== "default")
    options.push("v_codec=" + v_codec);
  if (startTime !== null && startTime !== undefined && startTime > 0)
    options.push("startat=" + startTime);

  if (options.length > 0) proto += "/?" + options.join("&");
  return proto;
}

// ─── URL 匹配 ────────────────────────────────────────────────────────────────

function matchUrl() {
  const site = MATCHERS[location.hostname];
  if (!site) return false;
  const path = location.pathname;
  for (const item of site.list) {
    if (path.startsWith(item)) {
      const next = path.charAt(item.length);
      if (next === "/" || next === "") return site.mode;
    }
  }
  return path !== "/" ? !site.mode : false;
}

// ─── 按钮外观 ────────────────────────────────────────────────────────────────

function applyButtonAppearance() {
  const btn = document.querySelector(".pwm-play");
  if (!btn) return;

  // 防御性读取，GM_config 未就绪时使用默认值
  const iconUrl   = (GM_config.get("icon_url")   ?? "").toString().trim();
  const iconSize  = Number(GM_config.get("icon_size")  ?? 48) || 48;
  const iconScale = Number(GM_config.get("icon_scale") ?? 1.0) || 1.0;
  const finalSize = Math.round(iconSize * iconScale);

  btn.style.width          = finalSize + "px";
  btn.style.height         = finalSize + "px";
  btn.style.backgroundSize = finalSize + "px";

  if (iconUrl) {
    // 预加载验证，失败时回退内置图标
    const img = new Image();
    img.onload  = () => { btn.style.backgroundImage = `url(${iconUrl})`; };
    img.onerror = () => { btn.style.backgroundImage = `url(${ICON_MPV_URL})`; };
    img.src = iconUrl;
  } else {
    btn.style.backgroundImage = `url(${ICON_MPV_URL})`;
  }
}

// ─── 按钮显示状态 ────────────────────────────────────────────────────────────

function updateButton() {
  const btn = document.querySelector(".pwm-play");
  if (!btn) return;
  btn.style.display = matchUrl() && !document.fullscreenElement ? "block" : "none";
}

// ─── 拖拽 ────────────────────────────────────────────────────────────────────

function makeDraggable(buttonDiv) {
  const pos = loadPosition();
  buttonDiv.style.left   = pos.x + "px";
  buttonDiv.style.bottom = pos.y + "px";

  buttonDiv.addEventListener("mousedown", (e) => {
    if (e.target.closest(".pwm-settings") || e.target.closest(".pwm-play")) return;

    const rect    = buttonDiv.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    let dragged   = false;

    function onMouseMove(e) {
      dragged = true;
      buttonDiv.classList.add("dragging");

      const winW = window.innerWidth,  winH = window.innerHeight;
      const divW = buttonDiv.offsetWidth, divH = buttonDiv.offsetHeight;

      let newLeft = e.clientX - offsetX;
      let newTop  = e.clientY - offsetY;

      if (newLeft < 0) newLeft = 0;
      if (newLeft + divW > winW) newLeft = winW - divW;
      if (newTop  < 0) newTop  = 0;
      if (newTop  + divH > winH) newTop = winH - divH;

      const newBottom = winH - newTop - divH;
      buttonDiv.style.left   = newLeft  + "px";
      buttonDiv.style.bottom = newBottom + "px";
      savePosition(newLeft, newBottom);
    }

    function onMouseUp() {
      buttonDiv.classList.remove("dragging");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
      if (!dragged) triggerPlay();
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  });
}

// ─── 播放触发 ────────────────────────────────────────────────────────────────

function triggerPlay() {
  if (!matchUrl()) return;
  const syncTime  = GM_config.get("sync_time").toLowerCase() === "yes";
  const startTime = syncTime ? getCurrentTime() : null;
  pauseAllVideos();
  window.location.href = generateProto(location.href, startTime);
}

// ─── 更新通知 ────────────────────────────────────────────────────────────────

function notifyUpdate() {
  if (GM_getValue("mpvHandlerVersion", null) !== MPV_HANDLER_VERSION) {
    GM_notification({
      title: GM_info.script.name,
      text: `mpv-handler 已更新至 ${MPV_HANDLER_VERSION}\n\n点击查看更新日志`,
      onclick: () => window.open("https://github.com/akiirui/mpv-handler/releases/latest"),
    });
    GM_setValue("mpvHandlerVersion", MPV_HANDLER_VERSION);
  }
}

// ─── 创建按钮 DOM ────────────────────────────────────────────────────────────

function createButton() {
  const style = document.createElement("style");
  style.textContent = css`
    .play-with-mpv {
      z-index: 99999;
      position: fixed;
      left: 8px;
      bottom: 8px;
      user-select: none;
      -webkit-user-select: none;
    }
    .play-with-mpv.dragging {
      outline: 2px solid rgba(141, 52, 142, 0.6);
      border-radius: 50%;
    }
    .pwm-play {
      display: block;
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 50%;
      background-size: 48px;
      background-image: url(data:image/svg+xml;base64,${ICON_MPV_B64});
      background-repeat: no-repeat;
      cursor: grab;
      text-decoration: none;
    }
    .pwm-play:active {
      cursor: grabbing;
    }
    .pwm-settings {
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease-in-out;
      display: block;
      position: absolute;
      top: -32px;
      width: 32px;
      height: 32px;
      margin-left: 8px;
      border: 0;
      border-radius: 50%;
      background-size: 32px;
      background-color: #eeeeee;
      background-image: url(data:image/svg+xml;base64,${ICON_SETTINGS_B64});
      background-repeat: no-repeat;
      cursor: pointer;
    }
    .pwm-play:hover + .pwm-settings,
    .pwm-settings:hover {
      opacity: 1;
      visibility: visible;
      transition: all 0.2s ease-in-out;
    }
  `.trim();

  if (document.head) document.head.appendChild(style);
  if (!document.body) return;

  const buttonDiv      = document.createElement("div");
  const buttonPlay     = document.createElement("a");
  const buttonSettings = document.createElement("button");

  buttonPlay.className     = "pwm-play";
  buttonPlay.style.display = "none";
  // 键盘 / 辅助功能兜底
  buttonPlay.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); triggerPlay(); });

  buttonSettings.className = "pwm-settings";
  buttonSettings.title     = "打开设置";
  buttonSettings.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!GM_config.isOpen) {
      GM_config.open();
      GM_config.frame.style.cssText = CONFIG_IFRAME_CSS.trim();
    }
  });

  buttonDiv.className = "play-with-mpv";
  buttonDiv.appendChild(buttonPlay);
  buttonDiv.appendChild(buttonSettings);
  document.body.appendChild(buttonDiv);

  makeDraggable(buttonDiv);
  // 注意：applyButtonAppearance() 在 GM_config init 事件里调用，此处不再调用
  document.addEventListener("fullscreenchange", updateButton);
}

// ─── PJAX / SPA 路由监测 ────────────────────────────────────────────────────

function detectPJAX() {
  let previousUrl = null;
  setInterval(() => {
    const cur = location.href;
    if (previousUrl !== cur) { updateButton(); previousUrl = cur; }
  }, 500);
}

// ─── TrustedHTML 兼容 ────────────────────────────────────────────────────────

if (window.trustedTypes && !trustedTypes.defaultPolicy) {
  const pass = (x) => x;
  trustedTypes.createPolicy("default", {
    createHTML: pass, createScriptURL: pass, createScript: pass,
  });
}

// ─── 启动 ────────────────────────────────────────────────────────────────────

notifyUpdate();
createButton();
detectPJAX();
