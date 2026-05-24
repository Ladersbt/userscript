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
// @version             2026.05.24
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

// ★ 修改：移除循环后冗余的重复取 video[0] 判断（死代码），逻辑完全等价
function getCurrentTime() {
  for (const video of document.getElementsByTagName("video")) {
    if (!Number.isNaN(video.currentTime) && video.currentTime > 0) return video.currentTime;
  }
  return null;
}

function pauseAllVideos() {
  for (const video of document.getElementsByTagName("video")) video.pause();
}

function hideMainButton() {
  const root = document.querySelector(".play-with-mpv");
  if (root) root.style.display = "none";
}

function showMainButton() {
  const root = document.querySelector(".play-with-mpv");
  if (root) root.style.display = "";
}

// ─── 配置面板 ────────────────────────────────────────────────────────────────

const CONFIG_ID = "play-with-mpv";

const CONFIG_CSS = css`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; }

  body {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, rgba(109,40,110,0.18) 0%, rgba(30,20,50,0.22) 100%);
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  #${CONFIG_ID}_wrapper {
    display: flex;
    flex-direction: column;
    width: 99%;
    height: 100%;
    padding: 0 12px 12px;
    overflow-y: auto;
    margin-left: auto;  /* 保证面板居中 */
    margin-right: auto; /* 保证面板居中 */
  }

  /* ── 标题栏 ── */
  #${CONFIG_ID} .config_header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 4px 14px;
    font-size: 15px;
    font-weight: 600;
    color: #d4b8ff;
    letter-spacing: 0.01em;
    border-bottom: 1px solid rgba(180,130,255,0.15);
    margin-bottom: 16px;
  }
  #${CONFIG_ID} .config_header::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #a855f7;
    box-shadow: 0 0 8px #a855f7;
    flex-shrink: 0;
  }

  /* ── 每行设置项 ── */
  #${CONFIG_ID} .config_var {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 10px 0;
    padding: 12px 4px;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    transition: background 0.15s;
  }
  #${CONFIG_ID} .config_var:hover {
    background: rgba(168,85,247,0.08);
    border-color: rgba(168,85,247,0.2);
  }

  /* ── 标签 ── */
  #${CONFIG_ID} .field_label {
    display: inline-block;
    width: auto;
    font-size: 13px;
    font-weight: 500;
    color: #c4b5d8;
    letter-spacing: 0.01em;
    flex: 1;
  }

  /* ── 下拉 & 文本输入公共样式 ── */
  #${CONFIG_ID}_field_cookies,
  #${CONFIG_ID}_field_profile,
  #${CONFIG_ID}_field_quality,
  #${CONFIG_ID}_field_v_codec,
  #${CONFIG_ID}_field_sync_time,
  #${CONFIG_ID}_field_console,
  #${CONFIG_ID}_field_icon_size,
  #${CONFIG_ID}_field_icon_scale,
  /* ★ 新增：auto_play 字段样式 */
  #${CONFIG_ID}_field_auto_play,
  #${CONFIG_ID}_field_icon_url {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(168,85,247,0.3);
    border-radius: 8px;
    color: #e8d8ff;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    padding: 4px 8px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: auto;
  }
  #${CONFIG_ID}_field_cookies,
  #${CONFIG_ID}_field_quality,
  #${CONFIG_ID}_field_v_codec,
  #${CONFIG_ID}_field_sync_time,
  #${CONFIG_ID}_field_console,
  /* ★ 新增：auto_play 尺寸与其他下拉保持一致 */
  #${CONFIG_ID}_field_auto_play {
    width: 90px;
    height: 30px;
    text-align: center;
  }
  #${CONFIG_ID}_field_profile,
  #${CONFIG_ID}_field_icon_size,
  #${CONFIG_ID}_field_icon_scale {
    width: 90px;
    height: 30px;
    text-align: center;
  }
  #${CONFIG_ID}_field_icon_url {
    width: 160px;
    height: 30px;
    font-size: 11px;
  }
  #${CONFIG_ID}_field_cookies:focus,
  #${CONFIG_ID}_field_profile:focus,
  #${CONFIG_ID}_field_quality:focus,
  #${CONFIG_ID}_field_v_codec:focus,
  #${CONFIG_ID}_field_sync_time:focus,
  #${CONFIG_ID}_field_console:focus,
  #${CONFIG_ID}_field_icon_size:focus,
  #${CONFIG_ID}_field_icon_scale:focus,
  /* ★ 新增：auto_play focus 高亮 */
  #${CONFIG_ID}_field_auto_play:focus,
  #${CONFIG_ID}_field_icon_url:focus {
    border-color: rgba(168,85,247,0.7);
    box-shadow: 0 0 0 3px rgba(168,85,247,0.15);
  }

  /* ── 按钮区 ── */
  #${CONFIG_ID}_buttons_holder {
    display: flex;
    flex-direction: row;
    gap: 8px;
    margin-top: 6px;
  }
  #${CONFIG_ID} .saveclose_buttons {
    flex: 1;
    margin: 0;
    padding: 8px 0;
    border-radius: 10px;
    border: none;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
  }
  /* 保存按钮 */
  #${CONFIG_ID}_saveBtn {
    background: linear-gradient(135deg, #9333ea, #6d28d9);
    color: #fff;
    box-shadow: 0 2px 12px rgba(147,51,234,0.35);
  }
  #${CONFIG_ID}_saveBtn:hover {
    box-shadow: 0 4px 20px rgba(147,51,234,0.55);
    transform: translateY(-1px);
  }
  /* 关闭按钮 */
  #${CONFIG_ID}_closeBtn {
    background: rgba(255,255,255,0.07);
    color: #c4b5d8;
    border: 1px solid rgba(255,255,255,0.12) !important;
  }
  #${CONFIG_ID}_closeBtn:hover {
    background: rgba(255,255,255,0.12);
  }
  #${CONFIG_ID} .reset_holder {
    padding-top: 0;
    display: flex;
  }
  /* 重置按钮 */
  #${CONFIG_ID}_resetBtn {
    flex: 1;
    padding: 7px 0;
    border-radius: 10px;
    border: 1px solid rgba(239,68,68,0.25) !important;
    background: rgba(239,68,68,0.06);
    color: rgba(252,165,165,0.8);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
  }
  #${CONFIG_ID}_resetBtn:hover {
    background: rgba(239,68,68,0.12);
    border-color: rgba(239,68,68,0.4) !important;
    color: #fca5a5;
  }
`;

