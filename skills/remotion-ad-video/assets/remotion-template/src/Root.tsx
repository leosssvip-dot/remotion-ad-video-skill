import { Composition, type CalculateMetadataFunction } from "remotion";
import { AdVideo } from "./AdVideo";
import defaultProps from "./default-props.json";
import { type AdVideoProps, AdVideoSchema } from "./schema";

const fps = 30;

const sizes: Record<AdVideoProps["platform"], { width: number; height: number }> = {
  "vertical-9x16": { width: 1080, height: 1920 },
  "square-1x1": { width: 1080, height: 1080 },
  "landscape-16x9": { width: 1920, height: 1080 },
  "instagram-reel": { width: 1080, height: 1920 },
  "meta-square": { width: 1080, height: 1080 },
  tiktok: { width: 1080, height: 1920 },
  "youtube-landscape": { width: 1920, height: 1080 },
  "youtube-shorts": { width: 1080, height: 1920 }
};

const calculateMetadata: CalculateMetadataFunction<AdVideoProps> = ({ props }) => {
  const size = sizes[props.platform];

  return {
    durationInFrames: Math.max(1, Math.round(props.durationSeconds * fps)),
    fps,
    height: size.height,
    width: size.width
  };
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="AdVideo"
      component={AdVideo}
      durationInFrames={900}
      fps={fps}
      height={1920}
      width={1080}
      schema={AdVideoSchema}
      defaultProps={defaultProps as AdVideoProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
