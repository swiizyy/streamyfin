import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { useScaledTVTypography } from "@/constants/TVTypography";
import { scaleSize } from "@/utils/scaleSize";

const HORIZONTAL_PADDING = scaleSize(60);

interface TVNetworkErrorViewProps {
  isConnected: boolean;
  serverConnected: boolean | null;
  retryLoading: boolean;
  onRetry: () => void;
}

export const TVNetworkErrorView: React.FC<TVNetworkErrorViewProps> = ({
  isConnected,
  serverConnected,
  retryLoading,
  onRetry,
}) => {
  const { t } = useTranslation();
  const typography = useScaledTVTypography();

  let title = "";
  let subtitle = "";

  if (!isConnected) {
    title = t("home.no_internet");
    subtitle = t("home.no_internet_message");
  } else if (serverConnected === null) {
    title = t("home.checking_server_connection");
    subtitle = t("home.checking_server_connection_message");
  } else if (!serverConnected) {
    title = t("home.server_unreachable");
    subtitle = t("home.server_unreachable_message");
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: HORIZONTAL_PADDING,
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
        {title}
      </Text>
      <Text
        style={{
          textAlign: "center",
          opacity: 0.7,
          fontSize: typography.body,
          color: "#FFFFFF",
        }}
      >
        {subtitle}
      </Text>

      <View style={{ marginTop: 24 }}>
        <Button
          color='black'
          onPress={onRetry}
          justify='center'
          className='px-4'
          iconRight={
            retryLoading ? null : (
              <Ionicons name='refresh' size={24} color='white' />
            )
          }
        >
          {retryLoading ? (
            <ActivityIndicator size='small' color='white' />
          ) : (
            t("home.retry")
          )}
        </Button>
      </View>
    </View>
  );
};
