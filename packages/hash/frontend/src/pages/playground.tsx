import { useEffect, useState, VoidFunctionComponent } from "react";
import Prism from "prismjs";
import { Validator } from "jsonschema";

import { RemoteBlock } from "../components/RemoteBlock/RemoteBlock";

import styles from "./playground.module.scss";

const validator = new Validator();

/**
 * @todo type all as unknown and check properly
 * we can't rely on people defining the JSON correctly
 */
type BlockMetaJson = {
  source?: string;
  schema?: string;
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  externals?: Record<string, string>;
};

const PassOrFail: VoidFunctionComponent<{ pass: boolean }> = ({ pass }) => (
  <img src={pass ? "/green-check.png" : "/red-cross.png"} />
);

const BlockPlayground = () => {
  const [error, setError] = useState("");
  const [inputData, setInputData] = useState(`{\n  "key": "value"\n}`);
  const [blockProps, setBlockProps] = useState({});
  const [inputErrors, setInputErrors] = useState({
    validJson: false,
    matchesSchema: false,
  });
  const [metadata, setMetadata] = useState<BlockMetaJson>({});
  const [schema, setSchema] =
    useState<Record<string, any> | undefined>(undefined);

  const fetchUrl = (folderUrl: string) => {
    setError("");
    fetch(`${folderUrl}/metadata.json`)
      .then((resp) => resp.json())
      .then((metadata) => {
        metadata.source = `${folderUrl}/${metadata.source}`;
        metadata.schema = `${folderUrl}/${metadata.schema}`;
        setMetadata(metadata);
        fetch(metadata.schema)
          .then((resp) => resp.json())
          .then(setSchema);
      })
      .catch((err) => {
        setError(
          err.message.includes("token < in JSON") ? undefined : err.message
        );
        setMetadata({});
        setSchema(undefined);
      });
  };

  useEffect(() => {
    fetchUrl("http://localhost:5000");
    setTimeout(Prism.highlightAll, 100);
  }, []);

  useEffect(() => Prism.highlightAll(), [inputData, metadata]);

  useEffect(() => {
    try {
      const parsedInput = JSON.parse(inputData);
      const valid =
        schema && !validator.validate(parsedInput, schema).errors.length;
      if (!valid) {
        setInputErrors({
          validJson: true,
          matchesSchema: false,
        });
        return;
      }
      setInputErrors({
        validJson: true,
        matchesSchema: true,
      });
      setBlockProps(parsedInput);
    } catch (err) {
      setInputErrors({
        validJson: false,
        matchesSchema: false,
      });
    }
  }, [inputData]);

  return (
    <div className={styles.PlaygroundWrapper}>
      <div className={`${styles.PlaygroundSection} ${styles.UrlEntry}`}>
        <label>URL to block folder</label>
        <input
          type="text"
          onChange={(e) => fetchUrl(e.target.value)}
          defaultValue="http://localhost:5000"
        />
      </div>

      {/* <div className={`${styles.PlaygroundSection} ${styles.PlaygroundError}`}>
        {error ?? ""}
      </div> */}

      <div className={`${styles.BlockDisplay} ${styles.PlaygroundSection}`}>
        <div className={styles.BlockInterface}>
          <div className={styles.BlockDataInput}>
            <label>Data to send block</label>
            <textarea
              className="language-json"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            />
            <div className={styles.JsonValidation}>
              <div>
                JSON formatted <PassOrFail pass={inputErrors.validJson} />
              </div>
              <div>
                Complies with schema{" "}
                <PassOrFail pass={inputErrors.matchesSchema} />
              </div>
            </div>
          </div>

          <div className="language-json">
            <label>Block interface schema</label>
            <pre>
              <code>{JSON.stringify(schema, undefined, 2)}</code>
            </pre>
          </div>
        </div>

        <div className={styles.RenderedBlock}>
          <label>Rendered block</label>
          <div>
            <RemoteBlock url={metadata?.source ?? ""} {...blockProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockPlayground;
