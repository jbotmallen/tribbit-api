import React, { useEffect } from "react";
import { View, Text, Image } from "react-native";
import * as SplashScreen from "expo-splash-screen";
export default function App() {
  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync(); // Prevent splash screen from auto hiding
      // You can load assets or do other setup here
      setTimeout(() => {
        SplashScreen.hideAsync(); // Hide splash screen after setup
      }, 2000); // Wait for 2 seconds before hiding
    }
    prepare();
  }, []);
  // useEffect(() => {
  //   // Log the image path to check if it's correct
  //   console.log(require("../assets/images/tribbit-icon.png"));
  // }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to FoodOrdering App!</Text>
    </View>
  );
}
