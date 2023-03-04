import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
let browser: puppeteer.Browser|null = null;

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

async function setup() {
  const options = {
    args: chrome.args,
    executablePath: isDev ? LOCAL_CHROME_EXECUTABLE : await chrome.executablePath,
    headless: isDev ? false : chrome.headless,
    userDataDir: USER_DATA_DIR
  }
  if (!browser) {
    browser = await puppeteer.launch(options);
    browser.on("disconnected", () => {
      browser = null;
    });
  }
  return browser;
}

setup();

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
  console.error(url);
  await page.goto(url);
  if (wait) {
    await page.waitForSelector(wait, { visible: true });
  }
  const html = await page.evaluate(() => document.body.innerHTML);
  page.close();
  return html;
}