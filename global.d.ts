import * as OlapClnt from "@datawheel/olap-client";
import * as UseTranslation from "@datawheel/use-translation";

declare global {
  namespace OlapClient {
    export = OlapClnt;
  }
  namespace I18N {
    export = UseTranslation;
  }

  interface ASDF {}
}
