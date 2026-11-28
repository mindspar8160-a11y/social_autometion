import React from "react";
import {Composition, CalculateMetadataFunction} from "remotion";
import {VoxEditorial, totalFramesVoxEditorial, VoxEditorialProps} from "./vox/VoxEditorial";

const FPS = 30;

const voxEditorialCalc: CalculateMetadataFunction<VoxEditorialProps> = ({props}) => ({
  durationInFrames: totalFramesVoxEditorial(props.scenes || [], FPS),
  width: 1080,
  height: 1920,
  fps: FPS,
});

export const Root: React.FC = () => (
  <>
    <Composition
      id="VoxEditorial"
      component={VoxEditorial}
      durationInFrames={300}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        topicTitle: "MindSpark Editorial",
        scenes: [],
      }}
      calculateMetadata={voxEditorialCalc}
    />
  </>
);
