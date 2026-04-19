// PayPal JS SDK type declarations
// Loaded via <script> tag from https://www.paypal.com/sdk/js

interface PayPalButtonsStyle {
  layout?: "vertical" | "horizontal";
  color?: "gold" | "blue" | "silver" | "white" | "black";
  shape?: "rect" | "pill";
  label?: "paypal" | "checkout" | "buynow" | "pay";
  tagline?: boolean;
  height?: number;
}

interface PayPalButtonsConfig {
  style?: PayPalButtonsStyle;
  createOrder: () => Promise<string>;
  onApprove: (
    data: { orderID: string; payerID?: string },
    actions: { order: { capture: () => Promise<any> } }
  ) => Promise<void>;
  onError?: (err: Error) => void;
  onCancel?: () => void;
}

interface PayPalButtons {
  render: (container: string | HTMLElement) => void;
}

interface PayPalNamespace {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtons;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

export {};
