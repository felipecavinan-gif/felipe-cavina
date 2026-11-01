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
};
