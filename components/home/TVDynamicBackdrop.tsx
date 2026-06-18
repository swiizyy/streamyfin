import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, View } from "react-native";

interface TVDynamicBackdropProps {
  layer0Url: string | null;
  layer1Url: string | null;
  layer0Opacity: Animated.Value;
  layer1Opacity: Animated.Value;
}

export const TVDynamicBackdrop: React.FC<TVDynamicBackdropProps> = ({
  layer0Url,
  layer1Url,
  layer0Opacity,
  layer1Opacity,
}) => {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: layer0Opacity,
        }}
      >
        {layer0Url && (
          <Image
            source={{ uri: layer0Url }}
            style={{ width: "100%", height: "100%" }}
            contentFit='cover'
          />
        )}
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: layer1Opacity,
        }}
      >
        {layer1Url && (
          <Image
            source={{ uri: layer1Url }}
            style={{ width: "100%", height: "100%" }}
            contentFit='cover'
          />
        )}
      </Animated.View>
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.95)"]}
        locations={[0, 0.4, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "100%",
        }}
      />
    </View>
  );
};
