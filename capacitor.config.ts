import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ianoliveira.dragonballmultiverse",
  appName: "Dragon Ball Multiverse",
  webDir: ".output/public",
  backgroundColor: "#101018",
  android: {
    allowMixedContent: false,
  },
};

export default config;