// ★ 修改：CONFIG_IFRAME_CSS 中 width/max-width 的 30px 是原脚本笔误，修正为 430px
const CONFIG_IFRAME_CSS = css`
  position: fixed;
  z-index: 99999;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(430px, calc(100vw - 32px)) !important;
  height: min(520px, calc(100vh - 32px));
  max-width: 430px !important;
  max-height: 520px;
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 18px;
  background: rgba(18, 10, 30, 0.82);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  box-shadow: 0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.1) inset;
  animation: pwm-panel-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
`;

GM_config.init({
  id: CONFIG_ID,
  title: "设置",
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
    // ★ 新增：自动启动开关字段
    auto_play: {
      label: "检测到播放时自动启动 MPV",
      title: "开启后，页面视频开始播放时自动调用 MPV，无需手动点击图标",
      type: "select",
      options: ["yes", "no"],
      default: "no",
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
      // ★ 新增：配置就绪后启动自动播放监听
      setupAutoPlay();
    },

    // ★ 修改：统一缩进为空格，与其余事件保持一致（原脚本 open/close 用了制表符）
    open: () => {
      hideMainButton();
    },

    close: () => {
      showMainButton();
      updateButton();
    },

    save: () => {
      const profile = GM_config.get("profile").trim();
      GM_config.set("profile", profile === "" ? "default" : profile);
      applyButtonAppearance();
      updateButton();
      // ★ 新增：保存后立即重新应用自动播放监听（开/关即时生效）
      setupAutoPlay();
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

// ─── 自动启动 MPV ────────────────────────────────────────────────────────────
// ★ 新增：以下全部为新增代码

// 记录当前绑定的捕获阶段监听器，用于重置时移除旧监听
let _autoPlayHandler = null;

function setupAutoPlay() {
  // 先清理上一次绑定，避免保存设置后重复挂载
  if (_autoPlayHandler) {
    document.removeEventListener("play", _autoPlayHandler, true);
    _autoPlayHandler = null;
  }

  if (GM_config.get("auto_play").toLowerCase() !== "yes") return;

  _autoPlayHandler = (e) => {
    // 只响应 video 元素的 play 事件，且当前 URL 必须匹配规则
    if (!(e.target instanceof HTMLVideoElement)) return;
    if (!matchUrl()) return;
    triggerPlay();
  };

  // 捕获阶段监听：确保 SPA 动态替换的 video 元素也能被捕获到
  document.addEventListener("play", _autoPlayHandler, true);
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
    @keyframes pwm-ripple {
      to { transform: scale(3.5); opacity: 0; }
    }
    @keyframes pwm-panel-in {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes pwm-glow-pulse {
      0%, 100% { box-shadow: 0 0 14px 2px rgba(168,85,247,0.35), 0 4px 20px rgba(0,0,0,0.4); }
      50%       { box-shadow: 0 0 22px 5px rgba(168,85,247,0.55), 0 4px 24px rgba(0,0,0,0.45); }
    }

    .play-with-mpv {
      z-index: 99999;
      position: fixed;
      left: 8px;
      bottom: 8px;
      user-select: none;
      -webkit-user-select: none;
      /* 让设置按钮溢出不被裁剪 */
      overflow: visible;
    }

    /* 拖拽中：柔和紫色发光轮廓 */
    .play-with-mpv.dragging .pwm-play {
      box-shadow: 0 0 0 3px rgba(168,85,247,0.7), 0 0 20px rgba(168,85,247,0.4);
      transform: scale(1.06);
    }

    /* ── 主播放按钮 ── */
    .pwm-play {
      display: block;
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 50%;
      background-color: rgba(20, 10, 35, 0.55);
      background-size: 72%;
      background-position: center;
      background-repeat: no-repeat;
      background-image: url(data:image/svg+xml;base64,${ICON_MPV_B64});
      backdrop-filter: blur(12px) saturate(1.5);
      -webkit-backdrop-filter: blur(12px) saturate(1.5);
      box-shadow: 0 0 14px 2px rgba(168,85,247,0.35), 0 4px 20px rgba(0,0,0,0.4);
      cursor: grab;
      text-decoration: none;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.2s ease,
                  background-color 0.2s ease;
      animation: pwm-glow-pulse 3s ease-in-out infinite;
    }
    .pwm-play:hover {
      transform: scale(1.13);
      background-color: rgba(30, 14, 50, 0.72);
      box-shadow: 0 0 22px 5px rgba(168,85,247,0.55), 0 6px 28px rgba(0,0,0,0.5);
      animation: none;
    }
    .pwm-play:active {
      cursor: grabbing;
      transform: scale(0.96);
    }

    /* 点击波纹 */
    .pwm-ripple {
      position: absolute;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      background: rgba(200,160,255,0.45);
      transform: scale(0);
      animation: pwm-ripple 0.5s ease-out forwards;
      pointer-events: none;
    }

    /* ── 设置齿轮按钮 ── */
    .pwm-settings {
      opacity: 0;
      visibility: hidden;
      transform: translateX(-6px) scale(0.85);
      transition: opacity 0.2s ease, visibility 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
      display: block;
      position: absolute;
      top: 50%;
      left: calc(100% + 8px);
      translate: 0 -50%;
      width: 37px;
      height: 37px;
      border: 0;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.7);
      background-size: 60%;
      background-position: center;
      background-repeat: no-repeat;
      background-image: url(data:image/svg+xml;base64,${ICON_SETTINGS_B64});
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 2px 10px rgba(0,0,0,0.35), 0 0 0 1px rgba(168,85,247,0.2);
      cursor: pointer;
    }
    .pwm-play:hover ~ .pwm-settings,
    .pwm-settings:hover {
      opacity: 1;
      visibility: visible;
      transform: translateX(0) scale(1);
    }
    .pwm-settings:hover {
      background-color: rgba(200, 180, 240, 0.7);
      box-shadow: 0 2px 14px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.45);
    }
    .pwm-settings:active {
      transform: scale(0.92) translateX(0);
    }
  `.trim();

  if (document.head) document.head.appendChild(style);
  if (!document.body) return;

  const buttonDiv      = document.createElement("div");
  const buttonPlay     = document.createElement("a");
  const buttonSettings = document.createElement("button");

  buttonPlay.className     = "pwm-play";
  buttonPlay.style.display = "none";
  // 键盘 / 辅助功能兜底 + 波纹动效
  buttonPlay.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    // 波纹
    const ripple = document.createElement("span");
    ripple.className = "pwm-ripple";
    const rect = buttonPlay.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left - 7) + "px";
    ripple.style.top  = (e.clientY - rect.top  - 7) + "px";
    buttonPlay.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
    triggerPlay();
  });

  buttonSettings.className = "pwm-settings";
  buttonSettings.title     = "打开设置";

  // ★ 修改：localizeConfigButtons 提出到正确层级（原脚本此函数错误地嵌入在
  //   buttonSettings.title 赋值语句后，导致缩进/结构混乱）
  function localizeConfigButtons(frame, retry = 0) {
    try {
      const doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;

      const saveBtn  = doc.getElementById(CONFIG_ID + "_saveBtn");
      const closeBtn = doc.getElementById(CONFIG_ID + "_closeBtn");
      const resetBtn = doc.getElementById(CONFIG_ID + "_resetBtn");

      if (!saveBtn || !closeBtn || !resetBtn) {
        if (retry < 20) {
          setTimeout(() => localizeConfigButtons(frame, retry + 1), 50);
        }
        return;
      }

      if (saveBtn) {
        saveBtn.value = "保存";
        saveBtn.textContent = "保存";
        saveBtn.title = "保存";
        saveBtn.setAttribute("aria-label", "保存");
      }

      if (closeBtn) {
        closeBtn.value = "关闭";
        closeBtn.textContent = "关闭";
        closeBtn.title = "关闭";
        closeBtn.setAttribute("aria-label", "关闭");
      }

      if (resetBtn) {
        resetBtn.value = "恢复默认值";
        resetBtn.textContent = "恢复默认值";
        resetBtn.title = "恢复默认值";
        resetBtn.setAttribute("aria-label", "恢复默认值");
      }

      frame.style.visibility = "";
      frame.style.opacity = "1";
      frame.style.transition = "opacity 0.15s ease";
    } catch (_) {
      if (retry < 20) {
        setTimeout(() => localizeConfigButtons(frame, retry + 1), 50);
      } else {
        frame.style.visibility = "";
        frame.style.opacity = "1";
      }
    }
  }

  buttonSettings.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!GM_config.isOpen) {
      hideMainButton();
      GM_config.open();

      setTimeout(() => {
        const frame = document.getElementById(CONFIG_ID + "_frame");
        if (!frame) return;

        // 先隐藏，等按钮汉化完成再显示（避免闪烁）
        frame.style.visibility = "hidden";
        frame.style.opacity = "0";
        // 用 cssText 整体替换，这是最后写入，稳赢
        frame.style.cssText = CONFIG_IFRAME_CSS.trim();

        if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
          localizeConfigButtons(frame);
        } else {
          frame.addEventListener("load", () => localizeConfigButtons(frame), { once: true });
        }
      }, 50);
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
