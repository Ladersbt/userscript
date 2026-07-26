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
// @version             2026.07.26
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
  "music.youtube.com":   SITE_YOUTUBE,
  "www.twitch.tv":       SITE_TWITCH,
  "m.twitch.tv":         SITE_TWITCH,
  "www.crunchyroll.com": SITE_CRUNCHYROLL,
  "m.crunchyroll.com":   SITE_CRUNCHYROLL,
  "www.bilibili.com":    SITE_BILIBILI,
  "m.bilibili.com":      SITE_BILIBILI,
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

// ★ 新增(c)：auto_play_mode 枚举常量，避免中文字符串直接参与逻辑比较
const MODE_PER_VIDEO   = "每次切换视频";
const MODE_FIRST_LOAD  = "仅首次加载";

// ─── 工具函数 ────────────────────────────────────────────────────────────────

// ★ 修改(c)：原 btoa() 不支持非 ASCII 字符，B站含中文参数的 URL 会抛 InvalidCharacterError
//   改用 encodeURIComponent + unescape 先转为 Latin-1 兼容字符串再 btoa
function btoaUrl(url) {
  return btoa(unescape(encodeURIComponent(url))).replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
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
  /* ★ 新增：auto_play / takeover / auto_play_mode 字段样式 */
  #${CONFIG_ID}_field_auto_play,
  #${CONFIG_ID}_field_takeover,
  #${CONFIG_ID}_field_auto_play_mode,
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
  /* ★ 新增：auto_play / takeover / auto_play_mode 尺寸与其他下拉保持一致 */
  #${CONFIG_ID}_field_auto_play,
  #${CONFIG_ID}_field_takeover,
  #${CONFIG_ID}_field_auto_play_mode,
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
  /* ★ 新增：auto_play / takeover / auto_play_mode focus 高亮 */
  #${CONFIG_ID}_field_auto_play:focus,
  #${CONFIG_ID}_field_takeover:focus,
  #${CONFIG_ID}_field_auto_play_mode:focus,
  #${CONFIG_ID}_field_icon_url:focus {
    border-color: rgba(168,85,247,0.7);
    box-shadow: 0 0 0 3px rgba(168,85,247,0.15);
  }

  /* ── 按钮区：主次分组布局 ──
     上行：保存 + 关闭（等宽并排，主要操作）
     下行：恢复默认值（跨整行，弱化样式，危险操作）
     GM_config 的 DOM 结构为：
       <div #_buttons_holder>
         <button #_saveBtn>
         <button #_closeBtn>
         <div .reset_holder><a #_resetLink></div>
       </div>
     用 Grid 两列布局，reset_holder 跨两列强制换行到第二行 */
  #${CONFIG_ID}_buttons_holder {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 6px;
  }
  #${CONFIG_ID} .saveclose_buttons {
    margin: 0;
    padding: 9px 0;
    border-radius: 10px;
    border: none;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
  }
  /* 保存按钮（主操作） */
  #${CONFIG_ID}_saveBtn {
    background: linear-gradient(135deg, #9333ea, #6d28d9);
    color: #fff;
    box-shadow: 0 2px 12px rgba(147,51,234,0.35);
  }
  #${CONFIG_ID}_saveBtn:hover {
    box-shadow: 0 4px 20px rgba(147,51,234,0.55);
    transform: translateY(-1px);
  }
  #${CONFIG_ID}_saveBtn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(147,51,234,0.4);
  }
  /* 关闭按钮（次要操作）- 浅紫色与保存形成深浅呼应 */
  #${CONFIG_ID}_closeBtn {
    background: rgba(147,51,234,0.1);
    color: #c4b5fd;
    border: 1px solid rgba(147,51,234,0.25) !important;
  }
  #${CONFIG_ID}_closeBtn:hover {
    background: rgba(147,51,234,0.18);
    color: #ddd6fe;
    border-color: rgba(147,51,234,0.4) !important;
  }
  /* 重置按钮容器：跨两列换到第二行，文字右对齐
     不用 flex，保留 GM_config 默认的 text-align: right */
  #${CONFIG_ID} .reset_holder {
    grid-column: 1 / -1;
    padding-top: 0;
    text-align: right;
  }
  /* 重置按钮（危险操作，弱化样式）
     - inline-block 只占文字大小，不占整行
     - 虚线边框暗示"谨慎"
     - 字号小一号、颜色更淡，视觉层级低于保存/关闭
     - hover 时变实线 + 加深，给出明确反馈 */
  #${CONFIG_ID}_resetLink {
    display: inline-block;
    text-align: center;
    text-decoration: none;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px dashed rgba(239,68,68,0.25) !important;
    background: transparent;
    color: rgba(252,165,165,0.6);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
  }
  #${CONFIG_ID}_resetLink:hover {
    background: rgba(239,68,68,0.08);
    border-color: rgba(239,68,68,0.4) !important;
    border-style: solid;
    color: #fca5a5;
  }
