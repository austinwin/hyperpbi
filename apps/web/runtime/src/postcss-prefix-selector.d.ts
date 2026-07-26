declare module "postcss-prefix-selector" {
  import type { Plugin } from "postcss";

  export interface PrefixSelectorOptions {
    prefix: string;
    exclude?: Array<string | RegExp>;
    ignoreFiles?: Array<string | RegExp>;
    includeFiles?: Array<string | RegExp>;
    skipGlobalSelectors?: boolean;
    transform?: (
      prefix: string,
      selector: string,
      prefixedSelector: string,
      filePath: string,
    ) => string;
  }

  export default function prefixSelector(options: PrefixSelectorOptions): Plugin;
}
