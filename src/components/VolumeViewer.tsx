
import { Ref, useCallback, useEffect, useRef, useState } from "react";
import {
  viewportIds,
  volumeId,
  renderingEngineId,
} from "../data/cornerstoneIds";
import * as cornerstone from "@cornerstonejs/core";
import {
  IVolumeViewport,
  Point2,
  PublicViewportInput,
} from "@cornerstonejs/core/dist/types/types";
import { StreamingImageVolume } from "@cornerstonejs/streaming-image-volume-loader";
import { CrosshairsTool, utilities } from "@cornerstonejs/tools";
import { deleteCurrentMeasurement, toggleTool } from "../utils/toolHelper";
import { handleCsResize } from "../utils/helpers";

const { volumeLoader, getRenderingEngine, setVolumesForViewports, Enums } =
  cornerstone;
const { OrientationAxis, ViewportType } = Enums;

const defaultDisplayRatio = 1;
const defaultViewportTransform = {
  pan: [0, 0],
  zoom: 1.1,
  rotation: 0,
} as ViewportTransform;

type Props = { imageIds: string[] };

type ViewportTransform = {
  pan?: Point2;
  zoom?: number;
  rotation?: number;
};

export default function VolumeViewer({ imageIds }: Props) {
  const initialAxialSlice = Math.floor(imageIds.length / 2);

  const axialRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);
  const segittalRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<StreamingImageVolume>();

  const [isVolumeLoaded, setIsVolumeLoaded] = useState(false);
  const [axialSlice, setAxialSlice] = useState(initialAxialSlice - 1);
  const [coronalSlice, setCoronalSlice] = useState(255);
  const [segittalSlice, setSegittalSlice] = useState(255);
  const [axialTransform, setAxialTransform] = useState(
    defaultViewportTransform
  );
  const [coronalTransform, setCoronalTransform] = useState(
    defaultViewportTransform
  );
  const [segittalTransform, setSegittalTransform] = useState(
    defaultViewportTransform
  );
  const [axialSlabThickness, setAxialSlabThickness] = useState<number>();
  const [coronalSlabThickness, setCoronalSlabThickness] = useState<number>();
  const [segittalSlabThickness, setSegittalSlabThickness] = useState<number>();

  const handleSliceChange = useCallback((viewportId: string) => {
    const renderingEngine = getRenderingEngine(renderingEngineId);
    const viewport = renderingEngine?.getViewport(
      viewportId
    ) as IVolumeViewport;
    const index = viewport?.getSliceIndex();
    if (index === undefined) return;
    // const total = viewport?.getNumberOfSlices();
    if (viewportId === viewportIds[0]) {
      setAxialSlice(index);
    }
    if (viewportId === viewportIds[1]) {
      setCoronalSlice(index);
    }
    if (viewportId === viewportIds[2]) {
      setSegittalSlice(index);
    }
  }, []);

  const handleCameraChange = useCallback((viewportId: string) => {
    const renderingEngine = getRenderingEngine(renderingEngineId);
    const viewport = renderingEngine?.getViewport(
      viewportId
    ) as IVolumeViewport;

    const { pan, zoom, rotation } = viewport.getViewPresentation();

    // CAMERA_MODIFIED event is also triggered when slab thickness changes, which can sync with React state
    const slabThickness = viewport.getSlabThickness();

    if (viewportId === viewportIds[0]) {
      setAxialTransform({ pan, zoom, rotation });
      setAxialSlabThickness(slabThickness);
    }
    if (viewportId === viewportIds[1]) {
      setCoronalTransform({ pan, zoom, rotation });
      setCoronalSlabThickness(slabThickness);
    }
    if (viewportId === viewportIds[2]) {
      setSegittalTransform({ pan, zoom, rotation });
      setSegittalSlabThickness(slabThickness);
    }
  }, []);

  const handleScrollSlice = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, viewportId: string) => {
      const renderingEngine = getRenderingEngine(renderingEngineId);
      const element = renderingEngine?.getViewport(viewportId).element;
      if (!element) return;
      utilities.jumpToSlice(element, { imageIndex: +e.target.value });
    },
    []
  );

  useEffect(() => {
    window.addEventListener("resize", handleCsResize);

    return () => {
      window.removeEventListener("resize", handleCsResize);
    };
  }, []);

  useEffect(() => {
    const axial = axialRef.current;
    const coronal = coronalRef.current;
    const segittal = segittalRef.current;
    const viewportArray = [
      {
        viewportId: viewportIds[0],
        type: ViewportType.ORTHOGRAPHIC,
        element: axial,
        defaultOptions: {
          orientation: OrientationAxis.ACQUISITION,
          displayArea: {
            imageArea: [defaultDisplayRatio, defaultDisplayRatio],
          },
        },
      },
      {
        viewportId: viewportIds[1],
        type: ViewportType.ORTHOGRAPHIC,
        element: coronal,
        defaultOptions: {
          orientation: OrientationAxis.CORONAL,
          displayArea: {
            imageArea: [defaultDisplayRatio, defaultDisplayRatio],
          },
        },
      },
      {
        viewportId: viewportIds[2],
        type: ViewportType.ORTHOGRAPHIC,
        element: segittal,
        defaultOptions: {
          orientation: OrientationAxis.SAGITTAL,
          displayArea: {
            imageArea: [defaultDisplayRatio, defaultDisplayRatio],
          },
        },
      },
    ] as PublicViewportInput[];

    async function initVolume() {
      volumeRef.current = (await volumeLoader.createAndCacheVolume(volumeId, {
        imageIds,
      })) as StreamingImageVolume;
    }
    const renderingEngine = getRenderingEngine(renderingEngineId);

    async function initRender() {
      await initVolume();
      if (!renderingEngine) return;

      renderingEngine.setViewports(viewportArray);
      volumeRef.current?.load(() => {
        setIsVolumeLoaded(true);
      });

      await setVolumesForViewports(
        renderingEngine,
        [{ volumeId }],
        viewportIds
      );
      renderingEngine.renderViewports(viewportIds);
    }

    initRender()
      .then(() => {
        // custom VOI settings
        for (let i = 0; i < viewportIds.length; i++) {
          const viewport = renderingEngine?.getViewport(
            viewportIds[i]
          ) as cornerstone.Types.IVolumeViewport;
          viewport.setProperties({ voiRange: { lower: -300, upper: 1400 } });
        }
      })
      .then(() => {
        // abstract to hook and use viewportIds + viewport.element instead
        axial?.addEventListener(
          cornerstone.Enums.Events.VOLUME_NEW_IMAGE,
          () => {
            handleSliceChange(viewportIds[0]);
          }
        );

        coronal?.addEventListener(
          cornerstone.Enums.Events.VOLUME_NEW_IMAGE,
          () => {
            handleSliceChange(viewportIds[1]);
          }
        );
        segittal?.addEventListener(
          cornerstone.Enums.Events.VOLUME_NEW_IMAGE,
          () => {
            handleSliceChange(viewportIds[2]);
          }
        );
        axial?.addEventListener(
          cornerstone.Enums.Events.CAMERA_MODIFIED,
          () => {
            handleCameraChange(viewportIds[0]);
          }
        );
        coronal?.addEventListener(
          cornerstone.Enums.Events.CAMERA_MODIFIED,
          () => {
            handleCameraChange(viewportIds[1]);
          }
        );
        segittal?.addEventListener(
          cornerstone.Enums.Events.CAMERA_MODIFIED,
          () => {
            handleCameraChange(viewportIds[2]);
          }
        );
      })
      .then(() => {
        toggleTool(CrosshairsTool.toolName);
      });

    return () => {
      axial?.removeEventListener(
        cornerstone.Enums.Events.VOLUME_NEW_IMAGE,
        () => {
          handleSliceChange(viewportIds[0]);
        }
      );
      coronal?.removeEventListener(
        cornerstone.Enums.Events.VOLUME_NEW_IMAGE,
        () => {
          handleSliceChange(viewportIds[1]);
        }
      );
      segittal?.removeEventListener(
        cornerstone.Enums.Events.VOLUME_NEW_IMAGE,
        () => {
          handleSliceChange(viewportIds[2]);
        }
      );
      axial?.removeEventListener(
        cornerstone.Enums.Events.CAMERA_MODIFIED,
        () => {
          handleCameraChange(viewportIds[0]);
        }
      );
      coronal?.removeEventListener(
        cornerstone.Enums.Events.CAMERA_MODIFIED,
        () => {
          handleCameraChange(viewportIds[1]);
        }
      );
      segittal?.removeEventListener(
        cornerstone.Enums.Events.CAMERA_MODIFIED,
        () => {
          handleCameraChange(viewportIds[2]);
        }
      );
    };
  }, [imageIds, handleSliceChange, handleCameraChange]);

  const handleTransform = useCallback((operation: string) => {
    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return;

    viewportIds.forEach((viewportId) => {
      const viewport = renderingEngine.getViewport(viewportId) as IVolumeViewport;
      if (!viewport) return;

      let { pan, zoom, rotation } = viewport.getViewPresentation();
      if (operation === "rotate90") {

        rotation = (rotation + 90) % 360;
      }

      // Set the transformed presentation
      viewport.setViewPresentation({ pan, zoom, rotation });
      viewport.render();
    });
  }, []);

  return (
    <>
      {!isVolumeLoaded && (
        <p className="absolute text-green-500 z-50">Loading volume...</p>
      )}

      <div className="absolute top-0 left-0 right-0 p-2 flex justify-center space-x-2 mb-4 z-10">
        <button onClick={() => handleTransform("rotate90")} className="p-2 bg-gray-800 text-white rounded">Rotate 90°</button>
      </div>
      <ViewerContainer>
        <ViewerLabels>
          {axialSlice + 1} / {imageIds.length}
        </ViewerLabels>
        <ViewerElement viewportRef={axialRef}></ViewerElement>
        <ViewerScrollBar
          totalSlice={imageIds.length}
          slice={axialSlice}
          handleScrollSlice={handleScrollSlice}
          viewportId={viewportIds[0]}
        />
        <ViewerTransformInfo
          transform={axialTransform}
          slabThickness={axialSlabThickness}
        />
      </ViewerContainer>
      <ViewerContainer>
        <ViewerLabels>{coronalSlice + 1} / 512</ViewerLabels>
        <ViewerElement viewportRef={coronalRef}></ViewerElement>
        <ViewerScrollBar
          totalSlice={512}
          slice={coronalSlice}
          handleScrollSlice={handleScrollSlice}
          viewportId={viewportIds[1]}
        />
        <ViewerTransformInfo
          transform={coronalTransform}
          slabThickness={coronalSlabThickness}
        />
      </ViewerContainer>
      <ViewerContainer>
        <ViewerLabels>{segittalSlice + 1} / 512</ViewerLabels>
        <ViewerElement viewportRef={segittalRef}></ViewerElement>
        <ViewerScrollBar
          totalSlice={512}
          slice={segittalSlice}
          handleScrollSlice={handleScrollSlice}
          viewportId={viewportIds[2]}
        />
        <ViewerTransformInfo
          transform={segittalTransform}
          slabThickness={segittalSlabThickness}
        />
      </ViewerContainer>
    </>
  );
}

function ViewerContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-1/4 aspect-square bg-black rounded-lg hover:outline-5 hover:outline hover:outline-green-500 relative flex overflow-hidden">
      {children}
    </div>
  );
}

function ViewerElement({
  children,
  viewportRef,
}: {
  children?: React.ReactNode;
  viewportRef: Ref<HTMLDivElement>;
}) {
  {
    return (
      <div
        ref={viewportRef}
        className="w-full aspect-square"
        onContextMenu={(e) => {
          e.preventDefault();
          deleteCurrentMeasurement();
        }}
      >
        {children}
      </div>
    );
  }
}

function ViewerScrollBar({
  totalSlice,
  slice,
  handleScrollSlice,
  viewportId,
}: {
  totalSlice: number;
  slice: number;
  handleScrollSlice: (
    e: React.ChangeEvent<HTMLInputElement>,
    viewportId: string
  ) => void;
  viewportId: string;
}) {
  return (
    <input
      min={0}
      max={totalSlice - 1}
      type="range"
      value={slice}
      onChange={(e) => {
        handleScrollSlice(e, viewportId);
      }}
      className="opacity-60 hover:opacity-100 slider w-full h-2 bg-transparent left-full pt-2 px-1 [&::-webkit-slider-thumb]:rounded [&::-moz-range-thumb]:border-none  [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb:hover]:bg-green-400 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb:hover]:bg-green-400"
    ></input>
  );
}

function ViewerLabels({ children }: { children: React.ReactNode }) {
  return (
    <div className=" absolute text-green-500 z-10 ml-2 mt-2 text-xs">
      {children}
    </div>
  );
}

// these exposed viewport presentation properties can be utilized by other features
// you can use getViewportPresentation() to get viewport presentation properties
function ViewerTransformInfo({
  transform,
  slabThickness,
}: {
  transform: ViewportTransform;
  slabThickness: number | undefined;
}) {
  const { pan, zoom, rotation } = transform;
  const panText = pan ? `(${pan[0].toFixed(2)}, ${pan[1].toFixed(2)})` : "--";
  const zoomText = `${zoom?.toFixed(2)}` || "--";
  const rotationText = `${rotation?.toFixed(2)}` || "--";

  return (
    <div className=" absolute bottom-0 text-green-500 z-10 ml-2 mb-2 text-xs">
      <p>
        P: {panText} / Z: {zoomText} / R: {rotationText} / S:{" "}
        {slabThickness?.toFixed(2) || "--"}
      </p>
    </div>
  );
}