`;

// ★ 修改：CONFIG_IFRAME_CSS 中 width/max-width 的 30px 是原脚本笔误，修正为 430px
// ★ 修复：补 display: block。cssText 整体替换会清空 GM_config 在 buildConfigWin 里
//   设置的 display: block，iframe 默认 display: inline 会让 width/height/transform
//   失效，面板塌缩到屏幕左上角
const CONFIG_IFRAME_CSS = css`
  display: block;
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

// ─── 配置面板按钮汉化 ────────────────────────────────────────────────────────
// ★ 修复：从 createButton() 内部提到顶层，供 GM_config 的 open 事件回调直接调用。
//   GM_config 源码中重置元素是 <a id="_resetLink">（不是 _resetBtn），原写法永远
//   找不到该元素 → 汉化永不生效。另外 <a> 没有 value 属性，仅设 textContent 等。
function localizeConfigButtons(frame, retry = 0) {
  try {
    const doc = frame.contentDocument || frame.contentWindow.document;
    if (!doc) return;

    const saveBtn  = doc.getElementById(CONFIG_ID + "_saveBtn");
    const closeBtn = doc.getElementById(CONFIG_ID + "_closeBtn");
    const resetLnk = doc.getElementById(CONFIG_ID + "_resetLink");

    if (!saveBtn || !closeBtn || !resetLnk) {
      if (retry < 20) {
        setTimeout(() => localizeConfigButtons(frame, retry + 1), 50);
      }
      return;
    }

    saveBtn.value = "保存";
    saveBtn.textContent = "保存";
    saveBtn.title = "保存";
    saveBtn.setAttribute("aria-label", "保存");

    closeBtn.value = "关闭";
    closeBtn.textContent = "关闭";
    closeBtn.title = "关闭";
    closeBtn.setAttribute("aria-label", "关闭");

    // reset 是 <a> 元素，无 value 属性
    resetLnk.textContent = "恢复默认值";
    resetLnk.title = "恢复默认值";
    resetLnk.setAttribute("aria-label", "恢复默认值");

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
    // ★ 修改：auto_play 重命名含义更清晰；新增 takeover（接管播放）和 auto_play_mode（触发时机）
    auto_play: {
      label: "首次播放时自动启动 MPV",
      title: "开启后，每个视频页面首次播放时自动调用一次 MPV，之后不再干预",
      type: "select",
      options: ["yes", "no"],
      default: "no",
    },
    auto_play_mode: {
      label: "自动启动的触发时机",
      title: "每次切换视频：URL 变化后重置，下一个视频再触发一次\n仅首次加载：只在页面硬加载后的第一次播放触发，SPA 跳转不重置",
      type: "select",
      // ★ 修改(c)：options/default 与常量保持一致，改动量最小，值本身不变
      options: [MODE_PER_VIDEO, MODE_FIRST_LOAD],
      default: MODE_PER_VIDEO,
    },
    takeover: {
      label: "接管网站播放器（持续调用 MPV）",
      title: "开启后，只要页面视频播放就调用 MPV，关闭 MPV 后用网站播放器继续看也会再次触发\n与「首次自动启动」独立，可单独开启",
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
      setupTakeover();
    },

    // ★ 修复：在 GM_config 的 center() 之后应用自定义样式。
    //   GM_config 的 buildConfigWin 在 iframe load 事件里执行 center()，
    //   重负载页面（YouTube 等）上 load 可能晚于外部 setTimeout(50ms)，
    //   导致我们的 cssText 先应用、center() 随后覆盖回左上角。
    //   open 事件在 center() 之后、display=block 之前触发，时机可控。
    open: (doc, win, frame) => {
      hideMainButton();
      frame.style.cssText = CONFIG_IFRAME_CSS.trim();
      // 先隐藏，等按钮汉化完成再显示（避免中英闪烁）
      frame.style.visibility = "hidden";
      frame.style.opacity = "0";
      localizeConfigButtons(frame);
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
      setupTakeover();
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

  // ★ 修改(c)：加白名单校验，过滤 javascript: 等危险协议，只允许 http/https/data:image/
  const iconUrlRaw = (GM_config.get("icon_url") ?? "").toString().trim();
  const iconUrl    = /^(https?:|data:image\/)/.test(iconUrlRaw) ? iconUrlRaw : "";
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

// ★ 修复：拖拽与点击的事件协调 flag。
//   DOM 事件顺序为 mousedown → mousemove* → mouseup → click。
//   拖拽发生时，mouseup 置 _justDragged=true，紧随的 click 事件读到 flag 后跳过播放，
//   随后 setTimeout(0) 复位（click 同步执行于 setTimeout 之前，flag 必然被读到）。
let _justDragged = false;

function makeDraggable(buttonDiv) {
  const pos = loadPosition();
  buttonDiv.style.left   = pos.x + "px";
  buttonDiv.style.bottom = pos.y + "px";

  buttonDiv.addEventListener("mousedown", (e) => {
    // ★ 修复：原写法对 .pwm-play 也提前 return，导致拖拽逻辑永远不执行。
    //   .pwm-play 是父容器内唯一可见子元素（占满整个 48×48 区域），
    //   对它 return 等于禁用全部拖拽。这里只排除设置齿轮按钮，
    //   点击/拖拽由 click handler 和 _justDragged flag 协调。
    if (e.target.closest(".pwm-settings")) return;

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
    }

    function onMouseUp() {
      buttonDiv.classList.remove("dragging");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup",   onMouseUp);
      if (dragged) {
        // 拖拽发生：保存最终位置（避免 mousemove 每帧写 GM 存储），
        // 并置 flag 让紧随的 click 事件跳过播放
        savePosition(buttonDiv.offsetLeft, parseInt(buttonDiv.style.bottom, 10) || 0);
        _justDragged = true;
        setTimeout(() => { _justDragged = false; }, 0);
      }
      // 不拖时也不在此调用 triggerPlay，统一交给 click handler 处理
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup",   onMouseUp);
  });
}

// ─── 播放触发 ────────────────────────────────────────────────────────────────

function triggerPlay() {
  // ★ 修复：清空所有 pending 的 debounce 计时器，避免以下双发场景：
  //   1) 手动点击 + auto_play/takeover 监听器已 schedule timer → 立即执行 + 500ms 后再执行
  //   2) auto_play 与 takeover 同时开启 → 首次 play 事件 schedule 两个独立 timer → 500ms 后双发
  for (const k of Object.keys(_debounceTimers)) {
    clearTimeout(_debounceTimers[k]);
    delete _debounceTimers[k];
  }
  if (!matchUrl()) return;
  const syncTime  = GM_config.get("sync_time").toLowerCase() === "yes";
  const startTime = syncTime ? getCurrentTime() : null;
  pauseAllVideos();
  window.location.href = generateProto(location.href, startTime);
}

// ─── 自动启动 / 接管播放 ─────────────────────────────────────────────────────
// ★ 修改：完整重写此区块，拆分为功能 A（首次自动启动）和功能 B（接管播放），
//   同时加入去抖逻辑修复 YouTube 双窗口 bug

// ★ 修改(c)：改为按 key 各持独立计时器，auto 和 takeover 互不干扰
//   注意：当前实为 leading-edge throttle（500ms 内首调用执行，后续丢弃），
//   不是标准 debounce。triggerPlay 入口已统一清空 pending timer，避免双发。
const _debounceTimers = {};
function triggerPlayDebounced(key) {
  if (_debounceTimers[key]) return;
  _debounceTimers[key] = setTimeout(() => {
    delete _debounceTimers[key];
    triggerPlay();
  }, 500);
}

// 判断 video 元素是否为"真实可见的主播放器"，过滤掉广告槽/预加载隐藏 video
function isVisibleVideo(video) {
  if (!video.src && !video.currentSrc) return false;
  if (video.offsetWidth === 0 && video.offsetHeight === 0) return false;
  const style = window.getComputedStyle(video);
  if (style.display === "none" || style.visibility === "hidden") return false;
  return true;
}

// ── 功能 A：首次自动启动 ──────────────────────────────────────────────────────
// ★ 修复：MODE_FIRST_LOAD 模式下，detectPJAX 不会重置 _autoPlayFiredUrl，
//   但 SPA 跳转后 location.href 变为新值，与旧值必然不等 → 仍会触发，与
//   "仅首次加载"语义不符。改为按模式分支：
//   - MODE_PER_VIDEO：比对 URL，detectPJAX 切换视频时重置 _autoPlayFiredUrl
//   - MODE_FIRST_LOAD：用独立 boolean _autoPlayFiredOnce，整个页面生命周期内只触发一次
let _autoPlayFiredUrl   = null;
let _autoPlayFiredOnce  = false;
let _autoPlayHandler    = null;

function setupAutoPlay() {
  // 先清理旧监听
  if (_autoPlayHandler) {
    document.removeEventListener("play", _autoPlayHandler, true);
    _autoPlayHandler = null;
  }

  if (GM_config.get("auto_play").toLowerCase() !== "yes") return;

  _autoPlayHandler = (e) => {
    if (!(e.target instanceof HTMLVideoElement)) return;
    if (!matchUrl()) return;
    if (!isVisibleVideo(e.target)) return;

    const mode = GM_config.get("auto_play_mode");
    if (mode === MODE_FIRST_LOAD) {
      if (_autoPlayFiredOnce) return;
      _autoPlayFiredOnce = true;
    } else {
      // MODE_PER_VIDEO
      if (_autoPlayFiredUrl === location.href) return;
      _autoPlayFiredUrl = location.href;
    }
    triggerPlayDebounced("auto");
  };

  document.addEventListener("play", _autoPlayHandler, true);
}

// ── 功能 B：接管播放 ──────────────────────────────────────────────────────────
let _takeoverHandler = null;

function setupTakeover() {
  // 先清理旧监听
  if (_takeoverHandler) {
    document.removeEventListener("play", _takeoverHandler, true);
    _takeoverHandler = null;
  }

  if (GM_config.get("takeover").toLowerCase() !== "yes") return;

  _takeoverHandler = (e) => {
    if (!(e.target instanceof HTMLVideoElement)) return;
    if (!matchUrl()) return;
    if (!isVisibleVideo(e.target)) return;
    triggerPlayDebounced("takeover"); // ★ 修改(c)：传入标识，使用独立 debounce
  };

  document.addEventListener("play", _takeoverHandler, true);
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
      /* 防御性兜底：实际 background-size 由 applyButtonAppearance()
         用 inline style 覆盖为 finalSize + "px"。这里保留 72% 仅在
         applyButtonAppearance 未执行时（如 GM_config 初始化失败）提供回退 */
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
    // ★ 修复：拖拽刚结束时紧随的 click 事件应跳过播放与波纹
    if (_justDragged) return;
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

  // ★ 修复：localizeConfigButtons 已提到顶层，cssText 应用搬到 GM_config 的
  //   open 事件回调（在 center() 之后执行），此处只需调用 GM_config.open()
  buttonSettings.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!GM_config.isOpen) {
      GM_config.open();
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

// ─── SPA 路由监测 ────────────────────────────────────────────────────────────

// ★ 修复：从 500ms 轮询改为 History API hook + popstate 监听
//   原写法最坏要等 500ms 才检测到 URL 变化，新写法在路由变化的同步回调里处理，
//   响应延迟从最多 500ms 降到 0。同时拦截 pushState/replaceState 是行业标准做法
//   （React Router / Vue Router 等都通过这两个 API 切换路由）。
function onRouteChange() {
  updateButton();
  if (GM_config.get("auto_play_mode") === MODE_PER_VIDEO) {
    _autoPlayFiredUrl = null;
  }
}

function detectPJAX() {
  const origPush    = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function (...args) {
    const ret = origPush.apply(this, args);
    onRouteChange();
    return ret;
  };
  history.replaceState = function (...args) {
    const ret = origReplace.apply(this, args);
    onRouteChange();
    return ret;
  };
  window.addEventListener("popstate", onRouteChange);
}

// ─── TrustedHTML 兼容 ────────────────────────────────────────────────────────

// ★ 修复：包 try/catch。W3C TrustedTypes 规范规定：
//   1) 每个 policy name 只能创建一次，重复创建抛 SecurityError
//   2) 若 CSP 的 trusted-types 指令限定了允许列表且不含 "default"，创建失败
//   3) 检查与创建之间存在竞态，其他脚本/扩展可能抢先注册 "default"
//   任一情况发生都静默降级，避免影响后续 GM_config 初始化
if (window.trustedTypes) {
  try {
    if (!trustedTypes.defaultPolicy) {
      const pass = (x) => x;
      trustedTypes.createPolicy("default", {
        createHTML: pass, createScriptURL: pass, createScript: pass,
      });
    }
  } catch (_) {
    // policy 已存在或被 CSP 禁止，静默降级
  }
}

// ─── 启动 ────────────────────────────────────────────────────────────────────

notifyUpdate();
createButton();
detectPJAX();