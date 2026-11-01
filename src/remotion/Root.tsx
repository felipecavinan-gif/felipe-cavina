import React from "react";
import { Composition } from "remotion";
import { PresetVideo } from "./PresetVideo";
import type { RenderInput } from "../types";

const fallback: RenderInput = { style: "kinetic-words", values: {}, fps: 30, durationInFrames: 90, width: 1920, height: 1080 };

export const Root: React.FC = () => (
  <Composition
    id="Preset"
    component={PresetVideo}
    defaultProps={fallback}
    durationInFrames={90}
    fps={30}
    width={1920}
    height={1080}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationInFrames,
      fps: props.fps,
      width: props.width,
      height: props.height,
    })}
  />
);
