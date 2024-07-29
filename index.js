const axios = require("axios");
const qs = require("qs");
const Tesseract = require("tesseract.js");
const Jimp = require("jimp");
const cheerio = require("cherio/lib/cheerio");
const fs=require("fs");
const { delay } = require("@antiadmin/anticaptchaofficial");

// Path to the original CAPTCHA image
// const imagePath = "https://cmat.ntaonline.in/frontend/web/registration/captcha?v=6676a455d85372.78970665";

// Preprocess the image (convert to grayscale and increase contrast)
function solveImageCaptcha(imagePath) {
  Jimp.read(imagePath)
    .then((image) => {
      return image
        .greyscale() // Convert to grayscale
        .contrast(1) // Increase contrast
        .writeAsync("preprocessed_captcha.png"); // Save the preprocessed image
    })
    .then(() => {
      // Recognize text from the preprocessed image
      Tesseract.recognize("preprocessed_captcha.png", "eng", {
        logger: (m) => console.log(m),
      })
        .then(({ data: { text } }) => {
          console.log("Recognized Text:", text);
          return text;
        })
        .catch((err) => {
          console.error("Error during recognition:", err);
        });
    })
    .catch((err) => {
      console.error("Error during preprocessing:", err);
    });
}

async function getImageUrl() {
  try {
    const response = await axios.get("https://cmat.ntaonline.in/frontend/web/scorecard/index");
    const $ = cheerio.load(response.data);
    const imageUrl = $("img#captchaImage").attr("src");
    return `https://cmat.ntaonline.in${imageUrl}`;
  } catch (error) {
    console.error("Error fetching CAPTCHA image URL:", error);
    throw error;
  }
}

function parseHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);

  const applicationNumber = $('td:contains("Application No.")')
    .next("td")
    .text()
    .trim();

  const candidateName = $('td:contains("Candidate\'s Name")')
    .next("td")
    .text()
    .trim();

  const total = $('td:contains("Total")').next("td").text().trim() || "N/A";

  if (total === "N/A") {
    return null;
  }

  return { applicationNumber, candidateName, total };
}

async function solve(applicationNumber) {
  try {
    const imageUrl = await getImageUrl();
    const captchaText = await solveImageCaptcha(imageUrl);
    
    let data = qs.stringify({
      "_csrf-frontend":
        "KQqgyZ0OWtoZ-9vzCwssazr3ZeymZHwz5ybpUrZZuKhmZ-75zDhroHKLnppifFUab7QvmuAJEHG_adgggBWI9w==",
      "Scorecardmodel[ApplicationNumber]": applicationNumber,
      "Scorecardmodel[Day]": "30",
      "Scorecardmodel[Month]": "06",
      "Scorecardmodel[Year]": "2004",
      "Scorecardmodel[verifyCode]": captchaText,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://cmat.ntaonline.in/frontend/web/scorecard/index",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        Connection: "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie:
          "advanced-frontend=maum6ifqh2almub3s9ksl6jm76; _csrf-frontend=d16fc7192f8c73c98183cd9b320098cec8a23702f0ce74773a65b66361b03886a%3A2%3A%7Bi%3A0%3Bs%3A14%3A%22_csrf-frontend%22%3Bi%3A1%3Bs%3A32%3A%22OmN0Q61zkpEiiwyqUCJvFmlBXO1r6L0_%22%3B%7D",
        Origin: "null",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "sec-ch-ua":
          '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
      data: data,
    };

    const response = await axios.request(config);
    const parseData = parseHtml(response.data);
    console.log(parseData);
    if (parseData !== null){
      fs.appendFile('Output.txt', JSON.stringify(parseData), (err) => {
        if (err) throw err;
    })
    
    }
  } catch (error) {
    console.error("Error in solve function:", error);
  }
}

const callFunction=async()=>{
  for (let i=240210040000 ; i<=240210045000 ; i++){
    solve(i.toString());
    console.log(i)
    let delayres = await delay(1500);
  }
}

callFunction()

