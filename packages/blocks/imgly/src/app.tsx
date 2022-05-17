import * as React from "react";

import { BlockComponent } from "blockprotocol/react";
import CreativeEditorSDK, { Configuration } from "@cesdk/cesdk-js";
import { AssetResult } from "@cesdk/cesdk-js/cesdk-engine.umd";
import { BlockProtocolEntity } from "blockprotocol";

type AppProps = {
  config: Configuration;
};

function translateToAssetResult(image: BlockProtocolEntity): AssetResult {
  const artistName = image?.user?.name;
  const artistUrl = image?.user?.links?.html;

  return {
    id: image.id,
    type: "ly.img.image",
    locale: "en",
    //
    label: image.description ?? image.alt_description ?? undefined,
    tags: image.tags ? image.tags.map((tag) => tag.title) : undefined,

    thumbUri: image.urls.thumb,

    size: {
      width: image.width,
      height: image.height,
    },

    meta: {
      uri: image.urls.full,
    },

    context: {
      sourceId: "unsplash",
    },

    credits: artistName
      ? {
          name: artistName,
          url: artistUrl,
        }
      : undefined,

    utm: {
      source: "CE.SDK Demo",
      medium: "referral",
    },
  };
}

const findGraphImages: Configuration["assetSources"][string]["findAssets"] =
  async (type, queryData) => {
    const { query, page, perPage } = queryData;

    return {
      assets: results.map(translateToAssetResult),
      total,
      currentPage: queryData.page,
      nextPage: 1,
    };
  };

const config: Configuration = {
  assetSources: {
    graph: {
      findAssets: findGraphImages,
      credits: {
        name: "Graph images",
      },
    },
  },
  ui: {
    elements: {
      navigation: {
        show: true, // 'false' to hide the navigation completely
        position: "top", // 'top' or 'bottom'
        action: {
          close: false, // true or false
          back: false, // true or false
          load: true, // true or false
          save: true, // true or false
          export: {
            show: true,
            format: ["image/png"],
          },
          download: true, // true  or false
        },
      },
      panels: {
        settings: {
          show: false, // true or false
        },
      },
      dock: {
        iconSize: "large", // 'large' or 'normal'
        hideLabels: false, // false or true
      },
      libraries: {
        template: true, // true or false
        image: true, // true or false
        text: true, // true or false
        element: true, // true or false
        panel: {
          insert: {
            floating: true, // true or false
          },
          replace: {
            floating: true, // true or false
          },
        },
      },
      blocks: {
        opacity: false, // true  or false
        transform: false, // true  or false
        "//ly.img.ubq/image": {
          adjustments: true, // true  or false
          filters: false, // true  or false
          effects: false, // true  or false
          blur: true, // true  or false
          crop: false, // true  or false
        },
      },
    },
  },
};

export const App: BlockComponent<AppProps> = ({ entityId }) => {
  const cesdk_container = React.useRef(null);
  React.useEffect(() => {
    if (cesdk_container.current) {
      CreativeEditorSDK.init(cesdk_container.current, config).then(
        (instance) => {
          /** do something with the instance of CreativeEditor SDK **/
        },
      );
    }
  }, [config, cesdk_container]);

  return <div ref={cesdk_container} style={{ width: "100%" }} />;
};
