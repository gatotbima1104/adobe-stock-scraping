import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

puppeteer.use(StealthPlugin());

(async () => {
  try {
    // proving puppeteer working in the background
    const browser = await puppeteer.launch({
      headless: "new", // run headless or not
      args: ["--no-sandbox", "--enable-blink-features=HTMLImports"],
      channel: "chrome",
    });

    const page = await browser.newPage();
    const urls = JSON.parse(fs.readFileSync("./result_link.json", "utf-8"));
    // let linkImages = [];
    let results = [];
    let number = 1;
    // GET SUBMAIN LINKS
    for (const url of urls) {
      console.log(`scraping link ${number}`);

      try {
        await page.goto(url, { timeout: 20000 });
        // const firstLink = await page.evaluate(() => {
        //   const allLinks = Array.from(
        //     document.querySelectorAll(
        //       "a[href*='https://stock.adobe.com/uk/images/']"
        //     )
        //   );
        //   return allLinks.length > 0 ? allLinks[0].href : null;
        // });

        // if (firstLink) {
        // linkImages.push(firstLink);
        // await page.goto(firstLink, { timeout: 20000 });
        const viewAllSelector = "div.details-keywords-list-original > a";
        try {
          await page.waitForSelector(viewAllSelector);
          const viewBtn = await page.$(viewAllSelector);

          if (viewBtn) {
            await page.click(viewAllSelector);
          }
        } catch (error) {
          console.log("no View All button");
        }

        // Proceed to scrape the data
        const pageData = await page.evaluate(() => {
          const url = window.location.href;
          const image = document.querySelector("img#details-enlarged-image");
          const title = document.querySelector(
            'h1[data-t="detail-panel-content-title"]'
          );
          const keywords = Array.from(
            document.querySelectorAll(
              "span.js-keywords-item.left.margin-right-small.margin-bottom-small"
            )
          ).map((el) => el.textContent.trim());

          const category = document.querySelector(
            'a[data-ingest-clicktype="details-panel-category"] > span'
          );

          return {
            url,
            image: image ? image.src : "",
            title: title ? title.textContent.trim().replace(/\n/g, " ") : "",
            keywords: keywords.join(", "),
            category: category
              ? category.textContent.trim().replace(/\n/g, " ")
              : "",
          };
        });

        results.push(pageData);
        // console.log(pageData)
        // }
      } catch (error) {
        console.error(`Error scraping link ${number}:`, error);
      }
      number++;
    }

    // const data = JSON.stringify(linkImages, null, 2);
    // fs.writeFileSync("updated_link.json", data);

    const resultData = JSON.stringify(results, null, 2);
    fs.writeFileSync("updated_data.json", resultData);

    await browser.close();
  } catch (error) {
    console.error("Error:", error);
  }
})();
