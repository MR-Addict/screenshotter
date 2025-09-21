import browser from "webextension-polyfill";

let isActive = false;

function updateIcon() {
  browser.action.setBadgeText({ text: isActive ? "●" : "" });
  browser.action.setBadgeBackgroundColor({ color: isActive ? "#06f" : "#666" });
  browser.action.setTitle({ title: `Screenshotter(${isActive ? "Active" : "Inactive"})` });
}

browser.action.onClicked.addListener(async () => {
  isActive = !isActive;
  updateIcon();
});
