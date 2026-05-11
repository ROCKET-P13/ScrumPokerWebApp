import { cubicBezier } from 'animejs';

/** Shared easing for table column FLIP, vote flight, and gather stack motion. */
export const voteCardMotionEase = cubicBezier(0.22, 1, 0.36, 1);

/** Flip card (`FlippableFaceDownVoteCard`) easing — matches prior Framer curve. */
export const tableCardFlipEase = cubicBezier(0.33, 1, 0.36, 1);
