import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const disabledResourceType: [string, boolean][] = [
  ["stylesheet", true],
  ["image",true],
  ["media",true],
  ["font",true],
  ["manifest",true],
];
const disabledMap = new Map(disabledResourceType);

const LOCAL_CHROME_EXECUTABLE = process.platform === "win32"
  ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
  : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USER_DATA_DIR = "./node_modules/.remCache";
const isDev = process.env.NODE_ENV === "development";

declare global {
  var _browser: puppeteer.Browser|null;
}

async function setup() {
  const options = {
    args: chrome.args,
    executablePath: isDev ? LOCAL_CHROME_EXECUTABLE : await chrome.executablePath,
    headless: isDev ? false : chrome.headless,
    userDataDir: USER_DATA_DIR
  }
  let browser = global._browser;
  if (!browser) {
    browser = await puppeteer.launch(options);
    browser.on("disconnected", () => {
      global._browser = null;
    });
    global._browser = browser;
  }
  return browser;
}

export async function fetchHTML(url: string, wait?: string) {
  const browser = await setup();
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // @ts-ignore
    if (request._interceptionHandled) return;
    if (disabledMap.has(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  })
  await page.goto(url);
  if (wait) {
    await page.waitForSelector(wait, { visible: true });
  }
  const html = await page.evaluate(() => document.body.innerHTML);
  page.close();
  return html;
}