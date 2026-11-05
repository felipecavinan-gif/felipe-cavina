import type React from "react";
import type { StyleProps } from "./common";
import { KineticWords } from "./KineticWords";
import { LowerThird } from "./LowerThird";
import { CinematicTitle } from "./CinematicTitle";
import { Counter } from "./Counter";
import { Typewriter } from "./Typewriter";
import { BulletList } from "./BulletList";
import { Quote } from "./Quote";
import { SubscribeCTA } from "./SubscribeCTA";
import { BlockReveal } from "./BlockReveal";
import { Highlight } from "./Highlight";
import { SocialHandle } from "./SocialHandle";

import { Camera3D } from "./Camera3D";
import { Flip3DWords } from "./Flip3DWords";
import { DepthTunnel } from "./DepthTunnel";
import { Orbit3D } from "./Orbit3D";
import { RetroFloor } from "./RetroFloor";
import { SlamImpact } from "./SlamImpact";
import { Glitch } from "./Glitch";
import { WhipSpeed } from "./WhipSpeed";
import { StrobeCut } from "./StrobeCut";
import { CineReveal } from "./CineReveal";
import { Trailer } from "./Trailer";
import { BackgroundScene } from "./BackgroundScene";
import { ProductFlick } from "./ProductFlick";
import { GlassCard3D } from "./GlassCard3D";
import { ProductSpin3D } from "./ProductSpin3D";
import { ProductImpact } from "./ProductImpact";
import { GlassShatter } from "./GlassShatter";
import { ImpactFrame } from "./ImpactFrame";
import { TextFlick3D } from "./TextFlick3D";
import { Camera3Points } from "./Camera3Points";
import { OutlineFlick } from "./OutlineFlick";
import { Lettering } from "./Lettering";

/** Registro de estilos. Um preset JSON aponta para uma destas chaves no campo "style". */
export const STYLES: Record<string, React.FC<StyleProps>> = {
  "kinetic-words": KineticWords,
  "lower-third": LowerThird,
  "cinematic-title": CinematicTitle,
  counter: Counter,
  typewriter: Typewriter,
  "bullet-list": BulletList,
  quote: Quote,
  "subscribe-cta": SubscribeCTA,
  "block-reveal": BlockReveal,
  highlight: Highlight,
  "social-handle": SocialHandle,
  "camera-3d": Camera3D,
  "flip-3d-words": Flip3DWords,
  "depth-tunnel": DepthTunnel,
  "orbit-3d": Orbit3D,
  "retro-floor": RetroFloor,
  "slam-impact": SlamImpact,
  glitch: Glitch,
  "whip-speed": WhipSpeed,
  "strobe-cut": StrobeCut,
  "cine-reveal": CineReveal,
  trailer: Trailer,
  "background-scene": BackgroundScene,
  "product-flick": ProductFlick,
  "glass-card-3d": GlassCard3D,
  "product-spin-3d": ProductSpin3D,
  "product-impact": ProductImpact,
  "glass-shatter": GlassShatter,
  "impact-frame": ImpactFrame,
  "text-flick-3d": TextFlick3D,
  "camera-3-points": Camera3Points,
  "outline-flick": OutlineFlick,
  lettering: Lettering,
};
