import { Builder, By, until, WebElement } from "selenium-webdriver";
import * as fs from "fs";

export async function screenshot(network: string, address: string) {
  const driver = await new Builder().forBrowser("chrome").build();
  try {
    await driver.get(`https://app.bubblemaps.io/${network}/token/${address}`);

    await driver.sleep(5000);
    await driver.wait(until.elementLocated(By.id("svg")), 10000);

    const svgElement: WebElement = await driver.findElement(By.id("svg"));

    const elementScreenshot = await svgElement.takeScreenshot();
    fs.writeFileSync(`img/${address}.png`, elementScreenshot, "base64");

    console.log("✅ Screenshot of #svg saved!");
  } catch (err) {
    console.error("❌ Error taking screenshot:", err);
    await driver.quit();
  } finally {
    await driver.quit();
  }
}
