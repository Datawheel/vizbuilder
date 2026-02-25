import {MantineProvider} from "@mantine/core";
import {Notifications} from "@mantine/notifications";
import {D3plusContext} from "d3plus-react";
import {createRoot} from "react-dom/client";
import {App} from "./App";
import {FormatterProvider} from "./FormatterProvider";
import {formatters} from "./formatters";
import {TesseractProvider} from "./TesseractProvider";
import {TranslationProvider} from "./TranslationProvider";
import {translations} from "./translations";

const container = document.getElementById("app");
container && mount(container);

function mount(container: HTMLElement) {
  const root = createRoot(container);
  root.render(
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <D3plusContext.Provider value={{colorScalePosition: "bottom"}}>
        <TesseractProvider serverURL={new URL("/tesseract/", location.href)}>
          <TranslationProvider defaultLocale="en" translations={translations}>
            <FormatterProvider items={formatters}>
              <App />
              <Notifications />
            </FormatterProvider>
          </TranslationProvider>
        </TesseractProvider>
      </D3plusContext.Provider>
    </MantineProvider>,
  );
}
