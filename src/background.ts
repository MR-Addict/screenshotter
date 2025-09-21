import browser from "webextension-polyfill";

import { Message } from "./type";

async function notifyContentScript() {
  try {
    // Get all active tabs
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });

    // Send message to each active tab
    for (const tab of activeTabs) {
      if (tab.id) browser.tabs.sendMessage<Message>(tab.id, { action: "toggle" });
    }
  } catch {}
}

async function handleMessage(message: any): Promise<Message<string> | void> {
  const { action } = message as Message;
  if (action === "screenshot") {
    const data = await browser.tabs.captureVisibleTab();
    return { action: "screenshot", data };
  }
  return Promise.resolve();
}

// Use Promise-based onMessage handler so content can await result
browser.runtime.onMessage.addListener(handleMessage);
browser.action.onClicked.addListener(notifyContentScript);
