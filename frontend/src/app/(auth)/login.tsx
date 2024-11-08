import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Link, useRouter } from "expo-router";
import Colors from "@constants/Colors";
import Button from "@components/Button";
import TextInput from "@/components/TextInput";
import styles from "@/styles/AuthScreen.style";

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.text}>
            Enter your email and password for signing in. Thanks{" "}
          </Text>
        </View>
        <View style={styles.inputsContainer}>
          <TextInput
            label="Email"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
          />
          <TextInput
            label="Password"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
          />
          <Button
            title="Sign In"
            onPress={() => alert("Button Pressed!")}
            buttonStyle={{
              backgroundColor: Colors.light.purple,
              borderRadius: 8,
            }}
          />
        </View>
        <View style={styles.registerContainer}>
          <Text>Don't have an account yet? </Text>
          <Text
            style={styles.registerText}
            onPress={() => router.replace("/register")}
          >
            Register
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
