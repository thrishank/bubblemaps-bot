import { Builder, By, until, WebElement } from "selenium-webdriver";
import * as fs from "fs";
import { Options } from "selenium-webdriver/chrome";
import * as path from "path";

export async function screenshot(network: string, address: string) {
  // Set Chrome options
  const chromeOptions = new Options();
  chromeOptions.addArguments("--headless"); // Run in headless mode
  chromeOptions.addArguments("--no-sandbox"); // Needed for running in a container
  chromeOptions.addArguments("--disable-dev-shm-usage"); // Prevent shared memory issues
  chromeOptions.addArguments("--disable-gpu"); // Disable GPU acceleration
  chromeOptions.addArguments("--remote-debugging-port=9222"); // Needed for remote execution

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(chromeOptions)
    .build();

  try {
    await driver.get(`https://app.bubblemaps.io/${network}/token/${address}`);

    await driver.sleep(5000);
    await driver.wait(until.elementLocated(By.id("svg")), 10000);

    const svgElement: WebElement = await driver.findElement(By.id("svg"));

    const imgDir = path.resolve("img");
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }

    const screenshotPath = path.join(imgDir, `${address}.png`);
    const elementScreenshot = await svgElement.takeScreenshot();
    fs.writeFileSync(screenshotPath, elementScreenshot, "base64");

    console.log(`✅ Screenshot saved at: ${screenshotPath}`);
  } catch (err) {
    console.error("❌ Error taking screenshot:", err);
  } finally {
    await driver.quit();
  }
}

