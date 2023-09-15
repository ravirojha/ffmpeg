import express from 'express'
import cors from 'cors'
import multer from 'multer'
import {createFFmpeg} from '@ffmpeg/ffmpeg'
import PQueue from 'p-queue';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';


const ffmpegInstance = createFFmpeg({log: true})
let ffmpegLoadingPromise = ffmpegInstance.load()

const requestQueue = new PQueue({ concurrency: 1 });

async function getFFmpeg() {
    if(ffmpegLoadingPromise) {
        await ffmpegLoadingPromise;
        ffmpegLoadingPromise = undefined
    }

    return ffmpegInstance
}


const app = express();
const port = 3000;


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 100 * 1024 * 1024}
})

app.use(cors());

app.post('/split', upload.single('video'), async (req, res) => {
    try {
        const videoData = req.file.buffer;
        const inputFileName = `input-video.mp4`;
        const outputFileName = `output.m3u8`;

        const ffmpeg = await getFFmpeg();
        ffmpeg.FS('writeFile', inputFileName, videoData);

        const uuid = uuidv4();
        const outputDir = `temp/${uuid}`;
        // Create the temp directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await requestQueue.add(async () => {
            await ffmpeg.run(
                '-i', inputFileName,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-f', 'hls',
                '-hls_time', '2',
                '-hls_list_size', '0',
                '-hls_segment_filename', `${outputDir}/segment%03d.ts`,
                outputFileName
            );
        });



        const m3u8Data = ffmpeg.FS('readFile', outputFileName);
        const tsFiles = fs.readdirSync(outputDir);
        const tsData = tsFiles.map((file) => {
            return {
                name: file,
                data: fs.readFileSync(`${outputDir}/${file}`),
            };
        });

        // Clean up temporary files and directories
        // fs.unlinkSync(inputFileName);
        fs.rmdirSync(outputDir, { recursive: true });
        // fs.unlinkSync(outputFileName);

        res.writeHead(200, {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': m3u8Data.length,
        });
        res.write(m3u8Data);

        // Write .ts segments to the response
        for (const ts of tsData) {
            res.write(`\n#EXTINF:2.000,`);
            res.write(`\n${ts.name}`);
            res.write(`\n`);
            res.write(ts.data);
        }

        res.end();
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});


app.listen(port, () => {
    console.log(`[info] ffmpeg-api listening at http://localhost:${port}`)
})