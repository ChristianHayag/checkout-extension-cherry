import {
  reactExtension,
  BlockStack,
  Text,
  Button,
  useTranslate,
} from "@shopify/ui-extensions-react/checkout";

// 1. Choose an extension target
export default reactExtension("purchase.thank-you.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();

  return (
    <BlockStack spacing="tight" padding="tight">
      {/* Heading */}
      <Text size="large" emphasis="bold">
        {translate("thankYouHeading", { defaultValue: "Thank you for your order!" })}
      </Text>

      {/* Subheading */}
      <Text>{translate("thankYouSubheading", { defaultValue: "We appreciate your business." })}</Text>

      {/* Button */}
      <Button onPress={() => alert("Button pressed")}>
        {translate("thankYouButton", { defaultValue: "Track my order" })}
      </Button>
    </BlockStack>
  );
}