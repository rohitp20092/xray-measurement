import "./App.css";
import { initCornerstone } from "./utils/helpers";
import { initCornerstoneToolGroup } from "./utils/toolHelper";
import { imageIds } from "./data/iamgeIds";
import { useEffect, useState } from "react";
import * as cornerstone from "@cornerstonejs/core";
import VolumeViewer from "./components/VolumeViewer";
import ToolBar from "./components/ToolBar";

function App() {
  const [isShowViewer, setIsShowViewer] = useState(false);
  useEffect(() => {
    initCornerstone()
      .then(() => {
       initCornerstoneToolGroup();

        cornerstone.imageLoader.loadAndCacheImages(imageIds);
      })
      .then(() => {
      setIsShowViewer(true);
      });

    return () => {
      // Can be done at page level
      cornerstone.cache.purgeCache();
      cornerstone.cache.purgeVolumeCache();
    };
  }, []);

  return (
    <>
      <div>
        <h1 className="text-xl text-center m-4">.</h1>
        <div className="flex gap-4 justify-center items-center">
          {isShowViewer ? <VolumeViewer imageIds={imageIds} /> : null}
        </div>
        <ToolBar
          setIsShowViewer={setIsShowViewer}
          isShowViewer={isShowViewer}
        />
      </div>
    </>
  );
}

export default App;
