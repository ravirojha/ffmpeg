import express from "express";
import cors from "cors";
import ffmpeg from "fluent-ffmpeg";
import multer from "multer";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import tmp from "tmp-promise";
import { calculateVMAF, readVMAFScores } from "./utils.js";
const app = express();
const port = 3000;

app.use(cors());

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define a function to calculate video resolution
async function getVideoResolution(fileBuffer) {
  const response = new Promise((resolve, reject) => {
    ffmpeg.ffprobe("./input-video.mp4", (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const resolution = `${metadata.streams[0].width}x${metadata.streams[0].height}`;
        resolve(resolution);
      }
    });
  });
  return response;
}

app.post("/vmaf", async (req, res) => {
  try {
    const filePaths = [
      "output_1280x720_18.mp4",
      "output_1280x720_24.mp4",
      "output_1920x1080_18.mp4",
      "output_1920x1080_24.mp4",
    ];
    console.log({ filePaths });
    for (let file of filePaths) {
      const referenceVideo = "./input-video.mp4";
      const encodedVideo = `./${file}`;
      await calculateVMAF(referenceVideo, encodedVideo);
      const vmafScores = await readVMAFScores();
      console.log({ vmafScores });
    }
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
