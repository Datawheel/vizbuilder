import { Client, Cube, TesseractDataSource } from "@datawheel/olap-client";
import { useEffect, useState } from "react";

const ds = new TesseractDataSource("https://api.datasaudi.datawheel.us/tesseract/");
export const client = new Client(ds);

export function useOlapSchema() {
  const [schema, setSchema] = useState<{[k: string]: Cube}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    client.getCubes().then(cubes => {
      const schema = Object.fromEntries(
        cubes.map(cube => [cube.name, cube])
      );
      setIsLoading(false);
      setSchema(schema);
    }, err => {
      setIsLoading(false);
      setError(err.message);
    });
  }, []);

  return [schema, isLoading, error] as const;
}
