import browser from "webextension-polyfill";

import { Message } from "./type";
import { ScreenshotTool } from "./lib/ScreenshotTool";

async function handleTakeScreenshot() {
  const message: Message = { action: "screenshot" };
  const response = await browser.runtime.sendMessage<Message, Message<string>>(message);
  return response?.data ?? null;
}

function handleMessage(message: any) {
  const { action } = message as Message;
  if (action === "toggle") screenshotTool.active = !screenshotTool.active;
}

const screenshotTool = new ScreenshotTool({ screenshotHandler: handleTakeScreenshot });

// Listen for messages from background script
browser.runtime.onMessage.addListener(handleMessage);
