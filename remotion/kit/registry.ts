import type {Asset} from "./assetsFigures";
import {FIGURES} from "./assetsFigures";
import {OBJECTS} from "./assetsObjects";
import {WORLD} from "./assetsWorld";

export const KIT_ASSETS: Asset[] = [...FIGURES, ...OBJECTS, ...WORLD];
export type {Asset};
