import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import Colors from "@constants/Colors";
import Button from "@components/Button";
import TextInput from "@/components/TextInput";
import styles from "@/styles/AuthScreen.style";
import { useState } from "react";
import axios from "axios";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors = { email: "", username: "", password: "" };
    let valid = true;

    if (!form.username) {
      newErrors.username = "Username is required.";
      valid = false;
    }
    if (!form.password) {
      newErrors.password = "Password is required.";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    console.log("login presesd!");

    if (!validateForm()) return;

    try {
      const response = await axios.post(
        "http://192.168.56.1:3000/api/auth/login",
        {
          identifier: form.username,
          password: form.password,
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "User logged in successfully", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data.message || "Login failed.";
        Alert.alert("Error", message);
      } else {
        Alert.alert("Error", "Network error. Please try again later.");
      }
    }
  };
  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "http://192.168.56.1:3000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        Alert.alert("Success", "Logged out successfully", [
          {
            text: "OK",
            onPress: () => router.replace("/login"), // Redirect to login or home screen
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

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
            label="Username"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />
          {errors.username ? (
            <Text style={styles.errorText}>{errors.username}</Text>
          ) : null}
          <TextInput
            label="Password"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}
          <Button
            title="Sign In"
            onPress={handleLogin}
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
        <Button
          title="Log Out"
          onPress={handleLogout}
          buttonStyle={{
            backgroundColor: Colors.light.tint,
            borderRadius: 8,
            marginTop: 20,
          }}
        />
      </View>
    </SafeAreaView>
  );
}
