
interface LoaderDecodeOptions {
  convertFloatPixelDataToInt?: boolean;
  use16BitDataType?: boolean;
}

interface LoaderXhrRequestParams {
  url?: string;
  deferred?: {
    resolve: (value: ArrayBuffer | PromiseLike<ArrayBuffer>) => void;
    reject: (reason?: string | Record<string, string>) => void;
  };
  imageId?: string;
}

interface LoaderXhrRequestError extends Error {
  request: XMLHttpRequest;
  response: string | Record<string, string>;
  status: number;
}

declare module "@cornerstonejs/dicom-image-loader" {
  import * as cornerstone from "@cornerstonejs/core";
  import dicomParser from "dicom-parser";
  import type { WADORSMetaData } from "./WADORSMetaData";

  interface External {
    cornerstone: typeof cornerstone;
    dicomParser: typeof dicomParser;
  }

  interface DICOMImageLoader {
    configure(options: {
      beforeSend?: (
        xhr: XMLHttpRequest,
        imageId: string,
        defaultHeaders: Record<string, string>,
        params: LoaderXhrRequestParams
      ) => Record<string, string> | void;
      decodeConfig?: LoaderDecodeOptions;
      errorInterceptor?: (error: LoaderXhrRequestError) => void;
    }): void;
    external: External;
    wadors: {
      metaDataManager: {
        add: (imageId: string, metadata: WADORSMetaData) => void;
        get: (imageId: string) => WADORSMetaData | undefined;
      };

  };
    wadouri;
  }

  const cornerstoneDICOMImageLoader: DICOMImageLoader;
  export default cornerstoneDICOMImageLoader;
}
