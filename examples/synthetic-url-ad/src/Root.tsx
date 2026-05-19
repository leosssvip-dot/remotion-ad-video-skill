import React from "react";
import { Composition } from "remotion";
import { AdVideo } from "./AdVideo";
import { AdVideoSchema } from "./schema";
import defaultProps from "./default-props.json";

export const Root: React.FC = () => {
  return (
    <Composition
      component={AdVideo}
      defaultProps={defaultProps}
      durationInFrames={450}
      fps={30}
      height={1920}
      id="AdVideo"
      schema={AdVideoSchema}
      width={1080}
    />
  );
};
