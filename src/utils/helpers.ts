import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import dicomPaser from "dicom-parser";
import { cornerstoneStreamingImageVolumeLoader } from "@cornerstonejs/streaming-image-volume-loader";
import { renderingEngineId } from "../data/cornerstoneIds";
import { IVolumeViewport } from "@cornerstonejs/core/dist/types/types";

const { RenderingEngine, volumeLoader, Enums } = cornerstone;
const { registerVolumeLoader } = volumeLoader;

export async function initCornerstone() {
  await cornerstone.init();
  cornerstoneTools.init();

  cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
  cornerstoneDICOMImageLoader.external.dicomParser = dicomPaser;

  registerVolumeLoader(
    "cornerstoneStreamingImageVolume",
    cornerstoneStreamingImageVolumeLoader as unknown as cornerstone.Types.VolumeLoaderFn
  );

  new RenderingEngine(renderingEngineId);
}

function getCsViewports() {
  const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
  const viewports = renderingEngine?.getViewports() as
    | IVolumeViewport[]
    | undefined;
  return viewports;
}

export function handleCsResize() {
  const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
  const viewports = getCsViewports();
  if (!viewports) return;
  const presentations = viewports.map((viewport) => {
    return viewport.getViewPresentation();
  });
  renderingEngine?.resize(true, true);
  viewports.forEach((viewport, idx) => {
    viewport.setViewPresentation(presentations[idx]);
  });
}

export function handleCsResetCamera() {
  const viewports = getCsViewports();
  if (!viewports) return;
  viewports.forEach((viewport) => {
    viewport.resetCamera();
  });
}

export function handleCsSetSlabThickness(thickness: number) {
  const viewports = getCsViewports();
  if (!viewports) return;
  viewports.forEach((viewport) => {
    viewport.setProperties({ slabThickness: thickness });
    viewport.setBlendMode(Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
  });
  const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);

  renderingEngine?.render();
}
