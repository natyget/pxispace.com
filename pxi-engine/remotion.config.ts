// Render settings shared by Studio and the CLI. See README.md for commands.
import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p'); // what Instagram expects
Config.setCrf(16);
// WebGL needs a GPU-backed context; ANGLE works headless on Linux and macOS.
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(2);
Config.setOverwriteOutput(true);
