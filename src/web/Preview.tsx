import React, { useMemo } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PresetVideo } from "../remotion/PresetVideo";
import { buildInput, type FormatId, type Preset, type Values } from "../types";

export const Preview = React.forwardRef<
  PlayerRef,
  { preset: Preset; values: Values; format: FormatId; controls?: boolean; autoPlay?: boolean; initialFrame?: number; className?: string }
>(({ preset, values, format, controls = true, autoPlay = true, initialFrame, className }, ref) => {
  const input = useMemo(() => buildInput(preset, values, format), [preset, values, format]);
  return (
    <div className={`preview ${values.transparent ? "checker" : ""} ${className ?? ""}`} style={{ aspectRatio: `${input.width} / ${input.height}` }}>
      <Player
        ref={ref}
        component={PresetVideo}
        inputProps={input}
        durationInFrames={input.durationInFrames}
        fps={input.fps}
        compositionWidth={input.width}
        compositionHeight={input.height}
        style={{ width: "100%", height: "100%" }}
        controls={controls}
        autoPlay={autoPlay}
        loop
        initialFrame={initialFrame}
        acknowledgeRemotionLicense
      />
    </div>
  );
});
