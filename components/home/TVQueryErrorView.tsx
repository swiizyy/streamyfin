import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/common/Text";
import { useScaledTVTypography } from "@/constants/TVTypography";

export const TVQueryErrorView: React.FC = () => {
  const { t } = useTranslation();
  const typography = useScaledTVTypography();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: typography.heading,
          fontWeight: "bold",
          marginBottom: 8,
          color: "#FFFFFF",
        }}
      >
        {t("home.oops")}
      </Text>
      <Text
        style={{
          textAlign: "center",
          opacity: 0.7,
          fontSize: typography.body,
          color: "#FFFFFF",
        }}
      >
        {t("home.error_message")}
      </Text>
    </View>
  );
};
